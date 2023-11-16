@echo off
cd web
call pnpm run build
cd ..
release ./cmd/HeyFileGo --os="windows,linux,darwin"