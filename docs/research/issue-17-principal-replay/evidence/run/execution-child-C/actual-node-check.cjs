require('node:test')('actual local result',()=>{const r=JSON.parse(require('node:fs').readFileSync('result.json','utf8'));require('node:assert/strict').ok(r.executionId&&r.principalId)})
