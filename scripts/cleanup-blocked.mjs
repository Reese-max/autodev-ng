import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { parseBacklog, taskId, withBacklogLock } from '../dist/backlog.js'

const PROJECTS = [
  ['autodev-self', 'D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/BACKLOG.md'],
  ['gooaye', 'D:/Users/Administrator/Desktop/Gooaye 股癌/BACKLOG-adng.md'],
  ['neciken', 'D:/Users/Administrator/Desktop/南西肯恩/neciken-summer-poem/BACKLOG-adng.md'],
  ['note-filler', 'D:/Users/Administrator/Desktop/筆記補齊/BACKLOG-adng.md'],
  ['prompt-autoresearch', 'D:/Users/Administrator/Desktop/Prompt AutoResearch/BACKLOG-adng.md'],
  ['taiwan-intel', 'D:/Users/Administrator/Desktop/爬蟲資料/taiwan-intel-dashboard/BACKLOG-adng.md'],
]

const BLOCKED_REASON_RE = /<!--\s*adng:blocked\b\s+reason=(.*?)\s*-->/
const REEVALUATED_RE = /<!--\s*adng:reevaluated\b/

function safeReopenClass(reason, raw) {
  if (REEVALUATED_RE.test(raw)) return null
  const text = reason.toLowerCase()
  if (/verify 拒收|review-reject|judge-mismatch|artifact-missing|assertion|測試失敗|tests? fail|pytest|merge-conflict|dirty-worktree|branch-switched|not-a-git-repo|worktree-locked/.test(text)) return null
  if (/completion-gate|auto-goal-context-unreadable|acceptance-failed|missing-expected-change|head-commit-mismatch|commit-invalid/.test(text)) return 'goal-gate'
  if (/workspace-write|read-only|readonly|唯讀|權限|permission denied|operation not permitted/.test(text)) return 'permission'
  if (/timeout|timed out|\b429\b|\b503\b|quota|rate.?limit|request queue|queue is full|model.{0,30}not found|provider|connection|econn|empty-output|no-commit|streaming response failed|日額度|daily.{0,20}(?:cap|limit)|exhausted/.test(text)) return 'supply'
  return null
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex')
}

