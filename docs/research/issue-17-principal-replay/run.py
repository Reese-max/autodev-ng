#!/usr/bin/env python3
"""Launch only the offline study with a whitelist environment; no provider config."""
import os
from pathlib import Path
import shutil
import subprocess
import sys

here = Path(__file__).resolve().parent
source = sys.argv[1] if len(sys.argv) > 1 else "/workspace/repos/autodev-principal-research"
node = sys.argv[2] if len(sys.argv) > 2 else shutil.which("node")
output = Path(sys.argv[3]).resolve() if len(sys.argv) > 3 else here / "author-output"
output.mkdir(parents=True, exist_ok=True)
if not node:
    raise SystemExit("Node >=22 is required")
keys = ["PATH", "PATHEXT", "SYSTEMROOT", "WINDIR", "COMSPEC", "TEMP", "TMP"]
fixture_env = {key: os.environ[key] for key in keys if key in os.environ}
fixture_env["PATH"] = str(Path(node).resolve().parent) + os.pathsep + fixture_env.get("PATH", "")
import hashlib
import json
version = subprocess.check_output([node, "--version"], env=fixture_env, text=True).strip()
source_sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=source, env=fixture_env, text=True).strip()
build_command = [node, str(Path(source) / "node_modules/typescript/bin/tsc"), "-p", "tsconfig.build.json"]
build = subprocess.run(build_command, cwd=source, env=fixture_env, text=True, capture_output=True, timeout=90)
(output / "build-final.log").write_text(build.stdout + build.stderr, encoding="utf-8")
compiled = ["dist/engines/freebuff.js", "dist/preflight.js", "dist/engines/evidence-chain.js", "dist/engines/execution-observation.js"]
receipt = {"source_sha": source_sha, "node": version, "command": build_command,
           "exit_code": build.returncode, "source_build_script": "tsc -p tsconfig.build.json",
           "environment_keys": sorted(fixture_env),
           "compiled_sha256": {name: hashlib.sha256((Path(source) / name).read_bytes()).hexdigest()
                               for name in compiled} if build.returncode == 0 else {}}
(output / "build-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
if build.returncode:
    sys.stderr.write(build.stderr + build.stdout)
    raise SystemExit(build.returncode)
result = subprocess.run([node, str(here / "replay.mjs"), source, str(output)], cwd=source,
                        env=fixture_env, text=True, capture_output=True, timeout=90)
(output / "replay-final.log").write_text(result.stdout + result.stderr, encoding="utf-8")
sys.stdout.write(result.stdout)
sys.stderr.write(result.stderr)
raise SystemExit(result.returncode)
