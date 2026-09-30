# External Competitive / New-Product / Workflow Radar — 2026-09-15T16:14:49Z

## Scope, rules, and evidence boundary

- Owner scope: `Reese-max` only.
- Quality rule: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh owner inventory: **42 owned repositories; 39 unarchived**. Archived: `gemini-deidentifier`, `openab`, `obsidian-vault`.
- Current classification retained after fresh listing: **36 product-like + 3 support/compatibility-only**. Support/compatibility-only: `adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`.
- Product-like inventory: `92-duty-scheduler`, `UkePack`, `academic-mcp`, `ai-flight-radar`, `ai-novel-workstation`, `autodev-ng`, `avatar-vfo`, `cf-ai-router`, `cf-mcp-server`, `chatgpt-dual-pipeline`, `claude-mem`, `clinical-scribe-worker`, `cyber-prep-coach`, `exam-archive`, `flux-image-gen`, `google-maps-personal-mcp`, `herdr-skills`, `lobsterpulse`, `lplrs-judicial-sync`, `MaterialYouNewTab`, `minideck`, `neciken-summer-poem`, `ninax-line-hermes`, `note-filler`, `police-exam-archive`, `ppt-studio`, `project-doctor-web`, `prompt-autoresearch`, `skill-foundry`, `soundbox-offline`, `spotify-playlist-organizer-mcp`, `taichung-police-intel`, `taiwan-intel-dashboard`, `tick-stock-panel`, `video-timeline-pipeline`, `voice-actress`.
- Prior radar cursor: `google-maps-personal-mcp`; this round completed that cold-rotation target. Next cursor: **`herdr-skills`**.
- No product code, CI/config, secrets, permissions/settings, implementation branch, merge, deploy, worker, GOAL, paid request, or production data was changed.
- No live Google Places request or signed-in Google Maps write was executed. Provider/runtime behavior not actually exercised remains `NEEDS_RUNTIME_VERIFICATION`.

## Product / owner direction re-read

Target: `Reese-max/google-maps-personal-mcp`.

- Current default-branch HEAD at write decision: `35680e6a61a0f6a31bf4b77cb1e8f83b6d48df5c` (`docs: add fixed 50-persona audit round 1`).
- Current product-code baseline remains `8bb6931b6d34f158aedf9ad6f652a7aef3822bcb`; later target-repo commits are audit/docs only.
- Product-board direction: **INVEST / SIMPLIFY**. Keep user-authored place knowledge durable and locally controllable; treat Google Maps / Places as replaceable discovery/sync boundaries. Prove one bounded end-to-end sync journey before broadening surface area.
- Existing tracked findings before this radar:
  - #1 `MAINTENANCE / P2 / NEEDS_REVIEW`: retention boundary for non-exempt Places content.
  - #2 `BUG / P2 / NEEDS_REVIEW`: concurrent sync can re-claim an active row.
  - #3 fixed-persona audit umbrella.
- All-state PR search returned **0 PRs**; branch listing returned only `main`. Historical issue lock markers observed on prior audits were released/expired. No existing Issue was modified in this run.
- Historical radar search found no prior `movedPlaceId` / obsolete-Place-ID fingerprint for this repo.

## External Signals

### A. Direct competitor / incumbent direction

#### Google Maps — Ask Maps

- Status: **CONFIRMED**.
- Event date: **2026-03-12**; checked 2026-09-15.
- Source: https://blog.google/products-and-platforms/products/maps/ask-maps-immersive-navigation/
- Signal: Google Maps now makes local discovery conversational and lets a user turn a recommendation directly into save/share/reservation/navigation actions.
- JTBD: “tell me where to go, then act on it without copying the result elsewhere.”
- Product implication: `google-maps-personal-mcp` should **not** compete by adding a generic AI recommendation layer. The incumbent already owns rich real-time discovery. Reese-max’s stronger role is durable personal context, deterministic organization, exportability, and a replaceable effect boundary.
- DO NOT COPY: broad recommendation AI, booking marketplace, social discovery feed.

#### Rego 3 — private place library with share-sheet capture and round-trip export

