import { expect, test, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, utimesSync, existsSync, writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { spawnSync, spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { acquireLock, releaseLock, releaseDeadLock } from '../src/lock.js'

const STALE = 30 * 60 * 1000

const tempParents: string[] = []
afterEach(() => {
  while (tempParents.length) rmSync(tempParents.pop()!, { recursive: true, force: true })
})

function freshDir(): { parent: string; dir: string } {
  const parent = mkdtempSync(join(tmpdir(), 'adng-lkg-'))
  tempParents.push(parent)
  return { parent, dir: join(parent, 'lock') }
}

function deadPid(): number {
  const dead = spawnSync(process.execPath, ['-e', '0'])
  const pid = dead.pid as number
  try { process.kill(pid, 0); throw new Error(`前置假設破裂：pid ${pid} 還活著`) }
  catch (err) { if ((err as NodeJS.ErrnoException).code !== 'ESRCH') throw err }
  return pid
}

/** 手刻一個「前代鎖」：可指定 token（模擬新格式）或省略（模擬舊版相容）。 */
function makeDeadLock(dir: string, token?: string): { pid: number; startedAt: string; token?: string } {
  mkdirSync(dir)
  const info = { pid: deadPid(), startedAt: new Date(Date.now() - 120_000).toISOString(), ...(token ? { token } : {}) }
  writeFileSync(join(dir, 'pid.json'), JSON.stringify(info))
  return info
}

test('acquireLock 回傳身分 token；pid.json 記錄同 token', () => {
  const { dir } = freshDir()
  const token = acquireLock(dir)
  expect(typeof token).toBe('string')
  const pidFile = JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8'))
  expect(pidFile.pid).toBe(process.pid)
  expect(pidFile.token).toBe(token)
  releaseLock(dir, token)
})

test('releaseLock 驗證 token：錯誤 token 不刪；正確 token 才刪', () => {
  const { dir } = freshDir()
  const token = acquireLock(dir)!
  releaseLock(dir, 'wrong-token')
  expect(existsSync(dir)).toBe(true)
  releaseLock(dir, token)
  expect(existsSync(dir)).toBe(false)
})

test('舊 token／重複 release 不刪新世代鎖（issue #39 核心迴歸）', () => {
  const { dir } = freshDir()
  const t1 = acquireLock(dir)!
  releaseLock(dir, t1)
  expect(existsSync(dir)).toBe(false)
  const t2 = acquireLock(dir)!
  // 姍姍來遲的舊持有者 release：不可刪掉新世代
  releaseLock(dir, t1)
  expect(existsSync(dir)).toBe(true)
  expect(JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8')).token).toBe(t2)
  releaseLock(dir, t2)
  releaseLock(dir, t2) // 重複 release：dir 已不存在，no-op 不炸
  expect(existsSync(dir)).toBe(false)
})

test('無 token（undefined/null）的 release 一律 no-op', () => {
  const { dir } = freshDir()
  acquireLock(dir)
  releaseLock(dir)
  releaseLock(dir, null)
  releaseLock(dir, undefined)
  expect(existsSync(dir)).toBe(true)
})

test('A/B 決定性交錯：觀察死亡後新世代出現，回收者不可偷走它', () => {
  const { dir } = freshDir()
  const gen1 = makeDeadLock(dir, 'gen-A-token')

  // B 進入回收互斥後、搬走之前，目錄被換成新世代（模擬 A 已完成回收＋重建）。
  const bResult = acquireLock(dir, STALE, {
    insideReclaim: () => {
      rmSync(dir, { recursive: true, force: true })
      mkdirSync(dir)
      writeFileSync(join(dir, 'pid.json'), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), token: 'gen-B-token' }))
    },
  })

  expect(bResult).toBeNull() // 觀察到的世代已消失 → 讓步，不可偷
  const current = JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8'))
  expect(current.token).toBe('gen-B-token') // 新世代完好
  expect(gen1.token).toBe('gen-A-token')
})

