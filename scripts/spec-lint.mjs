#!/usr/bin/env node
/**
 * spec-lint — kiem task spec theo templates/task-spec.md truoc khi cho sang `Todo`.
 *
 * Dung:
 *   node spec-lint.mjs <file.md> [<file.md> …] [--json]
 *   cat spec.md | node spec-lint.mjs
 *
 * Exit 0 = dat. Exit 1 = co ERROR -> KHONG duoc chuyen sang Todo.
 * Khong phu thuoc package ngoai.
 *
 * Phep thu goc (spec-template.md): dua task nay cho mot nguoi la khong biet gi ve
 * du an, ho lam duoc khong? Script kiem phan co the kiem bang may.
 */

import { readFileSync } from "node:fs";

/* Muc bat buoc. `cond` = bat buoc khi co tinh toan. */
const SECTIONS = [
  { key: "muc-tieu",     re: /^##\s*M[uụ]c ti[êe]u/im,                         bb: true },
  { key: "truy-vet",     re: /^##\s*Truy v[êe]t/im,                            bb: false },
  { key: "dau-vao",      re: /^##\s*[ĐD][aầ]u v[àa]o/im,                       bb: true },
  { key: "phai-xay",     re: /^##\s*Ph[aả]i x[âa]y/im,                         bb: true },
  { key: "cong-thuc",    re: /^##\s*C[ôo]ng th[uứ]c/im,                        bb: "cond" },
  { key: "tieu-chi",     re: /^##\s*Ti[êe]u ch[íi] ho[àa]n th[àa]nh/im,        bb: true },
  { key: "rang-buoc",    re: /^##\s*R[àa]ng bu[ộo]c/im,                        bb: true },
  { key: "ngoai-pham-vi",re: /^##\s*Ngo[àa]i ph[aạ]m vi/im,                    bb: true },
  { key: "tai-lieu",     re: /^##\s*T[àa]i li[êệ]u/im,                         bb: false },
];

/* Cum tu khong kiem duoc — spec-template cam ro. */
const BANNED = [
  "hoạt động tốt", "chạy ổn", "hoạt động ổn định", "chạy tốt", "ổn định là được",
  "như mong đợi", "đúng như kỳ vọng", "works well", "works fine", "should work",
];

/* Tham chieu cheo bi cam trong muc Cong thuc. */
const CROSSREF = [
  "xem epic", "theo epic", "tham chiếu epic", "như epic", "xem spec", "theo tài liệu",
  "see epic", "refer to epic",
];

const DIGIT = /\d/;
const FORMULA_HINT = /[=%]|\bCOUNT\b|\bSUM\b|\bDISTINCT\b|\bAVG\b|\bintDiv\b|tỷ lệ|phần trăm|mẫu số|tử số/i;

const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
const files = argv.filter((a) => !a.startsWith("--"));

function sectionBody(text, idx) {
  const starts = SECTIONS.map((s) => {
    const m = s.re.exec(text);
    return m ? m.index : -1;
  });
  const here = starts[idx];
  if (here === -1) return "";
  const after = starts.filter((p) => p > here);
  const end = after.length ? Math.min(...after) : text.length;
  return text.slice(here, end);
}

function lint(name, text) {
  const out = [];
  const add = (level, rule, msg, fix) => out.push({ level, rule, msg, fix });

  // 1. muc bat buoc
  const present = {};
  SECTIONS.forEach((s, i) => {
    present[s.key] = s.re.test(text);
    if (s.bb === true && !present[s.key]) {
      add("ERROR", "missing-bb", `Thieu muc bat buoc: ${s.key}`, "xem templates/task-spec.md");
    }
  });

  // 2. tieu chi hoan thanh phai co so
  const tc = sectionBody(text, SECTIONS.findIndex((s) => s.key === "tieu-chi"));
  if (present["tieu-chi"]) {
    if (!DIGIT.test(tc)) {
      add("ERROR", "acceptance-no-number",
        "Tieu chi hoan thanh khong co con so nao — khong kiem duoc bang lenh hay test.",
        "ghi so cu the: so dong, ty le, nguong thoi gian, so lan chay");
    }
    if (!/`|\$|npm |pnpm |yarn |node |SELECT|curl|docker/i.test(tc)) {
      add("WARN", "acceptance-no-command",
        "Tieu chi hoan thanh khong co lenh nao de kiem.",
        "ghi lenh chay that, vi du `pnpm test <file>`");
    }
  }

  // 3. cum tu khong kiem duoc
  const low = text.toLowerCase();
  for (const b of BANNED) {
    if (low.includes(b)) {
      add("ERROR", "unverifiable-phrase", `Cum tu khong kiem duoc: "${b}"`,
        "thay bang dieu kien co so va co lenh kiem");
    }
  }

  // 4. cong thuc: tu du, khong tham chieu cheo
  const ct = sectionBody(text, SECTIONS.findIndex((s) => s.key === "cong-thuc"));
  const hasCt = present["cong-thuc"];
  const ctEmpty = /kh[ôo]ng [áa]p d[uụ]ng|not applicable|^\s*$/im.test(
    ct.replace(/^##.*$/m, "").trim() || " ",
  );

  if (hasCt && !ctEmpty) {
    for (const c of CROSSREF) {
      if (ct.toLowerCase().includes(c)) {
        add("ERROR", "crossref", `Muc Cong thuc tham chieu ra ngoai task: "${c}"`,
          "chep du cong thuc vao day — task phai tu du");
      }
    }
  }
  // tinh toan lo ra o Tieu chi nhung Cong thuc lai bo trong
  if (FORMULA_HINT.test(tc) && (!hasCt || ctEmpty)) {
    add("WARN", "formula-missing",
      "Tieu chi hoan thanh co dau hieu tinh toan nhung muc Cong thuc trong.",
      "chep cong thuc vao, hoac ghi ro vi sao khong ap dung");
  }

  // 5. Phai xay phai cu the
  if (present["phai-xay"]) {
    const px = sectionBody(text, SECTIONS.findIndex((s) => s.key === "phai-xay"));
    const bullets = (px.match(/^\s*[-*|]/gm) ?? []).length;
    if (bullets < 2) {
      add("WARN", "build-vague",
        `Muc Phai xay chi co ${bullets} dong liet ke.`,
        "ghi ten bang + cot + kieu, hoac method + path + request + response");
    }
  }

  // 6. Ngoai pham vi khong duoc bo trong
  if (present["ngoai-pham-vi"]) {
    const np = sectionBody(text, SECTIONS.findIndex((s) => s.key === "ngoai-pham-vi"))
      .replace(/^##.*$/m, "").trim();
    if (np.length < 10) {
      add("WARN", "out-of-scope-empty",
        "Muc Ngoai pham vi gan nhu trong — AO de lam lo sang task khac.");
    }
  }

  // 7. checklist diem bien: spec co tinh toan nen tra loi truoc
  if (hasCt && !ctEmpty) {
    const edge = [
      [/m[aẫ]u s[ốo] r[ỗo]ng|empty cohort|chia cho 0/i, "mau so rong"],
      [/nhi[eề]u l[aầ]n|m[ộo]t l[aầ]n duy nh[aấ]t|idempot/i, "tinh nhieu lan"],
      [/timezone|m[úu]i gi[ờo]|UTC/i, "mui gio"],
      [/thi[eế]u gi[áa] tr[ịi]|null|kh[ôo]ng kh[ớo]p/i, "thieu gia tri"],
    ];
    const missing = edge.filter(([re]) => !re.test(text)).map(([, n]) => n);
    if (missing.length) {
      add("WARN", "edge-cases",
        `Spec co tinh toan nhung chua noi den: ${missing.join(" · ")}`,
        "xem skills/clarify — checklist diem bien");
    }
  }

  return out;
}

/* ---------- chay ---------- */

const inputs = files.length
  ? files.map((f) => ({ name: f, text: readFileSync(f, "utf8") }))
  : [{ name: "<stdin>", text: readFileSync(0, "utf8") }];

const all = [];
for (const { name, text } of inputs) {
  for (const f of lint(name, text)) all.push({ file: name, ...f });
}

const errors = all.filter((f) => f.level === "ERROR");

if (asJson) {
  console.log(JSON.stringify({ files: inputs.length, errors: errors.length, findings: all }, null, 2));
} else {
  let cur = null;
  for (const f of all) {
    if (f.file !== cur) { console.log(`\n${f.file}`); cur = f.file; }
    console.log(`  ${f.level === "ERROR" ? "x" : "!"} ${f.rule}: ${f.msg}`);
    if (f.fix) console.log(`      -> ${f.fix}`);
  }
  console.log(
    `\n${inputs.length} file · ${errors.length} loi · ${all.length - errors.length} canh bao` +
    (errors.length ? "\nCO LOI -> KHONG duoc chuyen sang Todo." : "\nDat -> duoc chuyen sang Todo."),
  );
}

process.exit(errors.length ? 1 : 0);
