import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      grant_id,
      section_id,
      section_name,
      funder_name,
      program_name,
      special_instructions,
      word_limit,
      regen_instruction,
      org_id,
    } = body

    if (!grant_id || !section_name || !org_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Build semantic query for RAG retrieval
    const ragQuery = `${section_name} grant application ${funder_name} ${program_name || ''} organizational narrative`.trim()

    // 2. Embed the query (optional — gracefully skip if OPENAI_API_KEY not set)
    let chunks: { document_id: string; content: string }[] | null = null
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: ragQuery,
      })
      const queryEmbedding = embeddingResponse.data[0].embedding

      // 3. Vector search for relevant chunks
      const { data: chunkData, error: searchError } = await supabase.rpc('kg_match_chunks', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_org_id: org_id,
        match_count: 15,
        match_threshold: 0.25,
      })
      if (searchError) console.error('Vector search error:', searchError)
      else chunks = chunkData
    } catch (embErr) {
      console.error('Embedding/RAG skipped (no OPENAI_API_KEY or RPC unavailable):', embErr instanceof Error ? embErr.message : embErr)
    }

    // 4. Get document names for context
    const docIds = Array.from(new Set((chunks || []).map((c: { document_id: string }) => c.document_id)))
    let docMap: Record<string, string> = {}
    if (docIds.length > 0) {
      const { data: docs } = await supabase
        .from('kg_documents')
        .select('id, filename, document_type')
        .in('id', docIds)
      if (docs) {
        docMap = Object.fromEntries(docs.map((d) => [d.id, `${d.filename} (${d.document_type})`]))
      }
    }

    // 5. Format chunks for the prompt
    const contextChunks = (chunks || [])
      .map((chunk: { content: string; document_id: string; similarity: number }, i: number) => {
        const docName = docMap[chunk.document_id] || 'Unknown Document'
        return `[DOCUMENT ${i + 1}: ${docName}]\n${chunk.content}`
      })
      .join('\n\n---\n\n')

    const hasContext = contextChunks.trim().length > 0

    // 6. Build system prompt
    const systemPrompt = `You are KindredGrants, a professional grant writer that drafts compelling grant narratives using an organization's own data.

You have been provided with excerpts from the organization's documents (990 tax returns, financial statements, board bios, program descriptions, outcomes data, and past successful grants).

Write the "${section_name}" section for a grant application to ${funder_name}${program_name ? ` for the ${program_name} program` : ''}.

Rules:
1. Use ONLY information from the provided document excerpts. Do not fabricate statistics, dates, names, or outcomes.
2. If a specific data point would strengthen the narrative but is not in the provided excerpts, mark it as [DATA NEEDED: brief description] so the user knows what to add.
3. Write in professional nonprofit prose. Confident but not boastful. Specific, not vague.
4. Use real numbers, real names, real outcomes from the documents whenever available.
5. Match the tone of any past successful grants if provided — the organization has a voice, preserve it.
6. ${word_limit ? `Respect the word limit: approximately ${word_limit} words.` : 'Aim for 300–500 words unless the section warrants more.'}
7. Structure the section with clear topic sentences and logical flow.
8. Do not include section headings in your output — the UI handles that.

${regen_instruction ? `User instruction for this regeneration: ${regen_instruction}` : ''}
${special_instructions ? `Special instructions for this application: ${special_instructions}` : ''}

${!hasContext ? 'WARNING: No relevant documents found in the knowledge base for this query. Generate a placeholder with [DATA NEEDED] markers throughout, indicating what information the organization should upload.' : ''}

Return valid JSON only:
{
  "content": "the full section text",
  "sources_used": ["list of document names used"],
  "data_gaps": ["each [DATA NEEDED] item as a plain string, without the [DATA NEEDED: ] wrapper"],
  "word_count": number
}`

    const userMessage = hasContext
      ? `Here are the relevant excerpts from the organization's documents:\n\n${contextChunks}\n\nNow write the "${section_name}" section.`
      : `No documents have been uploaded yet. Write a "${section_name}" section template with [DATA NEEDED] placeholders.`

    // 7. Generate with Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    // 8. Parse JSON response
    let parsed: {
      content: string
      sources_used: string[]
      data_gaps: string[]
      word_count: number
    }

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/) || rawText.match(/(\{[\s\S]*\})/)
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : rawText
      parsed = JSON.parse(jsonStr)
    } catch {
      // Fallback: treat entire response as content
      parsed = {
        content: rawText,
        sources_used: chunks ? Array.from(new Set((chunks as { document_id: string }[]).map((c) => docMap[c.document_id] || 'Unknown'))) : [],
        data_gaps: [],
        word_count: rawText.split(/\s+/).filter(Boolean).length,
      }
    }

    // 9. Update section in DB if section_id provided
    if (section_id) {
      await supabase.from('kg_sections').update({
        ai_draft: parsed.content,
        sources_used: parsed.sources_used,
        data_gaps: parsed.data_gaps,
        word_count: parsed.word_count,
      }).eq('id', section_id)
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Generate section error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg, anthropic_set: !!process.env.ANTHROPIC_API_KEY, openai_set: !!process.env.OPENAI_API_KEY }, { status: 500 })
  }
}

export const maxDuration = 60
