categories: Note

tags:

- Linux
- macOS

date: 2014-04-15

toc: false

title: ssh 连接 Freeshell 小记
---

正在筹备一两个希望能开发并部署在 ustc 域名下的站点，不得不赞一下 Freeshell 虚拟机，十分强大！

<!--more-->

首先在这里申请 Freeshell 的帐号，注意 Node 选择 Default，否则会造成一个强制 Restart 都无法解决的 “cannot connect to worker node” 问题，囧。

邮件激活，节点正常运行后，在 Freeshell 的 Control Panel 内有连接的 ssh 地址，但是我在西图接入时，有时无法使用 ipv6 建立 ssh 连接（wiki 发现 OS X 10.7 后版本有不定时出现 ipv4 is preferred 的情况）。 默认情况下，Freeshell 通过 OpenVZ 安装了 minimum 的 Debian，连 sudo 都没有耶你敢信…不过 apt-get 命令直接从科大源下载包，速度奇快无比。自己申请这个 Freeshell，其实只是为作 LAMP 服务器之用，必然需要在本机调试网页，所以 firefox 显然是必须的嘛！通过 OS X 终端开普通的 ssh 连接，会报错 Error: no display specified

解决方式是安装 OS X 的 X11。

![X11](http://7u2gqx.com1.z0.glb.clouddn.com/ssh连接Freeshell小记0.png)

打开 X11，重新输入 ssh 命令，不过要加上 -X 参数（对 ipv4 连接，在 -p 前加上 -X）建立连接后

``` text
# firefox
```

试试？开心吗？（要是你试了装 xorg+lxde 却发现不能 startx，Google 发现 Stack Overflow 里说 OpenVZ 不支持 window manager，估计在看到 firefox 的时候也会小小的感动一下吧…）如果有问题，这里可以作 Freeshell 上跑 X 的参考（求别喷 gui，我真的只需要 gui 的浏览器而已……） 不过说起来自己实在是太小白了，为什么不需要 xorg，也能正常运行 x-client？求教求轻拍……
