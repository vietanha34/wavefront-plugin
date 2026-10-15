#!/usr/bin/env node
/**
 * name-check — kiem tieu de va nhan issue theo docs/NAMING.md
 *
 * Dung:
 *   node name-check.mjs --issues issues.json [--config .wavefront/config.yaml] [--json]
 *   cat issues.json | node name-check.mjs --config .wavefront/config.yaml
 *
 * issues.json: mang object, moi object can { id, title, labels[], parentId, projectMilestone }
 *   — dung dung dang Linear MCP list_issues tra ve (labels la mang ten, hoac mang {name}).
 *
 * Exit 0 = khong co loi ERROR. Exit 1 = co ERROR. WARN khong lam that bai.
 * Khong phu thuoc package ngoai.
 */

import { readFileSync } from "node:fs";

const ROLES = ["spec", "ctr", "be", "fe", "int", "vis", "fix", "docs", "ops"];
const KINDS = ["P", "ADD", "FIX", "DEBT", "DEC", "OPS", "DOC"];
const MAX_BODY = 80;
const MAX_SHORT = 12;

const RE_EPIC = /^EPIC · (?<short>.{1,40})$/u;
const RE_TASK = new RegExp(
  `^(?<short>[^·]{1,${MAX_SHORT}}) · (?<kind>P\\d+|(?:ADD|FIX|DEBT|DEC|OPS|DOC)\\d*) — (?<body>.+)$`,
  "u",
);
// dang trong wave
const RE_SUB = new RegExp(
  `^(?<code>[A-Z]{2,5})-P(?<p>\\d+)-W(?<w>\\d+)-T(?<n>\\d+)(?<sfx>[a-z]?)-(?<role>${ROLES.join("|")})(?:-(?<slug>[a-z0-9-]{1,24}))?(?:\\s+(?<body>.+))?$`,
  "u",
);
// dang ngoai wave: <CODE>-OPS-<slug>
const RE_SUB_OPS = /^(?<code>[A-Z]{2,5})-OPS-(?<slug>[a-z0-9-]{1,24})(?:\s+(?<body>.+))?$/u;

const findings = [];
function add(level, id, rule, msg, fix) {
  findings.push({ level, id, rule, msg, fix });
}

/* ---------- doc tham so ---------- */

const argv = process.argv.slice(2);
function flag(name) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? null : argv[i + 1];
}
const asJson = argv.includes("--json");

/* ---------- registry epic ---------- */

