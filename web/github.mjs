export function githubPanel(root, url, token) {
  const make = (tag, text, parent = root) => { const el = document.createElement(tag); el.textContent = text; parent.append(el); return el }
  let busy = false
  async function request(body, endpoint = url('/api/github')) {
    const response = await fetch(endpoint, { method: body ? 'POST' : 'GET', headers: { 'x-csrf-token': token(), 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error ?? `HTTP ${response.status}`)
    return result
  }
  async function refresh(force = false) {
    if (busy || (!force && (root.contains(document.activeElement) || root.querySelector('details[open]')))) return
    busy = true
    try {
      const endpoint = url('/api/github'), data = await request(undefined, endpoint)
      if (endpoint !== url('/api/github')) return
      root.replaceChildren()
      make('h2', 'GitHub 案件與交付')
      const message = make('p', '', root); message.setAttribute('role', 'status')
      if (!data.integrations.length) make('p', '尚未設定此專案的 GitHub 整合。請參閱 docs/github-issues.md。')
      for (const integration of data.integrations) {
        const card = make('article', ''); card.className = 'card'; card.style.marginBottom = '12px'
        make('h3', integration.repo ?? integration.name, card)
        make('p', integration.error || `${integration.paused ? '已暫停' : '已啟用'} · PR 後續修正${integration.followup ? '已開啟' : '未開啟'}`, card)
        const reasonLabel = make('label', '恢復原因／人工驗收證據（至少 8 字元）', card)
        const reason = make('input', '', reasonLabel); reason.type = 'text'; reason.maxLength = 2000; reason.style.width = '100%'
        const action = (label, name, issue, parent = card) => {
          const button = make('button', label, parent); button.type = 'button'
          button.onclick = async () => {
            busy = true; button.disabled = true; message.textContent = '處理中…'
            try {
              if (endpoint !== url('/api/github')) throw new Error('專案已切換，請重新載入案件。')
              const result = await request({ action: name, integration: integration.name, issue: issue?.number, commit: issue?.commit, reason: reason.value }, endpoint)
              if (['doctor', 'evidence'].includes(name)) { const pre = make('pre', JSON.stringify(result, null, 2), card); pre.style.whiteSpace = 'pre-wrap'; pre.style.overflowWrap = 'anywhere'; message.textContent = '檢查完成；未執行修復模型。' }
              else { message.textContent = '操作完成'; busy = false; await refresh(true) }
            } catch (error) { message.textContent = error.message }
            finally { busy = false; button.disabled = false }
          }
        }
        if (integration.error) continue
        action('設定診斷', 'doctor'); action('更新 PR 狀態', 'refresh')
        if (!integration.issues.length) make('p', '目前沒有案件。', card)
        for (const issue of integration.issues) {
          const row = make('details', '', card)
          make('summary', `#${issue.number} ${issue.title} · ${issue.status} · ${issue.runs}/${issue.maxRuns} 次`, row)
          make('p', `候選驗證：${issue.verified ? '通過' : '未確認'} → GitHub CI：${issue.remote?.checks ?? '未確認'} → 合併：${issue.remote?.state === 'merged' ? '已合併' : '未合併'} → 人工驗收：${issue.accepted ? '已確認' : '未確認'}`, row)
          make('p', issue.detail ?? '尚無執行紀錄', row)
          if (issue.pr?.startsWith(`https://github.com/${integration.repo}/pull/`)) {
            const link = make('a', '查看 GitHub PR', row); link.href = issue.pr; link.target = '_blank'; link.rel = 'noopener noreferrer'
          }
          make('p', `Commit：${issue.commit ?? '尚未產出'}；修正輪次：${issue.revision}`, row)
          make('p', `證據目錄：${issue.evidenceDirectory}`, row).style.overflowWrap = 'anywhere'
          if (issue.verified) action('檢查交付證據', 'evidence', issue, row)
          make('pre', issue.history.map(h => `${h.at} ${h.status} ${h.detail ?? ''}`).join('\n'), row).style.whiteSpace = 'pre-wrap'
          if (['blocked', 'queued', 'running', 'ready'].includes(issue.status)) action(integration.paused ? '檢查並恢復' : '檢查並重排', integration.paused ? 'resume' : 'retry', issue, row)
          if (issue.remote?.state === 'merged' && !issue.accepted) action('記錄人工驗收', 'accept', issue, row)
        }
      }
    } catch (error) { root.replaceChildren(); make('p', `GitHub 案件讀取失敗：${error.message}`) }
    finally { busy = false }
  }
  return refresh
}