test('回收互斥持有者存在時，其他 acquire 一律讓步（互斥證明）', () => {
  const { dir } = freshDir()
  makeDeadLock(dir, 'gen-A')

  let nestedResult: string | null | undefined
  const bResult = acquireLock(dir, STALE, {
    insideReclaim: () => {
      // 回收者持有互斥期間，任何同路徑 acquire（含另一個回收者）不得成功
      nestedResult = acquireLock(dir, STALE)
    },
  })

  expect(nestedResult).toBeNull()
  expect(bResult).not.toBeNull() // B 自己完成回收
  expect(JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8')).token).toBe(bResult)
  expect(existsSync(`${dir}.reclaim`)).toBe(false) // 互斥殘骸不得殘留
})

test('回收完成後鎖由新持有者持有：第二次 acquire 讓步', () => {
  const { dir } = freshDir()
  makeDeadLock(dir, 'old-gen')
  const token = acquireLock(dir)
  expect(token).not.toBeNull()
  expect(acquireLock(dir)).toBeNull() // 新主人 pid 活著
  releaseLock(dir, token)
})

test('擱置的 .reclaim 互斥（持有者已死）可被打破並完成回收', () => {
  const { dir } = freshDir()
  makeDeadLock(dir)
  const mtx = `${dir}.reclaim`
  mkdirSync(mtx)
  writeFileSync(join(mtx, 'pid.json'), JSON.stringify({ pid: deadPid(), startedAt: new Date().toISOString() }))
  const token = acquireLock(dir)
  expect(token).not.toBeNull()
  expect(existsSync(mtx)).toBe(false)
})

test('活著的 .reclaim 互斥持有者讓回收讓步（不硬搶）', () => {
  const { dir } = freshDir()
  makeDeadLock(dir)
  const mtx = `${dir}.reclaim`
  mkdirSync(mtx)
  writeFileSync(join(mtx, 'pid.json'), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }))
  expect(acquireLock(dir)).toBeNull()
  rmSync(mtx, { recursive: true, force: true })
})

test('複核後搬走前世代被調包：捕獲驗證放還新世代，不誤刪', () => {
  const { dir } = freshDir()
  makeDeadLock(dir, 'gen-A-token')

  // 回收者通過世代複核後、rename 搬走之前，死鎖被清走並由新世代佔位——
  // 模擬「互斥外的移除路徑」（合法 token release／外力）造成的 check→act 缺口。
  const bResult = acquireLock(dir, STALE, {
    beforeRename: () => {
      rmSync(dir, { recursive: true, force: true })
      mkdirSync(dir)
      writeFileSync(join(dir, 'pid.json'), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), token: 'gen-C-token' }))
    },
  })

  expect(bResult).toBeNull() // 捕獲物不是我們觀察的死世代 → 放還並讓步
  const current = JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8'))
  expect(current.token).toBe('gen-C-token') // 新世代被放還原路徑且完好
})

test('複核後搬走前出現 recovery-required 標記：捕獲驗證放還，不刪', () => {
  const { dir } = freshDir()
  makeDeadLock(dir, 'gen-A-token')

  const bResult = acquireLock(dir, STALE, {
    beforeRename: () => {
      writeFileSync(join(dir, 'recovery-required.json'), '{}') // 觀察後才被標記
    },
  })

  expect(bResult).toBeNull()
  expect(existsSync(join(dir, 'pid.json'))).toBe(true)
  expect(existsSync(join(dir, 'recovery-required.json'))).toBe(true) // 標記與死鎖都保留
})

test('損壞互斥殘骸但新鮮（寫入進行中）：不打破，讓步', () => {
  const { dir } = freshDir()
  makeDeadLock(dir)
  const mtx = `${dir}.reclaim`
  mkdirSync(mtx)
  writeFileSync(join(mtx, 'pid.json'), 'corrupt{{') // 無法解析 → unknown 且新鮮
  expect(acquireLock(dir)).toBeNull()
  rmSync(mtx, { recursive: true, force: true })
})

test('舊格式鎖可用 legacy:pid:startedAt 指紋釋放', () => {
  const { dir } = freshDir()
  const info = makeDeadLock(dir) // 無 token 的舊格式
  releaseLock(dir, `legacy:${info.pid}:${info.startedAt}`)
  expect(existsSync(dir)).toBe(false)
})

