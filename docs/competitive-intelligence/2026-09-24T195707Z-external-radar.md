# External Radar — Reese-max/exam-archive

Run UTC: 2026-09-24T19:57:07Z
Access date: 2026-09-25 (Asia/Taipei)
Status: COMPLETE
Rule blob: 8167e10798071d2276addaff6b201c6b0e904a2a
Focal main: 5d74726eed8f507bb9527aff2047945c6de10d79
index.html blob: b1404b99c1e19c43bf5cb168f6d0574e4903f212
Fresh inventory: 42 Reese-max-owned / 41 unarchived / 1 archived
Outcome: 0 new Issues; 0 Issue/PR comments; 0 implementation authorization
Next fair cursor: Reese-max/police-exam-practice

## Direction and repository state

Owner direction remains **SIMPLIFY / MAINTAIN**: keep the narrow local-first police information-management archive reliable; finish #1 source/build/product contract, fix #3 practice accessibility, then clarify the boundary with police-exam-archive / police-exam-practice. AI tutoring, accounts/sync, analytics, native app, social/community and teacher-LMS expansion remain out of current scope.

Open related work means overlapping radar changes are SKIPPED_LOCKED:
- #1 monolithic payload + repository/source/build contract
- #3 pointer-only practice controls
- PR #2 README/product contract
- PR #4 first accessibility candidate
- PR #5 payload budget gate
- PR #6 later accessibility candidate

## External Signals

### Direct competitor: 阿摩線上測驗
**CONFIRMED**, Apple App Store, accessed 2026-09-25.
- v4.1.4 (2026-08-03): added wrong-answer retest, in-test question-error reporting, AI-label settings for explanations/private notes, remembered filters; also redesigned UI, moved competitions to web and removed some old surfaces.
- v4.1.6 (2026-08-07): fixed a missing-answer-display problem.

Signal: mature exam products are investing in correction/review trust while also simplifying lower-value surfaces. Transferable pattern is explicit correction state and narrow review flow, not their account economy, ads or social competition.

### Direct/adjacent competitor: 國考知識王
**CONFIRMED capability; efficacy/coverage counts remain vendor claims.**
- App v1.0.8 (2026-08-03): multi-year practice selection plus broad question/answer/image corrections.
- Current public site states 100–115 coverage, source attribution to 考選部, visible missing-image handling, disputed-question handling, and separate labels for AI explanations vs reviewed reference answers.

Signal: visible uncertainty/source state is more relevant to this archive than copying AI tutoring.

### Authoritative source: 考選部
**CONFIRMED first-party.**
Official 115 police-exam answer material is public; the common-subject sheet includes 警察資訊管理人員. The current exam-archive audit already records coverage only through 114, so this is a real freshness ceiling but not a newly discovered runtime regression or a promise breach.

### Adjacent workflow: 考試喵
**CONFIRMED current pattern.**
The service exposes official status and last-checked dates and avoids guessing unannounced dates. A small static source-state contract is a plausible pattern for this repo, but not evidence for a new service or registry.

## New Releases

| Source | Date | Signal |
|---|---|---|
| 阿摩 4.1.4 | 2026-08-03 | wrong-answer retest, error report, AI labels, remembered filters, simplification |
| 阿摩 4.1.6 | 2026-08-07 | answer-display reliability fix |
| 國考知識王 1.0.8 | 2026-08-03 | multi-year drill + question/answer/image corrections |
| 考選部 115 police answers | 2026-06-15 | current official year exists beyond archive's 114 ceiling |

## Community Pain

No recent 30–90 day independent community evidence was found that establishes a new exam-archive-specific pain or occurrence rate. Older broad-app reviews were not used for severity.

## Adjacent Ideas

A minimal future static source receipt could use fields such as:
- source_url
- source_checked_at
- coverage_through
- answer_state = official | corrected | disputed | unknown
- asset_state = complete | missing-image | unknown

This is a HOLD under existing #1, not a proposal for a crawler, database, generalized registry or AI correction system.

## Opportunity Map

