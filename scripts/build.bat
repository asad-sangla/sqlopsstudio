@echo off
CALL gulp electron
CALL "scripts\test.bat"
CALL gulp optimize-vscode