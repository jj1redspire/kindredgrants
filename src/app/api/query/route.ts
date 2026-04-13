import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { question, org_id } = await req.json()

    if (!question || !org_id) {
      return NextResponse.json({ error: 'Missing question or org_id' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Embed the question
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: question,
    })
    const queryEmbedding = embeddingResponse.data[0].embedding

    // 2. Vector search
    const { data: chunks, error: searchError } = await supabase.rpc('kg_match_chunks', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_org_id: org_id,
      match_count: 10,
      match_threshold: 0.3,
    })

    if (searchError) {
      console.error('Vector search error:', searchError)
    }

    // 3. Get document names
    const docIds = Array.from(new Set((chunks || []).map((c: { document_id: string }) => c.document_id)))
    let docMap: Record<string, string> = {}
    if (docIds.length > 0) {
      const { data: docs } = await supabase
        .from('kg_documents')
        .select('id, filename, document_type')
        .in('id', docIds)
      if (docs) {
        docMap = Object.fromEntries(docs.map((d) => [d.id, d.filename]))
      }
    }

    const contextChunks = (chunks || [])
      .map((chunk: { content: string; document_id: string }) => {
        const docName = docMap[chunk.document_id] || 'Unknown Document'
        return `[Source: ${docName}]\n${chunk.content}`
      })
      .join('\n\n---\n\n')

    const hasContext = contextChunks.trim().length > 0

    // 4. Ask Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: `You are an AI assistant helping a nonprofit grant writer quickly find information from their organization's documents.

Answer the question using ONLY the provided document excerpts. Be specific and cite exact numbers, names, and dates from the documents when available.

If the answer is not in the provided documents, say "This information is not in your uploaded documents. Consider uploading [relevant document type] to find this data."

Keep answers concise (2–4 sentences unless more detail is needed). Do not add information from outside the provided excerpts.`,
      messages: [
        {
          role: 'user',
          content: hasContext
            ? `Document excerpts:\n\n${contextChunks}\n\nQuestion: ${question}`
            : `No documents have been uploaded yet.\n\nQuestion: ${question}`,
        },
      ],
    })

    const answer = response.content[0].type === 'text' ? response.content[0].text : ''
    const sources = Array.from(new Set((chunks || []).map((c: { document_id: string }) => docMap[c.document_id] || '').filter(Boolean)))

    return NextResponse.json({ answer, sources })
  } catch (err) {
    console.error('Query error:', err)
    return NextResponse.json({ error: 'Query failed. Please try again.' }, { status: 500 })
  }
}

export const maxDuration = 30
