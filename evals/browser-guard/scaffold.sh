#!/usr/bin/env bash
set -eu
mkdir -p fakebin
printf '#!/bin/sh\nexit 0\n' > fakebin/agent-browser
chmod +x fakebin/agent-browser