function loadRegistry(path) {
  if (!path) return null;
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    add("WARN", "-", "config", `Khong doc duoc ${path} — bo qua kiem registry.`);
    return null;
  }
  // Doc theo dong: regex da tung dung `\\Z` (khong ton tai trong JS) nen khoi
  // `epics:` khong bao gio doc duoc, va luat "CODE phai co trong registry" khong chay.
  const lines = raw.split(/\r?\n/);
  const head = lines.findIndex((l) => /^epics:\s*$/.test(l));
  if (head === -1) {
    add("WARN", "-", "config", "config.yaml khong co khoi `epics:` — bo qua kiem registry.");
    return null;
  }
  const codes = [];
  const shorts = [];
  for (let i = head + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === "" || l.startsWith("#")) continue;
    if (!/^\s/.test(l)) break;                 // het khoi: khoa cap 1 tiep theo
    let m = l.match(/^\s*-?\s*code:\s*["']?([A-Z]{2,5})["']?\s*$/);
    if (m) { codes.push(m[1]); continue; }
    m = l.match(/^\s*-?\s*short:\s*["']?(.+?)["']?\s*$/);
    if (m) shorts.push(m[1].trim());
  }
  if (!codes.length) {
    add("WARN", "-", "config", "Khoi `epics:` khong co `code:` nao hop le.");
    return null;
  }
  return { codes: new Set(codes), shorts: new Set(shorts) };
}

/* ---------- doc issue ---------- */

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function loadIssues() {
  const p = flag("issues");
  const raw = p ? readFileSync(p, "utf8") : readStdin();
  if (!raw.trim()) {
    console.error("Khong co du lieu issue. Dung --issues <file> hoac pipe JSON vao stdin.");
    process.exit(1);
  }
  const data = JSON.parse(raw);
  const arr = Array.isArray(data) ? data : data.issues;
  if (!Array.isArray(arr)) {
    console.error("JSON phai la mang issue, hoac object co khoa `issues`.");
    process.exit(1);
  }
  return arr;
}

const labelNames = (iss) =>
  (iss.labels ?? []).map((l) => (typeof l === "string" ? l : l?.name)).filter(Boolean);

const tier = (labels) =>
  labels.includes("level/epic") ? "epic"
  : labels.includes("level/task") ? "task"
  : labels.includes("level/subtask") ? "subtask"
  : null;

/* ---------- kiem tieu de ---------- */

function checkEpic(iss, title) {
  const m = title.match(RE_EPIC);
  if (!m) {
    add("ERROR", iss.id, "epic-title", `Tieu de epic sai dang: ${JSON.stringify(title)}`,
      "EPIC · <short>");
    return;
  }
  if (m.groups.short.length > MAX_SHORT) {
    add("WARN", iss.id, "epic-short", `<short> dai ${m.groups.short.length} > ${MAX_SHORT} ky tu.`);
  }
}

function checkTask(iss, title, reg) {
  const m = title.match(RE_TASK);
  if (!m) {
    // chan doan cu the de sua nhanh
    if (!title.includes(" · ")) {
      add("ERROR", iss.id, "task-title", `Thieu "<short> · " hoac sai dau phan cach: ${JSON.stringify(title.slice(0, 70))}`,
        "<short> · <KIND> — <noi dung>");
    } else if (!title.includes(" — ")) {
      add("ERROR", iss.id, "task-title", `Thieu em dash " — " truoc noi dung: ${JSON.stringify(title.slice(0, 70))}`,
        'dung " — " (U+2014), khong dung ":" hay "-"');
    } else {
      const kind = title.split(" · ")[1]?.split(" — ")[0];
      add("ERROR", iss.id, "task-kind", `KIND khong hop le: ${JSON.stringify(kind)}`,
        `mot trong: ${KINDS.join(" ")}`);
    }
    return;
  }
  const { short, body } = m.groups;
  if (body.length > MAX_BODY) {
    add("ERROR", iss.id, "task-body", `Noi dung ${body.length} ky tu > ${MAX_BODY}. Don phan con lai xuong description.`);
  }
  if (reg && !reg.shorts.has(short.trim())) {
    add("WARN", iss.id, "task-short", `<short> "${short.trim()}" khong co trong registry epic.`);
  }
}

function checkSubtask(iss, title, reg) {
  const m = title.match(RE_SUB) ?? title.match(RE_SUB_OPS);
  if (!m) {
    // chan doan tung lop loi quan sat duoc tren board that
    if (/^[A-Z]{2,5}-T\d/.test(title)) {
      add("ERROR", iss.id, "sub-missing-pw", `Thieu ca P va W: ${JSON.stringify(title.slice(0, 50))}`,
        "<CODE>-P<p>-W<w>-T<n>-<role>");
    } else if (/^[A-Z]{2,5}-W\d/.test(title)) {
      add("ERROR", iss.id, "sub-missing-p", `Thieu P: ${JSON.stringify(title.slice(0, 50))}`,
        "<CODE>-P<p>-W<w>-T<n>-<role>");
    } else {
      const two = title.match(new RegExp(`-(${ROLES.join("|")})-(${ROLES.join("|")})\\b`));
      if (two) {
        add("ERROR", iss.id, "sub-two-roles", `Hai role trong mot ma: ${two[1]} + ${two[2]}`,
          "mot ma mot role — tach thanh hai sub-task");
      } else {
        add("ERROR", iss.id, "sub-title", `Ma sub-task sai dang: ${JSON.stringify(title.slice(0, 60))}`,
          "<CODE>-P<p>-W<w>-T<n>[sfx]-<role>[-<slug>]  <noi dung>");
      }
    }
    return;
  }
  const g = m.groups;

  // Bay: "SG-P3-W1-T2b-ctr-fix" khop duoc vi `fix` bi hieu la slug.
  // Mot ma mang dung mot role, nen slug trung ten role la hai role dinh lien.
  if (g.slug) {
    if (ROLES.includes(g.slug)) {
      add("ERROR", iss.id, "sub-two-roles", `Hai role trong mot ma: ${g.role} + ${g.slug}`,
        "mot ma mot role — tach thanh hai sub-task");
    } else {
      const pre = ROLES.find((r) => g.slug.startsWith(`${r}-`));
      if (pre) {
        add("WARN", iss.id, "sub-two-roles", `Slug bat dau bang ten role "${pre}" sau role "${g.role}" — co phai hai viec?`,
          "doi slug, hoac tach thanh hai sub-task");
      }
    }
  }

  if (reg && !reg.codes.has(g.code)) {
    add("ERROR", iss.id, "sub-code", `CODE "${g.code}" khong co trong registry epic.`,
      "khai vao config.yaml truoc khi dung");
  }
  if (g.body && g.body.length > MAX_BODY) {
    add("WARN", iss.id, "sub-body", `Noi dung ${g.body.length} ky tu > ${MAX_BODY}.`);
  }
  if (g.p !== undefined) {
    const sess = `${g.code}P${g.p}W${g.w}T${g.n}${g.sfx ?? ""}-${g.role}`;
    if (sess.length > 20) {
      add("WARN", iss.id, "sub-session", `Ten session AO se dai ${sess.length} > 20 ky tu (${sess}).`,
        "rut slug, khong rut CODE hay role");
    }
  }
}

/* ---------- kiem nhan ---------- */

const RETIRED = ["spec/ready", "spec/draft", "Improvement", "Bug", "Feature"];

function checkLabels(iss, labels, t) {
  const count = (p) => labels.filter((l) => l.startsWith(p)).length;

  for (const r of RETIRED) {
    if (labels.includes(r)) {
      add("WARN", iss.id, "label-retired", `Nhan da bo nhung van gan: ${r}`, "retire nhan nay");
    }
  }
  if (!t) {
    add("ERROR", iss.id, "level", "Khong co nhan level/* nao.", "level/epic | level/task | level/subtask");
    return;
  }
  const lv = count("level/");
  if (lv > 1) add("ERROR", iss.id, "level", `Co ${lv} nhan level/* — phai dung mot.`);

  if (t === "epic") {
    if (count("gate/") > 0) add("ERROR", iss.id, "epic-gate", "Epic khong duoc mang gate/*.");
    if (count("type/") !== 1) add("WARN", iss.id, "epic-type", `Epic can dung 1 type/* (dang co ${count("type/")}).`);
    if (count("area/") < 1) add("WARN", iss.id, "epic-area", "Epic can it nhat 1 area/*.");
  }

  if (t === "task") {
    const g = count("gate/");
    if (g === 0) {
      add("ERROR", iss.id, "task-gate", "Thieu gate/* — AO se BO QUA task nay.",
        "gate/agent-ready | gate/needs-human | gate/blocked-partner");
    } else if (g > 1) {
      add("ERROR", iss.id, "task-gate", `Co ${g} nhan gate/* — phai dung mot.`);
    }
    if (count("type/") !== 1) add("WARN", iss.id, "task-type", `Can dung 1 type/* (dang co ${count("type/")}).`);
    if (count("area/") < 1) add("WARN", iss.id, "task-area", "Can it nhat 1 area/*.");
    // 13/10/2026: milestone KHONG bat buoc — khong canh bao tung issue nua.
  }

  if (t === "subtask") {
    if (count("gate/") > 0) add("WARN", iss.id, "sub-gate", "Sub-task khong can gate/* — thua huong tu task cha.");
  }
}

/* ---------- chay ---------- */

const reg = loadRegistry(flag("config"));
const issues = loadIssues();

for (const iss of issues) {
  const title = (iss.title ?? "").trim();
  if (!title) {
    add("ERROR", iss.id ?? "?", "title", "Tieu de rong.");
    continue;
  }
  const labels = labelNames(iss);
  const t = tier(labels);

  checkLabels(iss, labels, t);

  // khong co level/* thi doan tang tu hinh dang tieu de de van kiem duoc
  const guessed = t ?? (RE_EPIC.test(title) ? "epic"
    : (RE_SUB.test(title) || RE_SUB_OPS.test(title)) ? "subtask"
    : "task");

  if (guessed === "epic") checkEpic(iss, title);
  else if (guessed === "task") checkTask(iss, title, reg);
  else checkSubtask(iss, title, reg);
}

/* ---------- bao cao ---------- */

const errors = findings.filter((f) => f.level === "ERROR");
const warns = findings.filter((f) => f.level === "WARN");

if (asJson) {
  console.log(JSON.stringify({ checked: issues.length, errors: errors.length, warnings: warns.length, findings }, null, 2));
} else {
  const byRule = new Map();
  for (const f of findings) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, []);
    byRule.get(f.rule).push(f);
  }
  for (const [rule, list] of [...byRule].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n${rule}  (${list.length})`);
    for (const f of list) {
      console.log(`  ${f.level === "ERROR" ? "x" : "!"} ${f.id}  ${f.msg}`);
      if (f.fix) console.log(`      -> ${f.fix}`);
    }
  }
  console.log(`\n${issues.length} issue · ${errors.length} loi · ${warns.length} canh bao`);
}

process.exit(errors.length ? 1 : 0);
