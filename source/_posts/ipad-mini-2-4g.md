categories: Note

tags:

- macOS

date:  2016-05-08

toc: false

title: 免越狱激活 iPad mini 2 的电信 4G 网络
---

iPad mini 2 性价比很高，但由于国内政策原因，iOS 默认没有打开对电信 4G (FDD-LTE) 的支持，只支持电信 3G 网络。好在可以通过 IPCC (iPhone Carrier Bundle) 文件，启用 4G 功能。

<!--more-->

在 iOS 8.x 的 iPad mini 2 (A1490) 上，启用 4G 的方法如下：

1. 终端执行 `defaults write com.apple.iTunes carrier-testing -bool YES` 并重启 iTunes.
2. 下载电信 IPCC 文件。
3. 在 iTunes 里按住 option 键点击恢复，选择刚才的 IPCC 文件并确认。
4. 开闭 iPad 的飞行模式或重启，即可启用 LTE 功能（本地得有信号才行哦）。

iTunes 更新的官方 IPCC 文件存储在 `~/Library/iTunes/iPhone Carrier Support/` 下，可以备份以防万一。
