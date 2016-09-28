categories: Note

tags:

- macOS

date:  2016-07-23

toc: false

title: 为 OS X 的终端应用配置代理
---

各种科学上网工具一般都会在本地 1080 或 8080 端口打开一个代理服务器，一般的浏览器环境下有插件来完成切换代理的任务。而对于命令行下 `npm` 或 `brew` 等包管理工具，为它们指定代理的方式如下<!--more-->：

首先，获取本机的各网络服务名。

``` text
networksetup -listnetworkserviceorder
```

这里会列出 OS X 下可用的网络服务列表，如 Wi-Fi 或 iPad USB 等。接下来为这个服务指定代理即可。

``` text
networksetup -setsocksfirewallproxy "Wi-Fi" localhost 1080
```

不需要时，也可以关闭该代理。

``` text
networksetup -setsocksfirewallproxystate "Wi-Fi" off
```
