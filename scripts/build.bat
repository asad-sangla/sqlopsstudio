@echo off

CALL gulp --max_old_space_size=2000 electron || goto :error
CALL "scripts\test.bat" || goto :error
CALL gulp --max_old_space_size=2000 optimize-vscode || goto :error

:error
echo Failed with error #%errorlevel%
exit /b %errorlevel%