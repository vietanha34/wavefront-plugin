#!/usr/bin/env bash
set -eu
# Phase da co spec duyet, design.adapter = claude-artifact, nhung THU MUC design/ TRONG.
# Artifact tool khong co trong sandbox eval — case nay cham THU TU thao tac.
mkdir -p .wavefront/epics/SG/P3/design
cat > .wavefront/config.yaml <<'YAML'
version: 1
project:
  name: Demo
  code: DEMO
  language: vi
tracker:
  adapter: file
design:
  adapter: claude-artifact
  system:
    artifact: https://claude.ai/artifact/AAAAAAAAAAAAAAAAAAAAAA
    path: .wavefront/design/system/
  canvas:
    unit: phase
    path: .wavefront/epics/<CODE>/P<n>/design/
  publish:
    folder: 03_Thiet-ke/
    check: true
orchestrator:
  adapter: manual
branches:
  main: main
  integration: dev
epics:
  - code: SG
    short: Segment
    base: feature/segment-p3
YAML
cat > .wavefront/epics/SG/P3/spec.md <<'YAML'
# SG P3 — Level management screen

## Muc tieu
Mot screen quan ly level, bon trang thai: empty, loading, 3-level, error.

## Dau vao da co
- Canvas da duyet: https://claude.ai/artifact/BBBBBBBBBBBBBBBBBBBBBB (artboard LevelManagement)
- apps/web: ReportShell dung chung

## Phai xay
- Screen LevelManagement theo canvas
- Bon trang thai tren

## Tieu chi hoan thanh
- `pnpm test level-mgmt` xanh
- Bon trang thai khop canvas

## Rang buoc khong duoc vi pham
- KHONG doi ReportShell

## Ngoai pham vi task nay
Khong lam export CSV.
YAML
