#!/usr/bin/env bash
set -eu
mkdir -p .wavefront
cat > spec-draft.md <<'EOF'
## Mục tiêu
Sửa lỗi churn khi cohort rỗng.

## Phải xây
Sửa lại query.

## Tiêu chí hoàn thành
Chạy ổn, không còn lỗi, kết quả đúng như mong đợi.
EOF
cat > .wavefront/config.yaml <<'EOF'
version: 1
project:
  name: Demo
  code: DEMO
  language: vi
tracker:
  adapter: file
fix_policy: same-pr
epics:
  - code: CHN
    short: Churn
EOF
