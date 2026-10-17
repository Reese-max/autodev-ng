// vitest setupFile：Windows 上全域補 windowsHide，防測試 spawn git 時閃黑窗。
// 根因：測試建暫存 Git repo 的 execSync/spawnSync 未帶 windowsHide，而 vitest worker
// 無 console，Windows 為每個 git 子進程配一扇可見視窗（踩雷 §25 同型）。
// 逐站點補丁太散（15+ 檔），一處 monkey-patch 全蓋。正式碼主咽喉 proc.ts 已自帶。
import cp from 'node:child_process'

if (process.platform === 'win32') {
  const names = ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync'] as const
  for (const name of names) {
    const orig = (cp as any)[name]
    ;(cp as any)[name] = function (...args: any[]) {
      let i = args.length - 1
      if (typeof args[i] === 'function') i-- // exec/execFile 的 callback
      if (i >= 1 && args[i] && typeof args[i] === 'object' && !Array.isArray(args[i])) {
        if (args[i].windowsHide === undefined) args[i] = { ...args[i], windowsHide: true }
      } else {
        args.splice(i + 1, 0, { windowsHide: true })
      }
      return orig.apply(this, args)
    }
  }
}
