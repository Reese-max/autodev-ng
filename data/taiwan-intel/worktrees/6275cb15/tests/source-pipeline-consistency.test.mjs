import assert from "node:assert/strict";
import {
  auditSourcePipelineConsistency,
  CORE_COVERAGE_DOMAINS,
  runSelfTest,
} from "../scripts/audit-source-pipeline-consistency.mjs";

const current = auditSourcePipelineConsistency();
assert.equal(current.ok, true, JSON.stringify(current.failures, null, 2));
assert.equal(current.coreDomainCount, 4);
assert.equal(Object.keys(CORE_COVERAGE_DOMAINS).length, 4);

const missingEntrypoint = auditSourcePipelineConsistency({
  domains: { "測試領域": ["ghost"] },
  enabledSources: ["ghost"],
  implementations: {
    ghost: {
      entryPatterns: ["fetchGhost"],
      implementationFile: "ghost.mjs",
      implementationPatterns: ["export function fetchGhost"],
      endpointPatterns: ["https://ghost.example"],
    },
  },
  configuredDomains: [{ key: "測試領域", status: "integrated" }],
  files: {
    "fetch-live.mjs": "const SOURCES = \"ghost\";",
    "ghost.mjs": "export function fetchGhost() {}",
  },
});
assert.equal(missingEntrypoint.ok, false);
assert.equal(missingEntrypoint.failures[0].code, "missing-execution-entrypoint");

const missingEndpoint = auditSourcePipelineConsistency({
  domains: { "測試領域": ["ghost"] },
  enabledSources: ["ghost"],
  implementations: {
    ghost: {
      entryPatterns: ["fetchGhost"],
      implementationFile: "ghost.mjs",
      implementationPatterns: ["export function fetchGhost"],
      endpointPatterns: ["https://ghost.example"],
    },
  },
  files: {
    "fetch-live.mjs": "fetchGhost;",
    "ghost.mjs": "export function fetchGhost() {}",
  },
  configuredDomains: [{ key: "測試領域", status: "integrated" }],
});
assert.equal(missingEndpoint.failures[0].code, "missing-endpoint");
assert.equal(runSelfTest().failures[0].code, "source-contract-missing");

console.log("source-pipeline-consistency checks passed");
