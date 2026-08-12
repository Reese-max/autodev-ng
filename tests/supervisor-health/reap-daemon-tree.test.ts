import { spawn } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { reapDaemonTree } from '../../src/supervisor/supervise.js'

// 2026-08-03 迴歸防護：taskkill /T /F 對卡死樹「存取被拒」時，舊版讓錯誤外拋
// → supervise decision=error → 不 relaunch → 孤兒抱住 worktree（playbook §2.3）。
// 新版吞 taskkill 錯誤改走 CIM 枚舉＋葉到根 process.kill 後備。

const throwingTaskkill = (command: string): string => {
  if (command === 'taskkill') throw new Error('錯誤: 存取被拒。')
  return '[]'
}

describe('reapDaemonTree', () => {
  it('副作用前發現暫停時不呼叫 taskkill', () => {
    const calls: string[] = []
    expect(reapDaemonTree(123, command => { calls.push(command); return '' }, () => true)).toBe(false)
    expect(calls).toEqual([])
  })

  it('taskkill 拋錯且目標已死：不外拋（舊版在此 decision=error）', () => {
    // 先造一個真實死掉的 PID
    const child = spawn(process.execPath, ['-e', 'process.exit(0)'])
    const deadPid = child.pid!
    return new Promise<void>(resolve => {
      child.on('exit', () => {
        expect(() => reapDaemonTree(deadPid, throwingTaskkill)).not.toThrow()
        resolve()
      })
    })
  })

  it('taskkill 拋錯且目標存活：後備樹斬把進程殺掉', { timeout: 15_000 }, () => {
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { windowsHide: true })
    const pid = child.pid!
    const runCommand = (command: string): string => {
      if (command === 'taskkill') throw new Error('錯誤: 存取被拒。')
      // powershell 枚舉：只回目標本身（無子進程）
      return JSON.stringify([{ ProcessId: pid, Name: 'node.exe' }])
    }
    expect(() => reapDaemonTree(pid, runCommand)).not.toThrow()
    // 驗證真的死了
    let alive = true
    try {
      process.kill(pid, 0)
    } catch {
      alive = false
    }
    expect(alive).toBe(false)
  })

  it('無效 PID 一律拒絕', () => {
    expect(() => reapDaemonTree(0)).toThrow('無效 daemon PID')
    expect(() => reapDaemonTree(-5)).toThrow('無效 daemon PID')
    expect(() => reapDaemonTree(1.5)).toThrow('無效 daemon PID')
  })
})
