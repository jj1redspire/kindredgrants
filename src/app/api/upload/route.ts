import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chunkText } from '@/lib/utils'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const orgId = formData.get('org_id') as string | null
    const documentType = formData.get('document_type') as string | null

    if (!file || !orgId || !documentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Upload file to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const storagePath = `${orgId}/${Date.now()}-${file.name}`

    const { error: storageError } = await supabase.storage
      .from('kg-documents')
      .upload(storagePath, fileBuffer, { contentType: file.type, upsert: false })

    if (storageError) {
      return NextResponse.json({ error: `Storage error: ${storageError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('kg-documents').getPublicUrl(storagePath)

    // 2. Create document record
    const { data: doc, error: docError } = await supabase
      .from('kg_documents')
      .insert({
        org_id: orgId,
        filename: file.name,
        file_url: publicUrl,
        document_type: documentType,
        processing_status: 'processing',
      })
      .select()
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: `DB error: ${docError?.message}` }, { status: 500 })
    }

    // 3. Extract text
    let text = ''
    const mimeType = file.type

    if (mimeType === 'text/plain') {
      text = fileBuffer.toString('utf-8')
    } else if (mimeType === 'application/pdf') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse')
        const pdfData = await pdfParse(fileBuffer)
        text = pdfData.text

        // Update page count
        await supabase
          .from('kg_documents')
          .update({ page_count: pdfData.numpages })
          .eq('id', doc.id)
      } catch (e) {
        console.error('PDF parse error:', e)
        text = '[PDF text extraction failed. Please ensure the PDF contains readable text, not scanned images.]'
      }
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        text = result.value
      } catch (e) {
        console.error('DOCX parse error:', e)
        text = '[DOCX text extraction failed.]'
      }
    }

    if (!text.trim()) {
      await supabase.from('kg_documents').update({ processing_status: 'error' }).eq('id', doc.id)
      return NextResponse.json({ error: 'Could not extract text from document' }, { status: 422 })
    }

    // 4. Chunk text
    const chunks = chunkText(text, 600, 100)

    // 5. Embed each chunk and store
    const chunkRows = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim()
      if (!chunk) continue

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk,
      })

      const embedding = embeddingResponse.data[0].embedding

      chunkRows.push({
        document_id: doc.id,
        org_id: orgId,
        content: chunk,
        embedding: JSON.stringify(embedding),
        chunk_index: i,
        metadata: {
          filename: file.name,
          document_type: documentType,
          chunk_of: chunks.length,
        },
      })
    }

    if (chunkRows.length > 0) {
      // Insert in batches of 50
      for (let i = 0; i < chunkRows.length; i += 50) {
        const batch = chunkRows.slice(i, i + 50)
        const { error: chunkError } = await supabase.from('kg_chunks').insert(batch)
        if (chunkError) {
          console.error('Chunk insert error:', chunkError)
        }
      }
    }

    // 6. Mark complete
    await supabase
      .from('kg_documents')
      .update({ processing_status: 'complete' })
      .eq('id', doc.id)

    return NextResponse.json({
      success: true,
      document_id: doc.id,
      chunks: chunkRows.length,
      filename: file.name,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const maxDuration = 60
