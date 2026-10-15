#!/usr/bin/env bash
set -eu
mkdir -p .wavefront
cat > .wavefront/config.yaml <<'EOF'
version: 1
project:
  name: Demo
  code: DEMO
epics:
  - code: SG
    short: Segment
  - code: RET
    short: Retention
EOF
cat > issues.json <<'EOF'
[
 {"id":"D-1","title":"EPIC · Retention","labels":["level/epic","type/feature","area/query"]},
 {"id":"D-2","title":"SG-P3-W5-T12-docs  Tai lieu khoi 2","labels":["level/subtask"]},
 {"id":"D-3","title":"SG-P3-W1-T2b-ctr-fix  reportSegmentEcho gap","labels":["level/subtask"]},
 {"id":"D-4","title":"LD-W2-T2-fe  Toggle Chart/Table","labels":["level/subtask"]},
 {"id":"D-5","title":"LDC-P1-W1-T1-be  Procedure bucket","labels":["level/subtask"]},
 {"id":"D-6","title":"Retention · ADD — Chart phan phoi user","labels":["level/task","gate/agent-ready","type/change-request","area/frontend"]}
]
EOF
