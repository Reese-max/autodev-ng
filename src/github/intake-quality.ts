/** Issue Quality metadata is a veto only; it never grants author/label approval. */
export function issueQualityVeto(body: string | null): string | undefined {
  if (!body) return undefined
  if (body.length > 64_000) return 'issue-quality-input-too-long'
  const blocks: string[] = []
  let open: { marker: string; yaml: boolean; lines: string[] } | undefined
  const isMetadata = (text: string) => /^\s*(?:issue_quality_version|auto_implementation|triage)\s*:/im.test(text)
  for (const line of body.split(/\r?\n/)) {
    if (!open) {
      const fence = /^ {0,3}(`{3,}|~{3,})[ \t]*(\S*)[ \t]*$/.exec(line)
      if (fence) open = { marker: fence[1]!, yaml: /^(?:yaml|yml)$/i.test(fence[2]!), lines: [] }
    } else {
      const closing = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line)?.[1]
      if (closing && closing[0] === open.marker[0] && closing.length >= open.marker.length) {
        const text = open.lines.join('\n')
        if (open.yaml && isMetadata(text)) blocks.push(text)
        open = undefined
      } else open.lines.push(line)
    }
  }
  // A malformed/unclosed metadata block must not silently become an ordinary Issue.
  if (open?.yaml && isMetadata(open.lines.join('\n'))) return 'issue-quality-malformed-block'
  if (!blocks.length) return undefined
  if (blocks.length !== 1) return 'issue-quality-ambiguous-blocks'
  if (blocks[0]!.length > 4096) return 'issue-quality-metadata-too-long'
  const values = new Map<string, string>()
  for (const line of blocks[0]!.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue
    // Deliberately a bounded scalar subset: no YAML tags, aliases, nested data or evaluation.
    const row = /^([a-z_]+):\s*([A-Za-z0-9_.-]+)\s*(?:#.*)?$/.exec(line)
    if (!row || values.has(row[1]!)) return 'issue-quality-malformed-metadata'
    values.set(row[1]!, row[2]!)
  }
  if (values.get('issue_quality_version') !== '2') return 'issue-quality-unsupported-version'
  const implementation = values.get('auto_implementation')
  if (implementation !== 'true' && implementation !== 'false') return 'issue-quality-invalid-implementation-flag'
  if (implementation === 'false') return 'issue-quality-auto-implementation-denied'
  const kind = values.get('kind')?.toUpperCase()
  const triage = values.get('triage')?.toUpperCase()
  if (!kind || !['BUG', 'FEATURE', 'IMPLEMENTATION', 'VALIDATION_GAP', 'RESEARCH', 'OPPORTUNITY'].includes(kind)) return 'issue-quality-invalid-kind'
  if (kind === 'RESEARCH' || kind === 'OPPORTUNITY') return 'issue-quality-research-requires-review'
  if (triage !== 'READY') return 'issue-quality-not-ready'
  return undefined
}
