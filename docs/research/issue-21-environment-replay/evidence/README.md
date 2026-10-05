# Frozen author evidence

The immutable [raw result](run/result.json) records 38 PASS cases
and 34 rejected preflights. Its relative case
receipt/observation locators resolve inside `run/`; all are included unchanged.
The original absolute `runRoot` is historical provenance, mapped to this `run/`
archive. Replay into a new owned directory rather than modifying these records.

Frozen result digest: `bc41c7eb79bd1459c5c1f5224611b4735003e16942c9c8a7cebdbdc7d0c59665`.

`native-copied-run` contains the genuine **paused** SDK continuation bytes and
every `native-copy-manifest.json` file locator. Those files were copied/read back
before same-path native resume. `native-pause.json` records that earlier state;
`native-data` / `native-resume.json` record the **later** completed native run.
The paused run had no verified checkpoint; subsequent same-path completion
created one. The wrapper refused relocation before native dispatch; the native
adapter itself does not enforce relocation. Coordination databases and lock
artifacts are outside the continuation inventory and are not published.

Disposable Git databases/project directories, raw cost/reservation SQLite and
dependencies are excluded. Strict schemas, actual source/target observations,
all case inputs/logs/receipts, native state/attempt/evidence snapshots and billing
config/report/claim snapshots retain this bounded experiment's proof. The
portable instrument recreates actual disposable repositories and ledgers.
Historical failed harness runs are excluded; they were fixture-ID and
verifyCommand API mistakes, not product defects.