- Status: **CONFIRMED capability / UNKNOWN release date**; current 2026 product page checked 2026-09-15.
- Sources: https://rego.app/ and https://www.rego.app/
- Signal: Rego’s current product explicitly separates public-map discovery from a private personal place library. It accepts places directly from Apple Maps/Google Maps share sheets, imports KML/KMZ/GPX/Google Takeout, stores notes/photos/collections privately, and offers lossless/open exports.
- JTBD: capture a recommendation where it is found, retain personal meaning, and later open the preferred navigation app.
- Transferable principle: “capture should accept the artifact the user already has” rather than forcing re-search/re-entry.
- Why not open a feature Issue now: no Reese-max user/runtime evidence yet shows pasted Maps URLs or bulk imports are a primary bottleneck, and owner direction explicitly says to validate one core sync journey before broad imports/native app work.

#### Mapstr — import from Google Maps / web/social share flow

- Status: **CONFIRMED capability / UNKNOWN publication date**; checked 2026-09-15.
- Source: https://en.mapstr.com/fonctionnalites/importer-des-adresses
- Signal: current Mapstr flow can receive a Google Maps list or web/social content through the share action, detect places, and add them with existing tags; its page also documents Google Takeout/file import.
- JTBD: avoid one-by-one lookup when places already exist in another tool.
- Product implication: keep a **future** narrow “artifact-to-place candidate” capture path on the opportunity list, but do not turn the private alpha into a broad import platform before first-success evidence exists.

### B. Adjacent workflow that is portable

#### Apple Maps Visited Places — private history with explicit retention and personal notes

- Status: **CONFIRMED**.
- Published date: **February 2026**; checked 2026-09-15.
- Source: https://support.apple.com/en-ca/guide/personal-safety/ipsae6d4500b/web
- Signal: Visited Places is end-to-end encrypted, supports search/filter, personal notes, remove/correct actions, and a user-selectable retention period.
- Transferable principle: personal place history benefits from treating **user-owned context, retention policy, correction, and deletion as first-class product semantics**.
- Fit: strongly reinforces the existing local-first direction and #1; it does **not** justify building a native mobile client or automatic location history.

### C. New / newly relevant provider capabilities

#### Places API — Place ID rollover and relocation semantics

- Status: **CONFIRMED**.
- `movedPlace` / `movedPlaceId` release: **2025-10-20**; current docs checked 2026-09-15.
- Sources:
  - https://developers.google.com/maps/documentation/places/web-service/place-id
  - https://developers.google.com/maps/documentation/places/web-service/place-details
  - https://developers.google.com/maps/documentation/places/web-service/release-notes
- Critical provider contract:
  - Place IDs may change over time.
  - Google recommends refreshing stored Place IDs older than 12 months.
  - `NOT_FOUND` can indicate an obsolete ID after relocation/closure/database updates.
  - for a relocated place, Place Details can return `movedPlace` / `movedPlaceId`, and multiple relocations may require following a chain.
- Repo mismatch: README and `tools/places.py` call `place_id` the “stable identifier”; SQLite makes it the `places` primary key and `collection_places` foreign key; `services/google_places.py::get_place()` does not request/handle moved-place fields and hard-fails non-200 responses.
- This is the round’s strongest signal because it overturns a core identity assumption while the product’s main value proposition is long-lived personal metadata.

#### Places API — navigation points / entrances

- Status: **CONFIRMED**.
- Release date: **2026-08-06**; checked 2026-09-15.
- Source: https://developers.google.com/maps/documentation/places/web-service/release-notes
- Signal: Places API now exposes `entrances` and `navigationPoints` for search/details.
- Potential JTBD: avoid navigating to a building centroid or inconvenient side of a venue.
- Decision: research-list only. There is no repo/user evidence that current `build_trip` users are failing at final arrival, and the product does not yet claim route-quality parity with Maps. Do not expand field masks or cost solely because the API offers the data.

## New Releases / pricing signal

Google Maps Platform pricing/field documentation was checked this round; pricing page states last update **2026-09-10 UTC**:

- https://developers.google.com/maps/billing-and-pricing/pricing
- https://developers.google.com/maps/documentation/places/web-service/data-fields

`movedPlace` / `movedPlaceId` are currently listed under **Place Details Essentials (IDs Only)** fields. Billing is based on the highest-cost field requested. The existing `get_place()` already asks for richer fields, so a future implementation should compare (a) piggybacking on an already-authorized detail refresh versus (b) a bounded IDs-only refresh call. This is a cost-design signal, not a claim about actual Reese-max spend.

