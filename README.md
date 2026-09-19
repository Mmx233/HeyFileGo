# HeyFileGo

[![License](https://img.shields.io/github/license/Mmx233/HeyFileGo)](https://github.com/Mmx233/HeyFileGo/blob/main/LICENSE)
[![Release](https://img.shields.io/github/v/release/Mmx233/HeyFileGo?color=blueviolet&include_prereleases)](https://github.com/Mmx233/HeyFileGo/releases)
[![Dockerhub](https://img.shields.io/docker/pulls/mmx233/hey-file-go)](https://hub.docker.com/r/mmx233/hey-file-go/tags)

# Usage

## Serve File/Folder

Drag and drop a file or folder onto the program, or use the command line:

```shell
./HeyFileGo ./path_to_file_want_to_serve
```

## Receive Files

Simply start the program

Uploads start when files are selected. The server accepts up to three uploads at
once across all clients; additional uploads wait for a slot. Set
`--upload-concurrency` to change that limit. The web page supports cancellation,
retry, and clearing completed transfers.

# Notes

+ The file receiving URL opens a web page for uploading files, which will be saved in the program's working directory
+ Multiple instances can run simultaneously without conflicts

# Flags

| Flag                 | Value   | Description                                                              |
|----------------------|---------|--------------------------------------------------------------------------|
| -p / --port          | uint16  | Specify port                                                             |
| -s / --ssl           | -       | Use HTTPS with auto-generated certificate                                |
| --bind               | IP      | Listen on a specific IP address (default: all interfaces)                |
| --upload-concurrency | integer | Maximum simultaneous uploads across all clients (default: 3, minimum: 1) |
