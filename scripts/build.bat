@echo off
SET /p v=Version:
cd web
call pnpm run build
cd ..
release ./cmd/HeyFileGo --ldflags="-X main.Version=%v%"