## Community Pain Points

Community evidence is anecdotal and is not treated as incidence data.

1. Google Maps export thread — comments in **June/August 2026** describe long Takeout waits and continued confusion about exporting saved lists; another 2026 comment notes exports may contain names/URLs but lack address/coordinate fields needed for migration.
   - Status: **COMMUNITY_SIGNAL**.
   - https://www.reddit.com/r/GoogleMaps/comments/1c551hz/is_it_possible_to_export_a_saved_list_of_locations/
2. QGIS thread — **2026-04-05 / 2026-06-04** users discuss Takeout exports without coordinates and the extra geocoding/manual conversion step.
   - Status: **COMMUNITY_SIGNAL**.
   - https://www.reddit.com/r/QGIS/comments/1scui34/export_google_maps_saved_places_lists_with/
3. Wanderlog community workaround — **2026-04-28/29** users built a local browser extraction workaround because importing saved Google Maps lists remained cumbersome.
   - Status: **COMMUNITY_SIGNAL**.
   - https://www.reddit.com/r/wanderlog/comments/1sykv2r/update_importing_from_google_maps_into_wanderlog/

Interpretation: import/export friction is real enough to keep on the roadmap, but these posts do not prove Reese-max’s current owner needs a bulk importer now. Given the private-alpha direction, broad import remains deferred.

## Opportunity Map — google-maps-personal-mcp

### MUST MATCH

1. **Truthful identity semantics:** a Place ID is storable and reusable, but not immutable forever. Durable personal metadata must not be silently stranded when the provider identity rolls over.
2. **User-owned data durability:** notes/tags/priority/collection membership survive provider refresh/expiry and any future identity transition.
3. **Provider-content compliance:** retain #1’s separation between durable user data/place identity and policy-bound provider fields.
4. **Bounded mutation ownership:** retain #2’s requirement that sync work is not double-claimed.
5. **Explicit receipts:** stale/unavailable/moved/ambiguous conditions must be typed instead of silently guessed.

### SHOULD BE BETTER

1. Eventually accept a place artifact the user already has (e.g., one shared Maps link) instead of forcing re-search, **if** real first-success observation shows this is a frequent handoff.
2. Make export/backup of **user-owned** collections visibly simpler than a closed consumer map, without mirroring restricted provider content.
3. Keep identity refresh cheaper than full rich-details refresh where current SKU semantics allow it.

### DIFFERENTIATOR

- Local user-authored truth and inspectable SQLite state.
- Deterministic notes/tags/ranking/dedup/trip helpers rather than opaque recommendation ranking.
- Google as a replaceable discovery/effect boundary, not the canonical home of personal context.
- Dry-run-by-default, bounded sync with truthful partial-failure semantics.

### ADJACENT IDEA

- Apple-style explicit correction/retention semantics for personal place records.
- One-link capture or Takeout import only after observed onboarding/capture friction.
- `navigationPoints`/entrances only if final-arrival errors become observable in trip use.

### DO NOT COPY

- Generic Ask Maps-style recommendation AI.
- Social feed / influencer graph / public discovery marketplace.
- Automatic location-history collection.
- Broad cross-provider import framework, hosted identity registry, or native mobile app before the core local + bounded-sync path is validated.
- Automatically guessing a replacement place after ambiguous `NOT_FOUND`.

## Four-gate decision — Place ID rollover continuity

### 1. Problem / value

**Target user / north star:** a technical individual building a durable personal place knowledge layer locally, with Google only as discovery/sync boundary.

**Observable repo gap:** README/tool docs call Place ID stable; DB schema keys both provider record and collection membership by that ID; current detail client neither requests moved-place fields nor has a transition path. Google explicitly says Place IDs may change/expire and documents a moved-place successor field.

**Existing alternatives:**

- Do nothing: user can manually search/save the replacement, but personal notes/tags/priority may remain attached to the old record and the product’s “durable” promise becomes misleading.
- Docs-only: fixes the false permanence claim, but does not answer metadata continuity.
- #1: solves retention of provider-owned content, not provider identity rollover.

**Not doing it:** severity cannot be established from incidence yet. There is no evidence this has happened in the owner corpus. However, the causal condition is provider-documented and conflicts with the product’s durable-identity premise, so a bounded research decision is justified.

