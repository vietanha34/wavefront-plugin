#!/usr/bin/env bash
set -eu
# Repo dung wavefront, storage = gdrive, va DA CO mot snapshot trong sources/.
# Connector Drive KHONG co trong sandbox eval — day la chu y: case nay cham THU TU
# thao tac, khong cham connector.
mkdir -p .wavefront/sources/2026-11-01_CTKT-Phase1-v0.3
cat > .wavefront/config.yaml <<'YAML'
version: 1
project:
  name: Demo
  code: DEMO
  language: vi
tracker:
  adapter: file
storage:
  ingest:
    adapter: gdrive
    folder_id: 1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
    export_map:
      application/vnd.google-apps.document: text/markdown
    path: .wavefront/sources/
  publish:
    adapter: gdrive
    folder_id: 1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
    convert: false
    check: true
orchestrator:
  adapter: manual
branches:
  main: main
  integration: dev
epics:
  - code: SG
    short: Segment
YAML
cat > .wavefront/sources/2026-11-01_CTKT-Phase1-v0.3/meta.yaml <<'YAML'
url: https://docs.google.com/document/d/1bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/edit
file_id: 1bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
mime_type: application/vnd.google-apps.document
export_mime_type: text/markdown
etag: MjAyNi0xMS0wMVQwMzoxMjo0NC4wMDBa
fetched_at: 2026-11-01
sha256: 9f2b7c1d4e5a60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef
YAML
cat > .wavefront/sources/2026-11-01_CTKT-Phase1-v0.3/content.md <<'YAML'
\# CTKT Phase 1

Churn rate: mau so rong -> tra "khong ap dung", khong tra 0%.
YAML
