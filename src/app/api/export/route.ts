import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { grant_id, format } = await req.json()

    if (!grant_id || !format) {
      return NextResponse.json({ error: 'Missing grant_id or format' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Load grant + sections
    const { data: grant } = await supabase
      .from('kg_grants')
      .select('*')
      .eq('id', grant_id)
      .single()

    if (!grant) {
      return NextResponse.json({ error: 'Grant not found' }, { status: 404 })
    }

    const { data: sections } = await supabase
      .from('kg_sections')
      .select('*')
      .eq('grant_id', grant_id)
      .order('created_at')

    if (format === 'docx') {
      return exportDocx(grant, sections || [])
    } else if (format === 'pdf') {
      return exportPdf(grant, sections || [])
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (err) {
    console.error('Export error:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

interface GrantRecord {
  funder_name: string
  program_name: string | null
  deadline: string | null
  funding_amount: number | null
}

interface SectionRecord {
  section_name: string
  user_edited: string | null
  ai_draft: string | null
}

async function exportDocx(grant: GrantRecord, sections: SectionRecord[]) {
  const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = await import('docx')

  const children = [
    // Cover
    new Paragraph({
      text: grant.funder_name,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: grant.program_name || 'Grant Application',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: grant.deadline ? `Deadline: ${new Date(grant.deadline).toLocaleDateString()}` : '', color: '666666' }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: grant.funding_amount ? `Amount Requested: $${grant.funding_amount.toLocaleString()}` : '', color: '666666' }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
  ]

  // Sections
  for (const section of sections) {
    const content = section.user_edited || section.ai_draft || ''
    if (!content) continue

    children.push(
      new Paragraph({
        text: section.section_name,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 100 },
      })
    )

    // Split by paragraphs
    const paragraphs = content.split(/\n\n+/).filter(Boolean)
    for (const para of paragraphs) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: para.replace(/\n/g, ' '), size: 24 })],
          spacing: { before: 100, after: 100 },
        })
      )
    }
  }

  const doc = new Document({
    sections: [{ children }],
    styles: {
      default: {
        document: {
          run: { font: 'Cambria', size: 24 },
        },
      },
    },
  })

  const buffer = await Packer.toBuffer(doc)
  const uint8 = new Uint8Array(buffer)

  return new NextResponse(uint8, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${grant.funder_name} - Grant Application.docx"`,
    },
  })
}

async function exportPdf(grant: GrantRecord, sections: SectionRecord[]) {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 25
  const contentWidth = pageWidth - margin * 2
  let y = margin

  function addText(text: string, fontSize: number, bold = false, color = '#000000') {
    doc.setFontSize(fontSize)
    doc.setFont('times', bold ? 'bold' : 'normal')
    doc.setTextColor(color)
    const lines = doc.splitTextToSize(text, contentWidth) as string[]
    lines.forEach((line: string) => {
      if (y > 260) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += fontSize * 0.45
    })
  }

  // Cover
  y = 60
  addText(grant.funder_name, 20, true)
  y += 6
  addText(grant.program_name || 'Grant Application', 14, false, '#555555')
  if (grant.deadline) {
    y += 4
    addText(`Deadline: ${new Date(grant.deadline).toLocaleDateString()}`, 11, false, '#777777')
  }
  if (grant.funding_amount) {
    y += 2
    addText(`Amount Requested: $${grant.funding_amount.toLocaleString()}`, 11, false, '#777777')
  }

  // Sections
  for (const section of sections) {
    const content = section.user_edited || section.ai_draft || ''
    if (!content) continue

    doc.addPage()
    y = margin

    addText(section.section_name, 14, true, '#166534')
    y += 5

    const paragraphs = content.split(/\n\n+/).filter(Boolean)
    for (const para of paragraphs) {
      addText(para.replace(/\n/g, ' '), 11)
      y += 4
    }
  }

  const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer
  const uint8 = new Uint8Array(arrayBuffer)

  return new NextResponse(uint8, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${grant.funder_name} - Grant Application.pdf"`,
    },
  })
}

export const maxDuration = 30
