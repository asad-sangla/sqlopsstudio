#!/bin/bash
set -e
gulp electron || { echo 'gulp electron failed' ; exit 1; }
./scripts/test.sh || { echo 'Tests failed' ; exit 1; }
gulp optimize-vscode || { echo 'gulp optimize vscode failed' ; exit 1; }