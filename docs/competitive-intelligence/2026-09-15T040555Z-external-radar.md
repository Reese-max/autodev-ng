# 外部競品／新品／工作流靈感雷達 — 2026-09-15T04:05:55Z

> 查閱日：2026-09-15（Asia/Taipei）；檔名使用 UTC。
>
> Issue Quality：`issue_quality_version: 2`；規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`（`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`）。
>
> Evidence labels：`CONFIRMED`＝第一方產品／規格／repository truth 或原始研究可直接查核；`LIKELY`＝有支持但仍需產品/runtime/真人驗證；`COMMUNITY_SIGNAL`＝個別社群經驗；`UNKNOWN`＝資料不足。
>
> 本輪只寫研究報告與 Issue comment；沒有修改產品 source、CI/config、secret、權限、repository settings，沒有建立實作 branch、merge/deploy、啟動 worker/run 或新 GOAL，也沒有付費或更動正式資料。

## Executive Summary

延續上一輪 `2026-09-15T020241Z-external-radar.md` 的 cold-rotation cursor，本輪深讀 `Reese-max/skill-foundry`。重新完整列舉 connected owner inventory：**42 個 Reese-max owned repositories，3 archived、39 owned + unarchived**；沿用目前校準範圍 **36 product-like + 3 support/compatibility-only**（`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`）。沒有操作他人 repository。

本輪沒有新增 Issue。真正的新產品訊號是：**Agent Skill 的安裝、更新、版本 pin、multi-agent path projection 正快速被 GitHub CLI、Camunda spm 等外部 package managers 商品化／標準化；Skill Foundry 不應再優先研究自建 installer、TargetSkillAdapter matrix 或新的 MCP distribution service。**

`skill-foundry #4` 原始大型研究單已於上一輪先被縮成 MCP discovery experiment；本輪新的 package-manager 證據讓它再縮一步：先驗證一個 certified synthetic Skill 能否經既有 package manager 投影到一個本機 target，並用 Foundry 現有 hash 重新證明 installed content 對應 exact certified revision。只有這個最小實驗證明仍有缺口，才考慮寫任何 transport-specific code。

