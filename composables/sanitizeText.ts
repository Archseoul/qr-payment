export function sanitizeText (text:string|null) {
  if (!text) { return '' }
  return text.replace(/<\s*script\s*>|<\s*\/\s*script\s*>|<\s*iframe\s*>|<\s*\/\s*iframe\s*>/g, '')
}
