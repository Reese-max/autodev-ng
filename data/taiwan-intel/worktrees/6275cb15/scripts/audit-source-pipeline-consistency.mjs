import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { DOMAIN_COVERAGE } from "./domain-coverage.mjs";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

// 覆蓋門檻只納入這四個事件層核心領域；其他參考、僅查詢與缺口不在本稽核範圍。
export const CORE_COVERAGE_DOMAINS = Object.freeze({
  "治安／警政": ["police", "missing", "twnews"],
  "災防／氣象": ["cwa", "cwaWarnings", "ncdr"],
  "交通／停車": ["police", "parkingHsinchu", "parkingTaoyuan"],
  "水情／環境": ["wra", "wraRiver", "moenvAir"],
});

// 這是檢查契約，不是第二套抓取器。檔案與符號直接指向既有管線，避免設定名單悄悄脫離執行程式。
export const SOURCE_IMPLEMENTATIONS = Object.freeze({
  cwa: {
    entryPatterns: ["fetchCwa"],
    implementationFile: "lib/fetch-cwa.mjs",
    implementationPatterns: ["export async function fetchCwa"],
    endpointPatterns: ["opendata.cwa.gov.tw"],
  },
  cwaWarnings: {
    activationSource: "cwa",
    entryPatterns: ["fetchCwaWarnings"],
    implementationFile: "lib/fetch-cwa.mjs",
    implementationPatterns: ["export async function fetchCwaWarnings"],
    endpointPatterns: ["opendata.cwa.gov.tw"],
  },
  ncdr: {
    entryPatterns: ["fetchNcdrAlerts"],
    implementationFile: "lib/fetch-ncdr.mjs",
    implementationPatterns: ["export async function fetchNcdrAlerts"],
    endpointPatterns: ["alerts.ncdr.nat.gov.tw"],
  },
  police: {
    entryPatterns: ["fetchPolice"],
    implementationFile: "lib/fetch-police.mjs",
    implementationPatterns: ["export async function fetchPolice"],
    endpointPatterns: ["queryTwinkleRows"],
  },
  missing: {
    entryPatterns: ["fetchMissing"],
    implementationFile: "lib/fetch-missing.mjs",
    implementationPatterns: ["export async function fetchMissing"],
    endpointPatterns: ["eze8.npa.gov.tw"],
  },
  twnews: {
    entryPatterns: ["fetchRssItems"],
    implementationFile: "lib/fetch-rss.mjs",
    implementationPatterns: ["export async function fetchRssItems"],
    endpointPatterns: ["https://"],
  },
  parkingHsinchu: {
    entryPatterns: ["parkingHsinchu: () => fetchParkingHsinchu"],
    implementationFile: "lib/fetch-official.mjs",
    implementationPatterns: ["export async function fetchParkingHsinchu"],
    endpointPatterns: ["queryTwinkleRows"],
  },
  parkingTaoyuan: {
    entryPatterns: ["parkingTaoyuan: () => fetchParkingTaoyuan"],
    implementationFile: "lib/fetch-official.mjs",
    implementationPatterns: ["export async function fetchParkingTaoyuan"],
    endpointPatterns: ["queryTwinkleRows"],
  },
  wra: {
    entryPatterns: ["wra: () => fetchWraReservoirLevels"],
    implementationFile: "lib/fetch-official.mjs",
    implementationPatterns: ["export async function fetchWraReservoirLevels"],
    endpointPatterns: ["WRA_URL"],
  },
  wraRiver: {
    entryPatterns: ["wraRiver: () => fetchWraRiverLevels"],
    implementationFile: "lib/fetch-official.mjs",
    implementationPatterns: ["export async function fetchWraRiverLevels"],
    endpointPatterns: ["WRA_RIVER_LEVEL_URL"],
  },
  moenvAir: {
    entryPatterns: ["moenvAir: () => fetchMoenvAirQuality"],
    implementationFile: "lib/fetch-official.mjs",
    implementationPatterns: ["export async function fetchMoenvAirQuality"],
    endpointPatterns: ["MOENV_AIR_STATION_URL", "queryTwinkleRows"],
  },
});

function text(value) {
  return String(value ?? "");
}

function readText(relativePath, files) {
  if (files?.[relativePath] !== undefined) return text(files[relativePath]);
  const absolutePath = join(SCRIPTS_DIR, relativePath.replace(/^scripts[\\/]/, ""));
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : null;
}

