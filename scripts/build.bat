@echo off
cd web
pnpm run build
cd ..
release ./cmd/code --os=windows,linux,darwin"