function oneLine(text, max = 600) {
  const clean = text.replace(/\s+/g, ' ').replace(/<!--|-->/g, '').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`
}

function lineText(task, text) {
  if (!task.engineTag) return text
  return task.rawText?.startsWith(`[engine:${task.engineTag}]`)
    ? `[engine:${task.engineTag}] ${text}`
    : `${text} [engine:${task.engineTag}]`
}

function cleanTaskText(raw, fallback) {
  const body = raw
    .replace(/^- \[(?: |x)\]\s*/, '')
    .replace(/<!--\s*adng:[\s\S]*?-->/g, '')
    .replace(/^\[engine:[\w-]+\]\s*/, '')
    .replace(/\s*\[engine:[\w-]+\]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
  return body || fallback
}

function statusCounts(text) {
  const tasks = parseBacklog(text)
  return {
    open: tasks.filter(task => task.status === 'open').length,
    blocked: tasks.filter(task => task.status === 'blocked').length,
    superseded: tasks.filter(task => task.status === 'superseded').length,
    done: tasks.filter(task => task.status === 'done').length,
  }
}

function transformBacklog(content, batch) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n'
  const lines = content.split(/\r?\n/)
  const tasks = parseBacklog(content)
  const existingIds = new Set(tasks.map(task => task.id))
  const blocked = tasks.filter(task => task.status === 'blocked')
  const appendLines = []
  const archive = []

  for (const task of blocked) {
    const raw = lines[task.line] ?? ''
    const match = BLOCKED_REASON_RE.exec(raw)
    if (!match) throw new Error(`${task.id} blocked reason 缺失或格式錯誤`)
    let reason
    try { reason = JSON.parse(match[1]) } catch { throw new Error(`${task.id} blocked reason 不是合法 JSON 字串`) }
    if (typeof reason !== 'string') throw new Error(`${task.id} blocked reason 不是字串`)

    const reopenClass = safeReopenClass(reason, raw)
    if (!reopenClass) {
      archive.push({ action: 'retain', id: task.id, line: task.line + 1, reason, raw })
      continue
    }

    const text = `${cleanTaskText(raw, task.text)}（blocked 清理重開：原任務 ${task.id}；先修正：${oneLine(reason)}）`
    const id = taskId(text)
    if (existingIds.has(id)) throw new Error(`新任務 ID ${id} 已存在，停止以免重複派工`)
    existingIds.add(id)
    appendLines.push(`- [ ] ${lineText(task, text)} <!-- adng:autopilot goal:${batch} round:1 id:${id} reopen-from:${task.id} --> <!-- adng:reevaluated class:${reopenClass} -->`)
    lines[task.line] = `${raw} <!-- adng:superseded by:${id} -->`
    archive.push({ action: 'reopen', class: reopenClass, id: task.id, reopenedId: id, line: task.line + 1, reason, raw })
  }

  const kept = lines
  while (kept.length > 0 && kept.at(-1) === '') kept.pop()
  const next = [...kept, ...appendLines, ''].join(eol)
  const after = statusCounts(next)
  const reopened = archive.filter(item => item.action === 'reopen').length
  if (after.blocked !== blocked.length - reopened || after.superseded !== statusCounts(content).superseded + reopened) {
    throw new Error(`轉換計數不守恆：before=${JSON.stringify(statusCounts(content))} after=${JSON.stringify(after)} reopened=${reopened}`)
  }
  return { next, archive, before: statusCounts(content), after }
}

function writeAtomic(file, text) {
  const temp = `${file}.cleanup-${process.pid}.tmp`
  writeFileSync(temp, text)
  try { renameSync(temp, file) } catch (error) {
    try { rmSync(temp, { force: true }) } catch {}
    throw error
  }
}

function captureWorktrees(root) {
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => {
    const cwd = join(root, entry.name)
    const git = args => {
      try {
        return execFileSync('git', ['-c', 'safe.directory=*', '-C', cwd, ...args], {
          encoding: 'utf8', timeout: 10_000, windowsHide: true,
        }).trim()
      } catch (error) {
        return `ERROR: ${String(error.stderr || error.message).trim()}`
      }
    }
    return {
      id: entry.name,
      path: cwd,
      head: git(['rev-parse', 'HEAD']),
      branch: git(['branch', '--show-current']),
      status: git(['status', '--porcelain']),
    }
  })
}

function selfTest() {
  const blockedText = '修正功能'
  const blockedId = taskId(blockedText)
  const splitText = '大型任務'
  const splitId = taskId(splitText)
  const sample = [
    '- [x] 已完成 <!-- adng:done abc -->',
    `- [ ] ${blockedText} <!-- adng:blocked reason="timeout" -->`,
    '- [ ] 真驗收失敗 <!-- adng:blocked reason="verify 拒收：review-reject:測試紅" -->',
    `- [ ] ${splitText} <!-- adng:superseded-by-split parts:1 -->`,
    `- [ ] 子任務 <!-- adng:split {"parentId":"${splitId}","part":1,"depth":1,"shape":"sequential"} -->`,
    '',
  ].join('\n')
  const result = transformBacklog(sample, 'self-test')
  if (result.before.blocked !== 2 || result.after.blocked !== 1 || result.after.superseded !== 2 || result.after.open !== 2) {
    throw new Error(`self-test 計數錯誤：${JSON.stringify(result)}`)
  }
  if (!result.next.includes(`reopen-from:${blockedId}`) || !result.next.includes('superseded-by-split')) {
    throw new Error('self-test 追溯或 superseded 保留錯誤')
  }
  console.log('SELF_TEST_OK')
}

function dryRun() {
  let total = 0
  for (const [name, file] of PROJECTS) {
    const result = transformBacklog(readFileSync(file, 'utf8'), 'blocked-cleanup-dry-run')
    total += result.archive.filter(row => row.action === 'reopen').length
    console.log(JSON.stringify({ name, file, before: result.before, after: result.after,
      reopen: result.archive.filter(row => row.action === 'reopen').length,
      retained: result.archive.filter(row => row.action === 'retain').length }))
  }
  console.log(`DRY_RUN_OK safeReopen=${total}`)
}

function apply() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const batch = `blocked-cleanup-${stamp}`
  const safeguard = `D:/adng-safeguards/${batch}`
  mkdirSync(safeguard, { recursive: true })
  const manifest = { batch, createdAt: new Date().toISOString(), safeguard, projects: [] }

  for (const [name, file] of PROJECTS) {
    const projectDir = join(safeguard, name)
    mkdirSync(projectDir, { recursive: true })
    const row = withBacklogLock(file, () => {
      const beforeText = readFileSync(file, 'utf8')
      const result = transformBacklog(beforeText, batch)
      const backup = join(projectDir, basename(file))
      copyFileSync(file, backup)
      writeFileSync(join(projectDir, 'blocked-archive.jsonl'), `${result.archive.map(item => JSON.stringify(item)).join('\n')}\n`)
      writeAtomic(file, result.next)
      return {
        name, file, backup,
        before: result.before, after: result.after,
        beforeSha256: sha256(beforeText), afterSha256: sha256(result.next),
        reopened: result.archive.filter(item => item.action === 'reopen').length,
        retainedBlocked: result.archive.filter(item => item.action === 'retain').length,
      }
    })
    manifest.projects.push(row)
    console.log(JSON.stringify(row))
  }

  for (const row of manifest.projects) {
    row.worktrees = captureWorktrees(`D:/adng-worktrees/${row.name}`)
  }
  writeFileSync(join(safeguard, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  const restore = manifest.projects.map(row =>
    `Copy-Item -LiteralPath '${row.backup.replaceAll("'", "''")}' -Destination '${row.file.replaceAll("'", "''")}' -Force`).join('\r\n')
  writeFileSync(join(safeguard, 'restore-backlogs.ps1'), `${restore}\r\n`)
  console.log(`APPLY_OK safeguard=${safeguard}`)
}

const mode = process.argv[2] ?? '--dry-run'
if (mode === '--self-test') selfTest()
else if (mode === '--dry-run') dryRun()
else if (mode === '--apply') apply()
else throw new Error(`未知模式：${mode}`)
