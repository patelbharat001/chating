import * as crypto from 'https://deno.land/std@0.208.0/crypto/mod.ts';

export interface ParsedPrompt {
  title: string;
  description: string;
  content: string;
  source: string;
  source_url: string;
  author: string;
  content_hash: string;
}

export function hashContent(content: string): string {
  const encoded = new TextEncoder().encode(content);
  const hashBuffer = crypto.subtle.digestSync('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

export function cleanPromptText(content: string): string {
  // Remove excessive whitespace, trim to reasonable length
  return content
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
}

export function validatePrompt(prompt: any): boolean {
  return !!(
    prompt.title && typeof prompt.title === 'string' &&
    prompt.content && typeof prompt.content === 'string' &&
    prompt.source && typeof prompt.source === 'string' &&
    prompt.source_url && typeof prompt.source_url === 'string'
  );
}
