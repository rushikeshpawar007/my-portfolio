@echo off
REM Hook runner for Windows
REM Usage: run-hook.cmd <hook-name>

set PLUGIN_ROOT=%~dp0..
set HOOK=%1

if "%HOOK%"=="session-start" (
    bash "%~dp0session-start"
)
