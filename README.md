# HeyFileGo

[![License](https://img.shields.io/github/license/Mmx233/HeyFileGo)](https://github.com/Mmx233/HeyFileGo/blob/main/LICENSE)
[![Release](https://img.shields.io/github/v/release/Mmx233/HeyFileGo?color=blueviolet&include_prereleases)](https://github.com/Mmx233/HeyFileGo/releases)
[![Dockerhub](https://img.shields.io/docker/pulls/mmx233/hey-file-go)](https://hub.docker.com/r/mmx233/hey-file-go/tags)

## :package: Install

### Scoop

```powershell
scoop bucket add mmx233 https://github.com/Mmx233/ScoopBucket
scoop install mmx233/hey
```

### Homebrew

```shell
brew install mmx233/tap/heyfile-go
```

### Docker

Run the image with the current directory mounted for receiving or serving files:

```shell
docker run --rm -it -p 8080:8080 -v "${PWD}:/data" -w /data mmx233/hey-file-go:latest --port 8080
```

### From Binary

Download the archive for your OS and architecture from the
[latest release](https://github.com/Mmx233/HeyFileGo/releases/latest).
Extract it and place `hey` (`hey.exe` on Windows) in a directory on your `PATH`.

## :computer: Usage

### Serve File/Folder

Drag and drop a file or folder onto the program, or use the command line:

```shell
hey ./path_to_file_want_to_serve
```

### Receive Files

Simply start the program

Uploads start when files are selected. The server accepts up to three uploads at
once across all clients; additional uploads wait for a slot. Set
`--upload-concurrency` to change that limit. The web page supports cancellation,
retry, and clearing completed transfers.

## :memo: Notes

+ The file receiving URL opens a web page for uploading files, which will be saved in the program's working directory
+ Multiple instances can run simultaneously without conflicts

## :gear: Flags

| Flag                 | Value   | Description                                                              |
|----------------------|---------|--------------------------------------------------------------------------|
| -p / --port          | uint16  | Specify port                                                             |
| -s / --ssl           | -       | Use HTTPS with auto-generated certificate                                |
| --bind               | IP      | Listen on a specific IP address (default: all interfaces)                |
| --upload-concurrency | integer | Maximum simultaneous uploads across all clients (default: 3, minimum: 1) |