Issue #4 維持：

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: MEDIUM_HIGH
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime: NEEDS_RUNTIME_VERIFICATION
```

**本輪：0 新 Issue、1 既有 Research Issue 縮限更新、0 新實作授權。** 下一個 cold-rotation cursor：`video-timeline-pipeline`。

---

## Scope / Repository Truth

### Portfolio enumeration

Owned + unarchived（39）：

`92-duty-scheduler`, `academic-mcp`, `adng-memory`, `ai-flight-radar`, `ai-novel-workstation`, `autodev-ng`, `avatar-vfo`, `cf-ai-router`, `cf-mcp-server`, `chatgpt-dual-pipeline`, `claude-mem`, `clinical-scribe-worker`, `cyber-prep-coach`, `exam-archive`, `flux-image-gen`, `google-maps-personal-mcp`, `herdr-skills`, `internship-notes-sites-mirror`, `lobsterpulse`, `lplrs-judicial-sync`, `MaterialYouNewTab`, `minideck`, `neciken-summer-poem`, `ninax-line-hermes`, `note-filler`, `police-exam-archive`, `police-exam-practice`, `ppt-studio`, `project-doctor-web`, `prompt-autoresearch`, `skill-foundry`, `soundbox-offline`, `spotify-playlist-organizer-mcp`, `taichung-police-intel`, `taiwan-intel-dashboard`, `tick-stock-panel`, `UkePack`, `video-timeline-pipeline`, `voice-actress`.

Archived（排除）：`gemini-deidentifier`, `obsidian-vault`, `openab`。

Support/compatibility-only：`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`。

`autodev-ng` 在上一輪 radar 後另有 `542dea42f7d420341574af966dc3bdc1d7116839` 的 portfolio-audit documentation commit；它沒有修改 Issue Quality v2 blob，也沒有改變本輪 `skill-foundry` 產品結論。

### `skill-foundry` current truth

- Default branch：`main`。
- Inspected HEAD immediately before Issue write：`d74d0c2616d981a7762fc1a7c5662486d2bcaa2a`（2026-09-13 product-board audit；HEAD 未出現新的 product-code commit）。
- Owner-approved direction：**INVEST / SIMPLIFY**。
- 北極星：成為 portfolio 狹義的 reusable Agent Skill certification + promotion plane；每個 promoted revision 的 source、package hash、eval set、runtime profile、policy、security posture、approval boundary 應可從 receipts 重建。
- 明確非目標：hosted marketplace、通用 agent orchestration、observability suite、memory product、另一套 agent runtime、大型 desktop recorder。
- 現有核心：Candidate isolation、Skill tree hash、paired with/without eval、Waza / SkillEvaluator / Promptfoo、signed aggregate attestation、deterministic research promotion；formal/legal mode 保留人工 approval。

### Existing work / coordination

- **#6** default-branch deterministic CI receipt：Product Board 現行最高 reliability priority；本輪不碰。
- **#1 / PR #2** Target Runtime Compatibility / negative transfer：唯一 open implementation PR/branch，仍 active；本輪不搶 scope。
- **#3** package security attestation：獨立 fingerprint；GitHub current docs 新增的「Skills 不受 GitHub 驗證」只強化既有問題，沒有必要重貼/開單。
- **#4** distribution/install research：沒有 active #4 PR/branch。上一輪已用 Microsoft Agent Framework MCP discovery 將原大範圍 adapter/registry 研究縮小；本輪取得 `github-issue-lock:v1` 後再加入 package-manager evidence，讀回確認，再 release lock。
- **#5** demonstration-to-Skill intake：沒有本輪新證據足以改變 decision；不重貼。

---

# External Signals

## A. Direct competitor / substitute — GitHub CLI 已把 Skill install/update/pin/provenance 變成 host-owned capability

**CONFIRMED；GitHub official current docs checked 2026-09-15；功能 launch 2026-04-16。**

Sources:
- https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills
- https://github.blog/changelog/2026-04-16-manage-agent-skills-with-github-cli/

> 日期超過 90 天；仍保留，因這是目前仍有效且直接覆蓋 #4 核心 JTBD 的代表性能力，且先前 #4 尚未把它納入最小方案比較。

GitHub CLI `gh skill` 現行 public preview 已支援 search / preview / install / update / publish；可用 `--agent` 與 `--scope` 投影到 agent host 的正確位置；可以 tag 或 commit SHA pin。安裝後 `SKILL.md` frontmatter 會保存 source repository、ref、Git tree SHA，`gh skill update` 依 provenance 檢查 upstream changes；pinned Skill 不會被一般 update 自動升版。

### JTBD

維護者要把同一個 Skill 安裝到 Copilot、Claude Code、Cursor、Codex、Gemini 等 host，不想自己記每個 target directory、手工 copy、再猜目前版本。

### Manual steps reduced

`找 source → 查 target path → copy folder → 手工記版本 → 日後再找 upstream diff` 已被 CLI 壓成 search/preview/install/update/pin。

### Onboarding / distribution

GitHub 把 discovery、preview、install、agent/scope selection、publish 都放在同一 CLI surface；對 Skill Foundry 而言，這代表 path mapping 與 routine update 已不是合理 moat。

### Provenance / security pattern

GitHub 明確警告 Skills **not verified by GitHub**，要求使用者先 `gh skill preview`。這正好支持 Foundry 的定位：transport provenance != certification。另一個重要細節是 `gh skill` 會把 provenance metadata 寫進 `SKILL.md`，因此 installed bytes 可能與 Foundry 原 certified tree hash 不一致；必須驗證 transform boundary，不能拿 source Git tree SHA 冒充 installed Skill hash。

### Pricing / business signal

GitHub CLI 本身把 package-management 行為做成基礎 developer tooling，而不是獨立的高價 certification product。對 Foundry 的信號是：**distribution plumbing 越來越 commodity；可驗證 certification 才是差異化。** 本輪不據此推估付費意願。

### Do not copy

不複製 GitHub 的 package manager；也不把 GitHub provenance 當 Foundry quality/security/runtime certification。

---

## B. Adjacent standard — Agent Plugins 1.0 把「package portability」和「distribution/permissions」刻意分層

**CONFIRMED；published 2026-08-06；checked 2026-09-15。**

Sources:
- https://aws.amazon.com/blogs/opensource/aws-supports-agent-plugins-an-open-standard-for-portable-agent-extensions/
- https://agent-plugins.org/
- https://agent-plugins.org/specification

Agent Plugins 1.0.0 是 Amazon/Cursor/Microsoft/OpenAI/Vercel 等參與的 vendor-neutral format，把 Agent Skills 與 MCP server config 放進固定 portable directory。規格特別把 **distribution、installation、permissions、UX 留給 client**，而不是再標準化一個中央 installer/runtime。

### Transferable principle

`Portable package ≠ installation authority ≠ runtime permission ≠ certification`。

對 Foundry 最適合吸收的是「產出可攜、可檢查的 certified artifact identity」，而不是擁有每個 client 的安裝 lifecycle。

### Limits / do not copy

Agent Plugins 對 path/symlink/manifest validation 有規範，但它不是 quality/security/runtime certification。也不能因 package 能被多 client load，就宣稱所有 client 上有同樣 Skill Lift；#1 仍必須獨立處理 runtime compatibility。

---

## C. Emerging substitute — Camunda `spm` 把 Skills 變成 Git dependencies + immutable lock

**CONFIRMED capability；first-party current docs checked 2026-09-15。公開 Show HN / product launch signal：2026-09-10。**

Source:
- https://camunda.github.io/spm-cli/

`spm` 使用 `ai.json` 宣告 Git dependencies，以 tag/branch/commit 指定來源，再把 resolved revision 鎖進 `ai.lock` immutable commit SHA；fresh clone 可重建同一組 Skills。它會把同一 dependency 投影到 Amp、Claude Code、Cline、Codex CLI、Copilot CLI、Cursor、Gemini CLI、Windsurf 各自的 project-local 位置，且 materialized Skill 不需要 commit 進使用者 repository。

### Why this matters now

這不是「另一個 marketplace feature」，而是直接實作 #4 原本打算自己維護的多 host path mapping、version lock、reproducible install。它讓最小方案從「我們怎麼建 adapter」改成「我們能否只做 certification bridge」。

### Limit

第一方文件證明 tool semantics，不證明它對 `skill-foundry` private repo、Windows path、Foundry exact hash 或任一 target 已實測成功。本輪沒有執行它，所以仍是 `NEEDS_RUNTIME_VERIFICATION`。

---

## C2. Emerging research — installability/reusability 本身仍不是品質

**CONFIRMED RESEARCH；published 2026-08-09；checked 2026-09-15。**

Source:
- https://arxiv.org/abs/2608.08453

`What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files` 在其 corpus 中研究大量 public Skills 的 routing metadata、instruction body、resource organization 等 defects，並用 deterministic routing stress test 觀察 metadata quality 對 retrieval 的影響。

本輪只吸收方法層訊號：**更容易安裝更多 Skills，不代表更值得安裝；format/distribution 成功不能替代 evaluation/certification。** 論文 corpus 比率不外推為 Reese-max 或整個市場的 defect rate。

---

# Community Pain

以下均為 **COMMUNITY_SIGNAL**，只作 workflow hypothesis，不作發生率或採用率：

- Hacker News 2026-09-07 的 `Ask HN: How do you manage skills files?` 出現大量討論，核心分歧包括「應否把 Skills 當 dependency 管理」「Skills 是否值得長期維護」「是否應用 deterministic harness 取代 instruction-only 控制」。來源：https://news.ycombinator.com/front?day=2026-09-07
- Reddit 2026-09-09 有使用者連「Skill 應放 project root、`.claude/skills` 還是 global path、是否每次要 load」都不確定。這支持 installation UX 確實有認知摩擦，但現成 package managers 已在處理，不等於 Foundry 應做新 UI。來源：https://www.reddit.com/r/ClaudeAI/comments/1wbod2z/i_dont_understand_skills_and_need_help/
- Reddit 2026-09-01 有 production user 描述「Skill 在 disk 但 agent 未必實際使用」的情況。這提醒 installed != invoked/effective，支持 Foundry 不把 install receipt 擴張成 runtime quality claim。來源：https://www.reddit.com/r/ClaudeAI/comments/1w4nxxe/claude_code_ignoring_skill_files_and_acting/

---

# Opportunity Map — `skill-foundry`

## MUST MATCH

1. **不要重做已 commodity 的 distribution plumbing。** 對 GitHub/package-manager transport，至少能保存 certified source identity 並明確說明 transport 後 verification state。
2. `CERTIFIED_SOURCE`、`MATERIALIZED_MATCH`、`TRANSFORMED/UNVERIFIED`、`RUNTIME_CERTIFIED` 必須是不同 claim；不能因 install/update 成功自動升級。
3. #6 的 current-main deterministic CI receipt、#1 runtime compatibility、#3 package security 仍比 #4 大型 installer architecture 更優先。

## SHOULD BE BETTER

1. 對一個外部 transport 做 exact content read-back，重用現有 tree hash，而不是另造 registry/ledger。
2. 若 transport 改寫 `SKILL.md`，把 transform 明確呈現為 evidence gap，不用「來源 commit 一樣」遮掉 installed-byte 差異。
3. certification receipt 應 transport-neutral：transport 可換，certified artifact identity 不應綁某個 package manager。

## DIFFERENTIATOR

**Transport-independent certification boundary**：外部 package manager 可以解決「怎麼送到 target」，Foundry 回答「送的是不是已認證 exact revision、哪些 quality/runtime/security claims 還有效」。

## ADJACENT IDEA

若未來確實需要一個多 client export shape，可評估把 Agent Plugins 1.0 當 optional packaging target；先不要建 registry、plugin marketplace 或 MCP service。只有 one-skill experiment 證明 portable package 能減少實際 maintainer steps 才進下一階段。

## DO NOT COPY

- 不建 Skill marketplace / leaderboard / install analytics。
- 不建自己的 multi-agent path adapter matrix，只因現在 Issue body 裡曾寫過。
- 不做 background auto-update；certified revision 不應被 upstream silent update 取代。
- 不把 `gh skill` provenance、Git commit SHA、Agent Plugins conformance 或 `spm ai.lock` 當 quality/security/runtime PASS。
- 不把 `INSTALLED` 冒充 `ACTIVE/INVOKED/EFFECTIVE`。

---

# Opportunity / Priority Calibration

### Candidate: reuse existing package manager + thin certification identity bridge

- **User Pain:** HIGH evidence — #4 已有明確 manual copy/version/path JTBD；社群只作補充。
- **Strategic Fit:** HIGH — 完全符合 Product Board 的 `INVEST / SIMPLIFY` 與 narrow certification plane。
- **Novelty:** MEDIUM — package managers 已存在；新價值不是再造 installer，而是保留 certification identity across transport。
- **Evidence Strength:** HIGH for market/tool capability；**UNKNOWN** for actual Reese-max runtime outcome because `spm/gh skill` 尚未實跑。
- **Reuse Potential:** MEDIUM-HIGH — 若證實，可供 `herdr-skills` 等 future Skill distribution 使用，但尚無 repo-specific user evidence，故不開跨 repo Issue。
- **Implementation Effort:** LOW if result is reuse-only; UNKNOWN if transform bridge is required。
- **Security/Privacy/Cost:** LOW-to-MEDIUM；主要風險是 third-party transport changing bytes/source、private repository access、upstream update；本輪不授權外部寫入或 credentials。

**Decision:** keep #4 as bounded `RESEARCH / NEEDS_EVIDENCE`; no implementation authorization.

### Minimum experiment retained in #4

1. 一個既有 certified synthetic Skill。
2. 一個 external package manager（優先 `spm`）鎖 exact source commit。
3. 一個本機 supported target。
4. Materialize 後用 Foundry 現有 tree hash read-back。
5. 結果只允許 `MATCH / TRANSFORMED_UNVERIFIED / FAILED` 類 evidence，不宣稱 runtime efficacy。

Exit:
- **BUILD:** only a thin certification/export/verification bridge is needed.
- **NARROW:** source identity can be tracked, installed bytes cannot be proven; retain explicit unknown/transform state.
- **REJECT:** private/local workflow or hash boundary cannot be preserved; then compare MCP/manual path, not the original broad adapter plan by default.

---

# Cross-Portfolio Ideas

1. **Package manager owns transport; domain product owns truth.** 如果 `herdr-skills`、`autodev-ng` 日後需要分發 reusable Skill，先用既有 `gh skill` / `spm` / compatible client path；各 repo 不應各建 installer。現在只是 architectural reuse candidate，尚未有足夠 repo-specific friction 建 Issue。
2. **Source identity != materialized bytes.** 任何會 rewrite frontmatter、normalize files、inject metadata 的 distribution tool，都要重新區分 source revision 與 observed artifact。這個原理也可套用到模板、prompt package、generated config，但只有出現實際 workflow gap 才立案。

---

# Rejected / Deferred Ideas

| Idea | Decision | Reason |
|---|---|---|
| 自建 `TargetSkillAdapter` multi-host matrix | REJECT FOR NOW | `gh skill`/`spm` 已處理主要 plumbing；沒有證據證明自建能增加使用者價值 |
| 先做 Microsoft MCP Skill distribution service | DEFER / LOWER PRIORITY | 上一輪是較小替代，但新 package-manager path 甚至不需要新增服務；先做 zero-custom-installer experiment |
| Skill marketplace / registry / leaderboard | REJECT | owner 明確非目標；distribution 已有市場供給，Foundry moat 是 certification |
| Background auto-update | REJECT | 會讓 certified revision 與 installed bytes silently drift |
| 把 Agent Plugins 1.0 做成新大型子系統 | DEFER | optional export target 可研究，但先驗證一個 Skill、一個 transport、一個 target |
| 更新 #3 security Issue | NO CHANGE | GitHub「Skills not verified」與現有 #3 同 fingerprint，沒有新的根因/狀態，不重貼 |
| 新建跨 portfolio installer framework Issue | REJECT | 尚無多 repo 實際使用者斷點；先證明 #4 minimal experiment |

---

# Issue Mapping / Coordination

| Repo | Issue | Action | Reason |
|---|---|---|---|
| `skill-foundry` | #4 | **UPDATED / NARROWED** | new external evidence shows install/update/version/path projection are available externally; research reduced to certification-identity bridge |
| `skill-foundry` | #1 / PR #2 | SKIPPED_ACTIVE | active implementation scope for runtime compatibility; no takeover |
| `skill-foundry` | #3 | NO_CHANGE | package security separate fingerprint; no material state change |
| `skill-foundry` | #5 | NO_CHANGE | demonstration intake not changed by current external evidence |
| `skill-foundry` | #6 | NO_CHANGE / HIGHER DELIVERY PRIORITY | current Product Board reliability prerequisite remains; radar does not start implementation |

#4 lock lifecycle used in this run:

- acquired: `run=2026-09-15T04:04:25Z`, lease to `2026-09-15T05:34:25Z`;
- checked current HEAD and issue/PR/branch state before write;
- comment written/read back successfully;
- released at `2026-09-15T04:05:24Z`, status `completed`.

No other active #4 implementation branch/PR was found; PR #2 remains scoped to #1.

---

# What Changed Since Last Radar

1. Last radar focused `prompt-autoresearch` judge validity; this round moved fair rotation to `skill-foundry` as recorded.
2. `skill-foundry #4` was already narrowed once from broad installer architecture to MCP discovery research. **This round narrows it again:** existing package managers now cover much of the actual install/update/version/path work, so the first experiment should use an existing transport rather than build another server/adapter.
3. The new product distinction is now:
   `Certified source revision != package-manager lock != materialized bytes != installed/active Skill != runtime efficacy`.
