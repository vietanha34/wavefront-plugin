#!/usr/bin/env node
/**
 * wave-plan — chia task thanh wave bang phep toan tap hop tren closed file list.
 *
 * Day la phan TAT DINH cua B4/B6 trong epic-taskization: hai task cham cung mot file
 * thi khong duoc cung wave. Khong can model, nen doi model yeu hon van dung.
 *
 * Dung:
 *   node wave-plan.mjs tasks.json [--json]
 *
 * tasks.json:
 * {
 *   "contract_surface": ["packages/validation/**"],
 *   "shared_surface":   ["apps/web/src/components/ReportShell.tsx"],
 *   "tasks": [
 *     { "id": "SG-P3-W?-T1-ctr", "role": "ctr", "closed_files": ["packages/validation/segment.ts"] },
 *     { "id": "SG-P3-W?-T2-be",  "role": "be",  "closed_files": ["apps/api/src/segment.ts"] }
 *   ]
 * }
 *
 * Luat:
 *   W0        role `ctr`, hoac task cham contract_surface  -> bat buoc truoc moi thu
 *   W1..n     implementation; giao file thi day sang wave sau
 *   W-cuoi    role `int`, `vis`, `docs` -> luon o wave cuoi
 *   lane      task cham shared_surface -> MOT task mot luc, khong song song
 *
 * Exit 0 = chia duoc. Exit 1 = input sai, co task thieu closed_files, hoac mot surface
 * khong khop file nao trong repo (config cu — chay tu trong repo de duoc kiem).
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const LAST = new Set(["int", "vis", "docs"]);
const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
const file = argv.find((a) => !a.startsWith("--"));

const raw = file ? readFileSync(file, "utf8") : readFileSync(0, "utf8");
const input = JSON.parse(raw);
const tasks = input.tasks ?? [];
if (!tasks.length) { console.error("Khong co task nao."); process.exit(1); }

const problems = [];
for (const t of tasks) {
  if (!Array.isArray(t.closed_files) || !t.closed_files.length) {
    problems.push(`${t.id ?? "?"}: thieu closed_files — khong chia wave duoc.`);
  }
}
if (problems.length) {
  problems.forEach((p) => console.error("x " + p));
  process.exit(1);
}

/* glob toi thieu: ho tro ** va * */
function globToRe(g) {
  const esc = g.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp("^" + esc.replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*") + "$");
}
const contractRe = (input.contract_surface ?? []).map(globToRe);
const sharedRe = (input.shared_surface ?? []).map(globToRe);
const touches = (files, res) => files.some((f) => res.some((r) => r.test(f)));

/* surface khong khop file nao = config cu -> lan dung chung im lang mat tac dung. Phai do. */
let tracked = null;
try {
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
} catch {
  console.error("! khong doc duoc git ls-files — bo qua kiem surface (chay tu trong repo de kiem).");
}
if (tracked) {
  const stale = [...(input.contract_surface ?? []), ...(input.shared_surface ?? [])]
    .filter((g) => !tracked.some((f) => globToRe(g).test(f)));
  if (stale.length) {
    stale.forEach((g) => console.error(`x surface khong khop file nao trong repo: ${g} — sua surfaces trong .wavefront/config.yaml.`));
    process.exit(1);
  }
}

const overlap = (a, b) => a.some((f) => b.includes(f));

/* ---------- phan loai ---------- */

const w0 = [];
const mid = [];
const last = [];

for (const t of tasks) {
  if (t.role === "ctr" || touches(t.closed_files, contractRe)) w0.push(t);
  else if (LAST.has(t.role)) last.push(t);
  else mid.push(t);
}

/* ---------- chia wave cho phan giua ---------- */

const waves = [];
const conflicts = [];
const laneHolders = [];

for (const t of mid) {
  const inLane = touches(t.closed_files, sharedRe);
  let placed = -1;

  for (let w = 0; w < waves.length; w++) {
    const clash = waves[w].find((o) => overlap(o.closed_files, t.closed_files));
    if (clash) {
      conflicts.push({ a: clash.id, b: t.id, files: t.closed_files.filter((f) => clash.closed_files.includes(f)) });
      continue;
    }
    // lan dung chung: mot task mot luc
    if (inLane && waves[w].some((o) => touches(o.closed_files, sharedRe))) continue;
    placed = w; break;
  }
  if (placed === -1) { waves.push([t]); placed = waves.length - 1; }
  else waves[placed].push(t);

  if (inLane) laneHolders.push({ id: t.id, wave: placed + 1 });
}

/* ---------- ket qua ---------- */

const plan = [];
if (w0.length) plan.push({ wave: "W0", kind: "CONTRACT", tasks: w0.map((t) => t.id) });
waves.forEach((ws, i) => plan.push({ wave: `W${i + 1}`, kind: "IMPLEMENTATION", tasks: ws.map((t) => t.id) }));
if (last.length) plan.push({ wave: `W${waves.length + 1}`, kind: "INTEGRATION+VISUAL", tasks: last.map((t) => t.id) });

if (!last.length) {
  conflicts.push({ warn: "Khong co task int/vis/docs — wave cuoi la BAT BUOC o moi phase." });
}

if (asJson) {
  console.log(JSON.stringify({ plan, conflicts, lanes: laneHolders }, null, 2));
} else {
  for (const p of plan) {
    console.log(`\n${p.wave}  ${p.kind}`);
    p.tasks.forEach((id) => console.log(`  - ${id}`));
  }
  if (laneHolders.length) {
    console.log("\nLan dung chung (mot task mot luc, GLOBAL ca cac epic khac):");
    laneHolders.forEach((l) => console.log(`  - ${l.id} -> W${l.wave}`));
  }
  if (conflicts.length) {
    console.log("\nGhi chu:");
    for (const c of conflicts) {
      if (c.warn) console.log(`  ! ${c.warn}`);
      else console.log(`  ! ${c.a} va ${c.b} giao file: ${c.files.join(", ")} -> tach wave, nguoi sau rebase`);
    }
  }
  console.log(`\n${tasks.length} task -> ${plan.length} wave`);
}
