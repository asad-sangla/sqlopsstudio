#!/bin/bash
set -e
gulp electron
./scripts/test.sh
gulp optimize-vscode