### 2. Priority / classification

Created Issue #4 with:

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `evidence=SOURCE_CONFIRMED`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

No P0/P1/P2 claim is made. Opportunity ranking is qualitative:

| Candidate | User Pain | Strategic Fit | Evidence | Reuse | Effort | Security/Privacy/Cost | Decision |
|---|---|---|---|---|---|---|---|
| Place-ID rollover continuity | Frequency UNKNOWN; impact high if it happens | High | High for provider semantics + repo gap; runtime incidence UNKNOWN | High inside core collection model | Low–Medium if local remap suffices | Auto-remap ambiguity is main risk; IDs-only check can be bounded | **Research #4** |
| One shared-link capture | Plausible manual handoff; repo-user frequency UNKNOWN | High | Strong competitor evidence, weak owner evidence | Medium | UNKNOWN because Google short-link resolution path must stay supported/legal | URL/privacy/parser maintenance risk | Radar only |
| Google Takeout/bulk import | Community pain visible | Medium | External/community moderate; owner need UNKNOWN | Medium | Medium–High | File parsing + provider-data boundary | Deferred |
| Navigation-point enrichment | Pain UNKNOWN | Medium | Provider capability high, product need low | Low–Medium | Low–Medium | Additional field/cost surface | No Issue |
| Generic AI recommendations | Incumbent already strong | Low | High market evidence | Low | High | Cost/privacy/maintenance high | Reject |

### 3. Smallest safe research

Issue #4 asks only for two deterministic fixtures using the existing mocked Places transport + isolated SQLite:

1. old ID returns documented `movedPlaceId`;
2. old ID returns `NOT_FOUND` with no unambiguous successor.

Compare only:

- no change + truthful documentation;
- explicit user-confirmed local remap;
- minimal automatic remap **only** when the provider gives an unambiguous successor.

Do not create an alias registry, generic entity-resolution framework, hosted service, or cross-provider identity layer. Ambiguous `NOT_FOUND` must remain review-required/unresolved.

### 4. Research / implementation separation

Exit conditions in #4:

- **BUILD:** fixture proves current continuity breaks and a bounded local remap safely preserves user metadata.
- **NARROW:** docs/refresh semantics or user-confirmed remap are sufficient.
- **REJECT:** #1’s final retention design or provider semantics make a distinct rollover mechanism unnecessary/unsafe.

Even `BUILD` would only approve a next decision on the smallest local path; it is not implementation authorization. No runtime/provider execution was performed this round.

## Cross-portfolio ideas

Only one cross-portfolio principle had enough value to retain:

### Provider identifier ≠ permanent product identity

Any Reese-max product that stores external provider IDs should distinguish:

`provider identifier -> provider lifecycle / redirect / replacement signal -> local user-owned record -> explicit remap decision`

This is a design caution, **not** a request to create a portfolio-wide identity framework. Apply only where a provider documents rollover and a repo actually keeps durable user-owned metadata.

## Rejected / deferred ideas

1. **Broad Google Maps / Takeout importer** — useful market signal, but owner direction currently prioritizes #1, #2, one bounded live-sync proof, and first-success evidence. A broad importer adds parsing/provider-policy surface before that evidence exists.
2. **Native mobile/share-sheet app** — Rego/Mapstr show strong capture UX, but the current primary user is MCP/CLI-oriented; no evidence justifies a second client.
3. **AI screenshot/social-video place extraction** — Google/Mapstr/Altrove-style extraction is attractive but introduces model cost, false-match review, media permissions, and privacy burden. No owner evidence.
4. **Generic identity registry / alias service** — architecture is not a defect. Test one documented rollover case first.
5. **Use `navigationPoints` immediately** — new API availability alone is not user pain.
6. **Places Insights historical analytics** — Google released historical snapshots and count-change functions in 2026, but portfolio product scope is personal place knowledge, not market intelligence; no fit.

## Issue Mapping / write verification

- #1 — unchanged; distinct retention fingerprint.
- #2 — unchanged; distinct sync-concurrency fingerprint.
- #3 — unchanged umbrella.
- **#4 created:** `[Research][RESEARCH_REQUIRED] Validate Place ID rollover without losing personal metadata`
  - URL: https://github.com/Reese-max/google-maps-personal-mcp/issues/4
  - Created/read back successfully at 2026-09-15T16:14:49Z.
  - No existing Issue was mutated, so no pre-existing Issue lease was taken over.
  - No PR/non-main branch existed at creation time.
  - `auto_implementation=false`; no worker/branch/run was started.