export function readEnabledSources(sourceText) {
  const texts = sourceText === undefined
    ? [readText("fetch-live.mjs"), readText("ci-fetch-mode.mjs")]
    : [sourceText];
  const sources = new Set();
  for (const text of texts) {
    for (const match of String(text || "").matchAll(/(?:process\.env\.SOURCES \|\| "|--sources=)([A-Za-z0-9_,]+)/g)) {
      for (const source of match[1].split(",")) if (source) sources.add(source);
    }
  }
  return [...sources];
}

function finding({ code, domain, source, file, expected, reason }) {
  return { code, domain, source, file, expected, reason };
}

export function auditSourcePipelineConsistency({
  domains = CORE_COVERAGE_DOMAINS,
  enabledSources = readEnabledSources(),
  implementations = SOURCE_IMPLEMENTATIONS,
  files = {},
  configuredDomains = DOMAIN_COVERAGE,
} = {}) {
  const failures = [];
  const configuredByKey = new Map((Array.isArray(configuredDomains) ? configuredDomains : []).map((row) => [row.key, row]));
  const enabled = new Set(enabledSources);

  for (const [domain, sources] of Object.entries(domains || {})) {
    const configured = configuredByKey.get(domain);
    if (!configured) {
      failures.push(finding({
        code: "domain-not-configured",
        domain,
        source: "(domain)",
        file: "scripts/domain-coverage.mjs",
        expected: domain,
        reason: `核心領域只存在於一致性設定，未在 scripts/domain-coverage.mjs 找到同名領域`,
      }));
      continue;
    }
    if (configured.status !== "integrated") {
      failures.push(finding({
        code: "domain-not-integrated",
        domain,
        source: "(domain)",
        file: "scripts/domain-coverage.mjs",
        expected: "status=integrated",
        reason: `核心領域狀態為 ${text(configured.status)}，未計入事件層覆蓋門檻`,
      }));
    }

    for (const source of sources) {
      const contract = implementations[source];
      if (!contract) {
        failures.push(finding({
          code: "source-contract-missing",
          domain,
          source,
          file: "scripts/audit-source-pipeline-consistency.mjs",
          expected: "SOURCE_IMPLEMENTATIONS entry",
          reason: `來源已列入核心領域設定，但沒有一致性契約可追蹤執行入口與端點`,
        }));
        continue;
      }
      const activationSource = contract.activationSource || source;
      if (!enabled.has(activationSource)) {
        failures.push(finding({
          code: "source-not-enabled",
          domain,
          source,
          file: "scripts/fetch-live.mjs",
          expected: `configured sources includes ${activationSource}`,
          reason: `來源已列入覆蓋門檻，但啟用設定沒有 ${source}（啟用開關：${activationSource}）`,
        }));
      }

      const entryText = readText("fetch-live.mjs", files);
      const missingEntry = (contract.entryPatterns || []).find((pattern) => !entryText?.includes(pattern));
      if (missingEntry) {
        failures.push(finding({
          code: "missing-execution-entrypoint",
          domain,
          source,
          file: "scripts/fetch-live.mjs",
          expected: missingEntry,
          reason: `設定來源 ${source} 找不到既有抓取執行入口符號 ${missingEntry}`,
        }));
      }

      const implementationText = readText(contract.implementationFile, files);
      if (implementationText === null) {
        failures.push(finding({
          code: "missing-parser-file",
          domain,
          source,
          file: contract.implementationFile,
          expected: "readable implementation file",
          reason: `來源 ${source} 的解析檔案不存在或無法讀取`,
        }));
        continue;
      }
      const missingImplementation = (contract.implementationPatterns || []).find((pattern) => !implementationText.includes(pattern));
      if (missingImplementation) {
        failures.push(finding({
          code: "missing-parser-entrypoint",
          domain,
          source,
          file: contract.implementationFile,
          expected: missingImplementation,
          reason: `來源 ${source} 找不到既有解析／抓取函式 ${missingImplementation}`,
        }));
      }
      const missingEndpoint = (contract.endpointPatterns || []).every((pattern) => !implementationText.includes(pattern));
      if (missingEndpoint) {
        failures.push(finding({
          code: "missing-endpoint",
          domain,
          source,
          file: contract.implementationFile,
          expected: contract.endpointPatterns.join(" 或 "),
          reason: `來源 ${source} 的既有解析檔案沒有可追溯端點或既有 MCP 查詢入口證據`,
        }));
      }
    }
  }

  return {
    ok: failures.length === 0,
    coreDomainCount: Object.keys(domains || {}).length,
    enabledSources: [...enabled],
    checkedSources: [...new Set(Object.values(domains || {}).flat())],
    failures,
  };
}

export function formatConsistencyResult(result) {
  if (result.ok) {
    return `來源管線一致性通過：${result.coreDomainCount} 個核心領域／${result.checkedSources.length} 個來源皆有啟用設定、執行入口與端點證據`;
  }
  return [
    `來源管線一致性失敗：${result.failures.length} 個可追溯問題`,
    ...result.failures.map((item) => `- [${item.code}] ${item.domain}／${item.source}：${item.reason}（檔案：${item.file}；預期：${item.expected}）`),
  ].join("\n");
}

export function runSelfTest() {
  const result = auditSourcePipelineConsistency({
    domains: { 測試領域: ["設定但不存在"] },
    enabledSources: ["設定但不存在"],
    implementations: {},
    configuredDomains: [{ key: "測試領域", status: "integrated" }],
  });
  assert.equal(result.ok, false);
  assert.equal(result.failures[0].code, "source-contract-missing");
  return result;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes("--self-test")) {
    runSelfTest();
    console.log("來源管線一致性自我檢查通過");
  } else {
    const result = auditSourcePipelineConsistency();
    if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
    else console.log(formatConsistencyResult(result));
    if (!result.ok) process.exitCode = 1;
  }
}
