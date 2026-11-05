#!/usr/bin/env bash
set -eu
mkdir -p fakebin
printf '#!/bin/sh\nexit 0\n' > fakebin/agent-browser
chmod +x fakebin/agent-browser
# Guard chi chay trong repo dung wavefront — scaffold phai co config, khong thi guard cho qua.
mkdir -p .wavefront
cat > .wavefront/config.yaml <<'EOF'
version: 1
project:
  name: Demo
  code: DEMO
EOF