4. No new Issue, no severity escalation, no READY_FOR_IMPLEMENTATION transition.
5. Next cold-rotation cursor: `video-timeline-pipeline`.

---

# Completion / Gaps

Completed:
- Issue Quality v2 blob re-read and SHA recorded.
- Full owned repo inventory re-enumerated in one complete page; all 42 accessible owned repos accounted for.
- `skill-foundry` owner-approved direction, README, current HEAD, open Issues, all-state PRs/branches, #4 comments/locks reviewed.
- A/B/C external exploration performed with first-party docs plus bounded community signals.
- #4 updated under lock and read-back verified.
- Report written as a new unique history file; no prior radar overwritten.

Not completed / deliberately not claimed:
- No `gh skill`, `spm`, Agent Plugins client, Microsoft MCP Skill runtime, Codex/Waza canary, private repo package install, or target filesystem experiment was executed.
- No proof yet that `spm` preserves Foundry tree hash in a real target.
- No proof yet that GitHub CLI provenance rewrite can be deterministically bridged to Foundry certification.
- No claim that distribution research is P1/P2 product defect.
- No portfolio CLEAN claim.

---

# Sources

## Repository / governance
- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` — blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `Reese-max/skill-foundry` — `main@d74d0c2616d981a7762fc1a7c5662486d2bcaa2a`.
- `Reese-max/skill-foundry/.github/quality-audits/2026-09-13-1610-product-board-audit.md`.
- https://github.com/Reese-max/skill-foundry/issues/4
- https://github.com/Reese-max/skill-foundry/pull/2

## Public web
- GitHub Docs, current Agent Skills / `gh skill`: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills — checked 2026-09-15.
- GitHub Changelog, `gh skill`: https://github.blog/changelog/2026-04-16-manage-agent-skills-with-github-cli/ — published 2026-04-16; checked 2026-09-15.
- AWS Open Source Blog, Agent Plugins 1.0: https://aws.amazon.com/blogs/opensource/aws-supports-agent-plugins-an-open-standard-for-portable-agent-extensions/ — published 2026-08-06; checked 2026-09-15.
- Agent Plugins Specification 1.0.0: https://agent-plugins.org/specification — checked 2026-09-15.
- Camunda `spm`: https://camunda.github.io/spm-cli/ — checked 2026-09-15; public launch signal 2026-09-10.
- Vercel skills.sh current CLI/docs: https://www.skills.sh/docs and https://www.skills.sh/docs/cli — checked 2026-09-15; used only as additional substitute-market context.
- Zhang et al., `What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files`: https://arxiv.org/abs/2608.08453 — published 2026-08-09; checked 2026-09-15.
- Hacker News Ask HN archive: https://news.ycombinator.com/front?day=2026-09-07 — event 2026-09-07; community signal only.
- Reddit ClaudeAI skill-install confusion: https://www.reddit.com/r/ClaudeAI/comments/1wbod2z/i_dont_understand_skills_and_need_help/ — 2026-09-09; community signal only.
- Reddit ClaudeAI skill invocation/reliability discussion: https://www.reddit.com/r/ClaudeAI/comments/1w4nxxe/claude_code_ignoring_skill_files_and_acting/ — 2026-09-01; community signal only.
