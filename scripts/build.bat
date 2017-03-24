@echo off
CALL gulp --max_old_space_size=2000 electron
CALL "scripts\test.bat"
CALL gulp --max_old_space_size=2000 optimize-vscode