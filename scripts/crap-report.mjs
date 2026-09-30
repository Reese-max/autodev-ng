import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'

const args = process.argv.slice(2)
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : fallback
}
const canonical = file => resolve(file).replaceAll('\\', '/')
const filesArg = valueAfter('--files')
if (!filesArg || filesArg.startsWith('--')) throw new Error('Usage: node scripts/crap-report.mjs --files <comma-separated-ts-files> [--coverage <path>] [--max <number>]')

const coveragePath = resolve(process.cwd(), valueAfter('--coverage', 'coverage/coverage-final.json'))
const max = Number(valueAfter('--max', 30))
if (!Number.isFinite(max) || max < 1) throw new Error('--max must be a positive number')

const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'))
const targets = filesArg.split(',').map(file => canonical(resolve(process.cwd(), file.trim()))).filter(Boolean)
const complexity = []

function decision(node) {
  let value = 0
  const visit = child => {
    if (ts.isIfStatement(child) || ts.isForStatement(child) || ts.isForInStatement(child)
      || ts.isForOfStatement(child) || ts.isWhileStatement(child) || ts.isDoStatement(child)
      || ts.isCatchClause(child) || ts.isConditionalExpression(child)
      || ts.isCaseClause(child)) value++
    if (ts.isBinaryExpression(child) && (child.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
      || child.operatorToken.kind === ts.SyntaxKind.BarBarToken
      || child.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) value++
    ts.forEachChild(child, visit)
  }
  ts.forEachChild(node.body ?? node, visit)
  return value + 1
}

function collect(node, sourceFile) {
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)
    || ts.isFunctionExpression(node) || ts.isGetAccessor(node) || ts.isSetAccessor(node)
    || ts.isConstructorDeclaration(node)) {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1
    complexity.push({ file: canonical(sourceFile.fileName), start, end, value: decision(node) })
  }
  ts.forEachChild(node, child => collect(child, sourceFile))
}

for (const file of targets) {
  const source = readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  collect(sf, sf)
}

const rows = []
for (const [file, data] of Object.entries(coverage)) {
  const absolute = canonical(file)
  if (!targets.includes(absolute)) continue
  for (const [id, fn] of Object.entries(data.fnMap ?? {})) {
    const line = fn.loc?.start?.line
    if (!Number.isInteger(line)) continue
    const matches = complexity.filter(item => item.file === absolute && item.start <= line && item.end >= line)
    const c = (matches.sort((a, b) => (a.end - a.start) - (b.end - b.start))[0]?.value) ?? 1
    const hit = Number(data.f?.[id] ?? 0)
    const cov = hit > 0 ? 1 : 0
    const crap = c ** 2 * (1 - cov) ** 3 + c
    rows.push({ file: absolute, line, name: fn.name ?? '<anonymous>', complexity: c, coverage: cov, crap })
  }
}

if (!rows.length) throw new Error(`No coverage functions found for ${targets.map(file => file.replace(process.cwd(), '.')).join(', ')}`)
rows.sort((a, b) => b.crap - a.crap)
console.log(JSON.stringify({ schema: 'crap/v1', max, files: targets, functions: rows }, null, 2))
const offenders = rows.filter(row => row.crap > max)
if (offenders.length) {
  console.error(`CRAP gate failed: ${offenders.length} function(s) exceed ${max}`)
  process.exitCode = 1
} else {
  console.log(`CRAP gate passed: ${rows.length} function(s), max=${Math.max(...rows.map(row => row.crap)).toFixed(2)}`)
}
