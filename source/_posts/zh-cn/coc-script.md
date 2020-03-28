categories: Note

tags:

- Python

date: 2016-02-24

toc: true

title: COC 自动化小脚本
---

[Clash of Clans 自动化 Farm 脚本](https://github.com/doodlewind/sikuli-coc)，基于 [Sikuli](http://sikulix-2014.readthedocs.org/en/latest/)

<!--more-->

## 功能
1. 自动收集玩家村庄采集器资源
2. 自动生产哥布林
3. 自动攻击外置大本营的村庄


## 安装
1. 安装 [BlueStacks](http://www.bluestacks.cn/)
2. 在 BlueStacks 上安装 Clash of Clans
3. 安装 [Sikuli IDE](http://www.sikuli.org/download.html)（依赖 [JDK](http://www.oracle.com/technetwork/java/javase/downloads/index.html)）


## 运行
1. 打开 BlueStacks，将其窗口大致置于屏幕中央。
2. 执行 `main.sikuli` 脚本（OS X 启动方式见备注），等待约 10s 启动后，弹出确认窗口。
3. 等待约 5s 后光标自动点击 BlueStacks 启动器中的 Clash of Clans 图标，登录后开始收集采集器资源，即代表脚本启动成功。


## 退出
1. Windows 下，按 Alt-Shift-C 组合键退出。
2. Mac OS X 下，在终端窗口按 Ctrl-C 退出。


## 效果
脚本实际效果与当前村庄发展水平、奖杯数量有直接关系，数据仅供参考。

在 8 级大本营下使用脚本制造 4 级哥布林，无兵营加速时，每小时平均收入约 20 万左右金钱，5 万左右圣水及 1000 左右暗黑重油。


## 备注
Mac OS X 用户请通过命令行运行 Sikuli 脚本，以避免可能的延迟问题：

打开终端应用，输入如下命令执行，路径请修正为脚本实际所在的路径。

``` text
/Applications/SikuliX.app/run -r /path/to/sikuli-coc/main
```