## What Changed Since Last Radar

Compared with `docs/competitive-intelligence/2026-09-15T140841Z-external-radar.md`:

1. Fair rotation advanced from `flux-image-gen` to `google-maps-personal-mcp`.
2. The target is now confirmed product-like/private-alpha rather than relying on any old UNKNOWN classification.
3. Fresh external review found a **new identity-contract mismatch**: the repo treats `place_id` as stable/permanent, while Google documents that IDs can change/become obsolete and now exposes a relocation successor.
4. This is not a rename of #1: provider-content retention and provider-identifier rollover have different triggers, symptoms, and smallest remedies.
5. One narrow RESEARCH Issue (#4) was created; no implementation scope was authorized.
6. Direct-competitor signals continue to favor quick capture/import and private personal context, but they do not overturn the current “prove core sync first” direction.

## Sources

Checked 2026-09-15 UTC unless noted.

| Source | Source/event date | Confidence | Use |
|---|---:|---|---|
| Google Places API release notes — https://developers.google.com/maps/documentation/places/web-service/release-notes | `movedPlace*` 2025-10-20; `entrances/navigationPoints` 2026-08-06 | CONFIRMED | Provider lifecycle + new fields |
| Google Place IDs — https://developers.google.com/maps/documentation/places/web-service/place-id | current docs; page update date not asserted | CONFIRMED | IDs may change; >12-month refresh; obsolete NOT_FOUND |
| Google Place Details — https://developers.google.com/maps/documentation/places/web-service/place-details | current docs; page update date not asserted | CONFIRMED | moved-place successor/chaining semantics |
| Google Maps Platform pricing — https://developers.google.com/maps/billing-and-pricing/pricing | page last updated 2026-09-10 UTC | CONFIRMED | Current pricing boundary |
| Place Data Fields — https://developers.google.com/maps/documentation/places/web-service/data-fields | current docs | CONFIRMED | `movedPlaceId` IDs-only tier signal |
| Google Ask Maps — https://blog.google/products-and-platforms/products/maps/ask-maps-immersive-navigation/ | 2026-03-12 | CONFIRMED | Incumbent generic discovery/action strategy |
| Rego — https://rego.app/ | current 2026 page; exact Rego 3 release date UNKNOWN | CONFIRMED capability / UNKNOWN release date | Private library, share-sheet capture, round-trip export |
| Mapstr import — https://en.mapstr.com/fonctionnalites/importer-des-adresses | publication date UNKNOWN | CONFIRMED capability / UNKNOWN release date | Share/import workflow |
| Apple Visited Places privacy — https://support.apple.com/en-ca/guide/personal-safety/ipsae6d4500b/web | Published February 2026 | CONFIRMED | E2EE history, retention, correction, notes |
| Reddit Google Maps export thread — https://www.reddit.com/r/GoogleMaps/comments/1c551hz/is_it_possible_to_export_a_saved_list_of_locations/ | relevant comments Jun/Aug 2026 | COMMUNITY_SIGNAL | Export/onboarding friction only |
| Reddit QGIS export thread — https://www.reddit.com/r/QGIS/comments/1scui34/export_google_maps_saved_places_lists_with/ | Apr/Jun 2026 | COMMUNITY_SIGNAL | Missing coordinates/manual conversion |
| Reddit Wanderlog workaround — https://www.reddit.com/r/wanderlog/comments/1sykv2r/update_importing_from_google_maps_into_wanderlog/ | 2026-04-29 | COMMUNITY_SIGNAL | Manual import workaround |

## Completion / gaps / next cursor

- A/B/C exploration completed with external public-web sources as the primary market evidence.
- Target repo/open Issues/closed Issues/all-state PRs/branches and owner direction were checked; no existing Issue was edited.
- Runtime/provider validation: **not executed**, therefore Issue #4 remains `NEEDS_RUNTIME_VERIFICATION` / `NEEDS_EVIDENCE`.
- No portfolio CLEAN claim.
- Next cold-rotation cursor: **`herdr-skills`**.
