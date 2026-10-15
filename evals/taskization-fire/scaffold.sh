#!/usr/bin/env bash
set -eu
mkdir -p .wavefront/epics/SG/P3
cat > .wavefront/config.yaml <<'EOF'
version: 1
project:
  name: Demo
  code: DEMO
  language: vi
tracker:
  adapter: file
orchestrator:
  adapter: manual
branches:
  main: main
  integration: dev
surfaces:
  contract: ["packages/validation/**"]
  shared: ["apps/web/src/components/ReportShell.tsx"]
epics:
  - code: SG
    short: Segment
    base: feature/segment-p3
EOF
cat > .wavefront/epics/SG/P3/spec.md <<'EOF'
# SG P3 — State filter dung chung

## Muc tieu
Mot state filter dung chung cho bon bao cao, co ba trang thai va server echo lai ngu nghia.

## Dau vao da co
- packages/validation: schema filter hien tai
- apps/api: 4 route bao cao
- apps/web: ReportShell dung chung

## Phai xay
- Schema state 3 lop trong packages/validation
- Router segmentState put/get, TTL 7 ngay
- Server echo applied/ignored o 4 route
- Chip ba trang thai + badge tren ReportShell
- URL ?state= voi debounce 300ms

## Cong thuc & quy tac nghiep vu
La phang trong state khi co filterGroup tren Churn/Drop -> superseded_by_group.
Mau so rong -> tra "khong ap dung", khong tra 0%.
Bien ngay cat theo timezone project.
Thieu gia tri nghia la khong khop, khong phai 0.

## Tieu chi hoan thanh
- `pnpm test segment-state` xanh, 12/12 case
- Reload trang giu nguyen state, 3 lan lien tiep
- P95 <= 5s tren dataset 10^6 user

## Rang buoc khong duoc vi pham
- KHONG doi schema filter cu dang dung o 4 route
- TTL la 7 ngay tuyet doi, khong gia han

## Ngoai pham vi task nay
Khong lam Retention comparison. Khong lam export CSV.
EOF
