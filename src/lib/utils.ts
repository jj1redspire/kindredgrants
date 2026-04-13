import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysUntil(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

// Chunk text into segments with overlap
export function chunkText(
  text: string,
  targetTokens = 600,
  overlapTokens = 100
): string[] {
  // Rough approximation: 1 token ≈ 4 characters
  const targetChars = targetTokens * 4
  const overlapChars = overlapTokens * 4

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + targetChars, text.length)
    chunks.push(text.slice(start, end))
    if (end === text.length) break
    start = end - overlapChars
  }

  return chunks
}
