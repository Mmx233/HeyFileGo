@echo off
cd web
call pnpm run build
cd ..
release ./cmd/HeyFileGo