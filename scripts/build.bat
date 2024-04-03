@echo off
SET /p v=Version:
cd web
call pnpm run build
cd ..
:: https://github.com/Mmx233/GoReleaseCli
release ./cmd/HeyFileGo --ldflags="-X main.Version=%v%" -c tar.gz
