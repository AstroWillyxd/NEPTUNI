@echo off
setlocal
title NEPTUNI - Servidor local
cd /d "%~dp0"
set "NEPTUNI_NODE="
if exist "%ProgramFiles%\nodejs\node.exe" set "NEPTUNI_NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NEPTUNI_NODE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NEPTUNI_NODE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NEPTUNI_NODE (
  for /f "delims=" %%I in ('where node.exe 2^>nul') do if not defined NEPTUNI_NODE set "NEPTUNI_NODE=%%I"
)
if not defined NEPTUNI_NODE (
  echo No se encontro Node.js. Este paquete necesita Node.js 18 o posterior.
  echo Descargalo en https://nodejs.org/ y vuelve a abrir este archivo.
  echo Consulta README.md para mas instrucciones.
  pause
  exit /b 1
)
"%NEPTUNI_NODE%" "%~dp0servidor-local.mjs"
if errorlevel 1 pause
