# Changelog

## 0.2.1 — 2026-10-15

### Sua — bo eval
Lan chay dau do gan nhu khong do duoc gi, vi bon loi trong chinh bo eval:
- thieu fixture: cac case lam viec tren file khong ton tai -> them `scaffold.sh` + `case.yaml`
  cho ca bon case;
- `allowed_tools` trong frontmatter **khong du** — runner con phai duoc cap `--allow-tools`
  o dong lenh, nen Bash bi giu lai va grader `tool_used: Bash` khong the nao pass;
- `max_turns` qua thap (browser-guard: 4 turn cho 4 lenh shell + bao cao);
- grader `khong-tu-chia` de pass bang cach khong lam gi, nen nhanh KHONG co plugin dat 1.00.

### Ghi nhan
- `skill-fired` bao `Skill called 0x` o 3/3 run co plugin. Hook `SessionStart` tiem duoc
  van ban chi thi nhung van ban khong dam bao mot loi goi tool. Chua ket luan duoc vi fixture
  cung thieu; case `taskization-fire` gio co spec day du de tach hai nguyen nhan.
- `evals/README.md` ghi lenh chay dung kem ly do tung co.

## 0.2.0 — 2026-10-15

### Phat hanh
- `marketplace.json`: plugin tu lam marketplace cho chinh no, nen `claude plugin install`
  chay duoc. Truoc day README huong dan cai o scope user nhung khong co marketplace nao —
  loi chan that, vi phien do harness spawn chi thay plugin khi cai o scope user.
- `LICENSE`, `CHANGELOG.md`.

### Them
- `hooks/`: `SessionStart` tiem chi thi tu `.wavefront/config.yaml` (tu nhan dien repo);
  `PreToolUse` cuong che thu bac cong cu browser.
- `schemas/work-item.schema.json`: envelope chuan cho port tracker. Ba truong mang **hanh vi**
  chu khong chi mang du lieu: `tier`, `state`, `tracker.auto_close_on_pr_merge`.
- Ba skill bu vao khoang trong discovery: `requirements` (R1..Rn co nguon), `surfaces`
  (feature matrix + shared surface + registry epic), `acceptance` (tieu chi co so).
- `skills/surfaces/references/borrow-fallback.md`: ban rut gon cho 5 buoc muon skill ngoai.
- `commands/brief.md`: sinh prompt moi cho orchestrator tu config.
- `evals/`: bo eval cho phan tat dinh.
- `templates/`: `browser-tools.md`, `MANIFEST.yaml`, `epic.md`, `invariants.md`,
  `decisions.md`, `traceability.csv`.
- `docs/DECISIONS.md`: ly do thiet ke dang ADR.

### Doi
- `epic-taskization` **trung tinh harness hoan toan**. Phan rieng AO roi khoi skill ve
  `adapters/orchestrator/ao-runbook.md`. Prompt worker dung placeholder
  `<REPORT COMMAND>` / `<FALLBACK CHANNEL>` do adapter dien.
- `adapters/` chia thanh ba port: `tracker/` `docs/` `orchestrator/`, moi port mot README
  kem bang ho tro.
- Khoa mo guard browser doi tu toan cuc sang **theo phien + TTL 30 phut**. Ban cu lam mot
  worker mo khoa la tat guard cho moi worker, va treo lai neu worker chet truoc khi don.
- Rule 3 va 13 trong `lessons.md` tong quat hoa, vi du cu the tro ve so bat bien cua epic.
- Bo canh bao milestone khoi `name-check` (milestone khong bat buoc).

### Sua
- `name-check.mjs`: bo doc registry dung `\Z` — khong ton tai trong regex JS — nen khoi
  `epics:` khong bao gio doc duoc va luat "CODE phai co trong registry" **khong chay**.
- `name-check.mjs`: `<CODE>-...-ctr-fix` lot qua vi `fix` bi hieu la slug; gio slug trung
  ten role la ERROR.
- `wf-context.sh`: comment cuoi dong YAML lam vo ba truong khi parse.
- README: bo hai link chet tro den tai lieu da xoa.

## 0.1.0 — 2026-10-13
Ban dau: hai command `init`/`add`, ba script kernel, whitepaper, quy chuan dat ten,
cay tai lieu, hop dong port, 19 rules da phan loai.