test('releaseDeadLock：只刪確定死亡的鎖', () => {
  const { dir } = freshDir()
  // 活鎖不刪
  const live = acquireLock(dir)!
  expect(releaseDeadLock(dir)).toBe(false)
  expect(existsSync(dir)).toBe(true)
  releaseLock(dir, live)
  // 死鎖刪除
  makeDeadLock(dir)
  expect(releaseDeadLock(dir)).toBe(true)
  expect(existsSync(dir)).toBe(false)
})

test('releaseDeadLock 不動 recovery-required 標記的鎖', () => {
  const { dir } = freshDir()
  makeDeadLock(dir)
  writeFileSync(join(dir, 'recovery-required.json'), '{}')
  expect(releaseDeadLock(dir)).toBe(false)
  expect(existsSync(dir)).toBe(true)
})

test('舊格式 pid.json（無 token）死鎖仍可被回收（相容）', () => {
  const { dir } = freshDir()
  makeDeadLock(dir) // 無 token 欄位
  const token = acquireLock(dir)
  expect(token).not.toBeNull()
  expect(JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8')).token).toBe(token)
})

test('損壞 pid.json + 過期：回收路徑走 mtime 語意不變', () => {
  const { dir } = freshDir()
  mkdirSync(dir)
  writeFileSync(join(dir, 'pid.json'), 'not json{{{')
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old)
  const token = acquireLock(dir)
  expect(token).not.toBeNull()
})

/** 子進程跑 src/*.ts 需要 resolve hook：Node strip-types 不把 ./lock/internal.js 解析回 .ts。 */
const TS_HOOK = pathToFileURL(join(process.cwd(), 'tests', 'helpers', 'ts-resolve-hook.mjs')).href
const CHILD_NODE_ARGS = ['--experimental-strip-types', '--experimental-loader', TS_HOOK, '--input-type=module']

test('多程序同時搶同一個死鎖：恰好一個贏家', async () => {
  const { dir } = freshDir()
  makeDeadLock(dir)
  const src = join(process.cwd(), 'src', 'lock.ts')
  const url = pathToFileURL(src).href
  // 贏家持鎖 8 秒才退出，讓輸家確實撞上活鎖而非排隊撿屍體。
  const script = `import { acquireLock } from ${JSON.stringify(url)}; const t = acquireLock(process.argv[1]); console.log(t ?? 'NULL'); setTimeout(() => process.exit(0), t ? 8000 : 10)`

  const children = [0, 1, 2].map(() => spawn(process.execPath, [...CHILD_NODE_ARGS, '-e', script, dir], { stdio: ['ignore', 'pipe', 'pipe'] }))
  const outputs = await Promise.all(children.map(child => new Promise<string>((resolve, reject) => {
    let buf = ''
    child.stdout.on('data', (d: Buffer) => { buf += d.toString(); if (buf.includes('\n')) resolve(buf.trim()) })
    child.on('error', reject)
    setTimeout(() => reject(new Error('child output timeout')), 60_000)
  })))
  children.forEach(c => c.kill('SIGKILL'))

  const winners = outputs.filter(o => o !== 'NULL')
  expect(winners.length).toBe(1) // 同一時刻最多一個有效持有者
}, 120_000)

test('持鎖子程序被 SIGKILL 後，鎖可被回收（崩潰回收）', async () => {
  const { dir } = freshDir()
  const src = join(process.cwd(), 'src', 'lock.ts')
  const url = pathToFileURL(src).href
  const script = `import { acquireLock } from ${JSON.stringify(url)}; const t = acquireLock(process.argv[1]); console.log(t ?? 'NULL'); setInterval(() => {}, 1000)`
  const child = spawn(process.execPath, [...CHILD_NODE_ARGS, '-e', script, dir], { stdio: ['ignore', 'pipe', 'pipe'] })

  const token = await new Promise<string>((resolve, reject) => {
    let buf = ''
    child.stdout.on('data', (d: Buffer) => { buf += d.toString(); if (buf.includes('\n')) resolve(buf.trim()) })
    child.on('exit', () => reject(new Error('child exited before printing token')))
    setTimeout(() => reject(new Error('child token timeout')), 60_000)
  })
  expect(token).not.toBe('NULL')

  child.kill('SIGKILL')
  await new Promise(resolve => child.on('exit', resolve))

  const reclaimed = acquireLock(dir)
  expect(reclaimed).not.toBeNull()
  releaseLock(dir, reclaimed)
}, 120_000)
