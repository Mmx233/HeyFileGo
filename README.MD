# HeyFileGo

[![Lisense](https://img.shields.io/github/license/Mmx233/HeyFileGo)](https://github.com/Mmx233/HeyFileGo/blob/main/LICENSE)
[![Release](https://img.shields.io/github/v/release/Mmx233/HeyFileGo?color=blueviolet&include_prereleases)](https://github.com/Mmx233/HeyFileGo/releases)
[![GoReport](https://goreportcard.com/badge/github.com/Mmx233/HeyFileGo)](https://goreportcard.com/report/github.com/Mmx233/HeyFileGo)

# 使用

## 文件上载

直接将文件拖拽到程序上，或者使用命令行：

```shell
./HeyFileGo ./path_to_file_want_to_serve
```

## 文件传入

直接启动程序即可

# 说明

+ 启动后选择网卡只是用于打印二维码和 URL
+ 文件传入的 URL 打开后是一个上传文件的网页，文件会保存在执行程序的文件夹
+ 可以同时启动多个实例，不会相互冲突

# Flags

| flag        | 值     | 说明                 |
|-------------|-------|--------------------|
| -p / --port | uin16 | 指定端口               |
| -s / --ssl  | -     | 使用 https，证书由程序自动生成 |