- **MUST MATCH:** keyboard/AT-operable practice; truthful official-source/coverage/correction state; deployment truth. Existing #3/#1 already own these roots.
- **SHOULD BE BETTER:** no-login/local-first access, narrow police-IT navigation, explicit uncertainty instead of guessed content.
- **DIFFERENTIATOR:** curated police information-management corpus usable without account/backend/ads/social state.
- **ADJACENT IDEA:** tiny source checked/coverage/correction metadata if #1's current contract proves insufficient.
- **DO NOT COPY:** AI answer generation, PvP/gamification, account sync, ad economy, teacher/community platform, broad SRS engine.

## Four Gates

Candidate: add year-115 plus a source/correction freshness layer now.

1. **Problem/value:** official 115 exists while product coverage is 105–114, but current product does not promise automatic current-year ingestion; source/update ambiguity is already tracked by #1.
2. **Priority:** kind=OPPORTUNITY/MAINTENANCE context; severity=NOT_ESTABLISHED; decision_priority=MEDIUM; triage=NEEDS_EVIDENCE; auto_implementation=false.
3. **Minimum solution:** first make coverage/update contract truthful; if needed add static source/checked/correction metadata. Do not start ingestion infrastructure first.
4. **Research vs implementation:** no new research Issue is needed now because the actionable decision is already clear and active #1/#3 ownership exists.

## Rejected Ideas

- Upgrade missing 115 to P1/P2: rejected; no current always-current promise or demonstrated core-task outage.
- Copy AI explanations: rejected; wrong product boundary and source/accessibility work has stronger evidence.
- Add cloud sync/account: rejected; local-first/no-login remains a product strength.
- Build a generalized provenance database/registry: rejected; static metadata is the smaller option.
- Add multi-year adaptive practice here: rejected; route richer learning-state work to the canonical practice product.

## Issue Mapping

| Tracker | Mapping | Action |
|---|---|---|
| #1 | source/build/coverage/product contract | SKIPPED_LOCKED; PR #2/#5 open |
| #3 | practice accessibility semantics | SKIPPED_LOCKED; PR #4/#6 open |
| New Issue | no independent root cause passed all gates | NONE |

No Issue lock marker was written because no tracker mutation was attempted.

## Sources

1. 阿摩線上測驗 App Store — v4.1.4 2026-08-03; v4.1.6 2026-08-07; accessed 2026-09-25
   https://apps.apple.com/tw/app/%E9%98%BF%E6%91%A9%E7%B7%9A%E4%B8%8A%E6%B8%AC%E9%A9%97/id1420850845
2. 國考知識王 App Store — v1.0.8 2026-08-03; accessed 2026-09-25
   https://apps.apple.com/tw/app/%E5%9C%8B%E8%80%83%E7%9F%A5%E8%AD%98%E7%8E%8B/id6780595877
3. 國考知識王 current product page; accessed 2026-09-25
   https://examking.tw/
4. 考選部 115 police exam answer material; published 2026-06-15; accessed 2026-09-25
   https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=212&code=115060&q=1&s=0205&t=S
5. 考選部考畢試題查詢; accessed 2026-09-25
   https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx
6. 考選部著作權聲明; accessed 2026-09-25
   https://wwwc.moex.gov.tw/main/content/wfrmContent.aspx?menu_id=102
7. 考試喵; accessed 2026-09-25
   https://exammeow.com.tw/

## What Changed

Fresh external evidence shows Taiwan exam products converging on correction/error-report workflows, wrong-answer review, source/answer trust labels, content correction, and selective removal of non-core surfaces. For exam-archive this reinforces rather than overturns the approved strategy: source/accessibility truth first, simplification over feature breadth, and richer practice behavior elsewhere in the portfolio.

No external evidence crossed the threshold for a new Issue or existing tracker update.

## Completion / gaps / cursor

- current default-branch changes checked: yes
- existing Issues and all-state PR scope checked: yes
- relevant Issue comments checked: yes
- external non-GitHub research: yes
- runtime/provider/browser execution: not performed
- portfolio CLEAN: not declared
- next fair cursor: Reese-max/police-exam-practice
