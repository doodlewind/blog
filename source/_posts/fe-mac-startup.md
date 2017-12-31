categories: Note

tags:

- Web
- macOS

date: 2018-01-01

toc: true

title: 新年新起点：从零配置 Mac 前端环境速查
---

如果新年你准备换台 Mac、重装 Mac 系统或者升级老 Mac 硬盘，这篇文章或许能成为一份不错的 Checklist 哦。

<!--more-->

编写这篇指南的契机是笔者的 Mac 刚刚换了 SSD，又需要重装系统了……上一次换工作的时候也重装过一次，而 Mac 相关工具链的配置每次都比之前显得更加繁琐。因此这里整理出把它配置到面向前端开发者趁手状态的通用性工具的**最小集合**，仅供参考哦。

> 点击下文子项标题可直接定位到相应工具官网。


## 命令行工具
下面几项是必备的命令行工具，甚至可以建议团队强制统一使用。

### [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh)
省心的终端，命令行安装即可：

```
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
```

### [XCode 开发者工具](http://railsapps.github.io/xcode-command-line-tools.html)
在安装 Oh My Zsh 时会自动提示安装，否则无法使用 `git` / `gcc` 等命令。手动安装方式：

```
xcode-select -p
```

Git 能用以后，记得在 `~/.ssh` 里配置好公钥，并用 `git config --global --edit` 配置好你的名字哦。

### [Homebrew](https://brew.sh)
Mac 上流行的包管理器，同样终端安装。安装后终端查看 `brew` 命令即可确认状态。

```
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

### [NVM](https://github.com/creationix/nvm)
非常建议使用 nvm 管理 node 版本，而非直接安装 node.js 官网的 `pkg` 安装包。安装方式：

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
```

### [Node](https://nodejs.org)
安装 NVM 后，`nvm ls-remote` 查看版本，`nvm install xxx` 安装你想要的版本即可。

### [CNPM](https://github.com/cnpm/cnpm)
稳定的国内镜像，安装完成 Node 后，`npm install -g cnpm` 即可。


## GUI 插件
这类插件的共同特点是非常影响 GUI 行为，且平时根本不需要打开。虽然这类插件有很多，但**过多使用此类插件会使得你在使用同事的 Mac 时都非常不习惯**。因此仅列出两个个人评价最高的。下面几个

### [Go2Shell](zipzapmac.com/Go2Shell)
支持从 Finder 一键打开终端，和 `open .` 命令互补起来非常方便。

这个软件安装时很容易抽风，不妨尝试在 Finder 工具栏上右键选择 `图标和文本` 并来回切换来增加安装成功率……

### [Better Touch Tool](https://www.boastr.net/)
它自带了类似 Win7 的窗口左右分屏功能，还可以配置在按下 `ctrl` 时移动鼠标直接缩放当前窗口，**非常非常**适合前端同学调试响应式布局……配置方式：

```
-> Advanced
-> Advanced Settings
-> Window Moving & Resizing
-> 勾选某个快捷键，如 ctrl
-> 关掉其它无用配置，如自动更新、Menubar 图标等
```

## GUI 开发者应用
前端要干活的**最小依赖**只有这么两个：

* Chrome 等浏览器及相关插件（这部分可以单独开一篇文章梳理）。
* VSCode 等编辑器及相关插件（同样足够单独开文章梳理）。

## GUI 日常应用
这类应用非常多，在此只列出笔者个人最常用的若干，以免感觉**装漏了什么**……

* 输入法
* QQ / Wechat / Thunder
* PhotoShop
* Office
* Markdown 编辑器（如 MacDown 或 Typora）
* <del>SS 客户端</del>

## 系统配置定制
这部分内容非常因人而异，笔者个人偏好包括这么几项：

* 启用 Finder 暗色主题
* 开启触摸板的三指拖拽和轻触点击
* 清理 Dock 无用图标，归类 Launchpad 到一页内
* 清理通知中心
* F1 ~ F12 由功能键换成 Fn 键
* 配置 Finder 左侧的快捷入口，并把默认目录改为 `下载`
* 配置终端主题

## Wrap up
还不够多吗？折腾一个全新安装的桌面系统确实需要不少时间精力，并且也没有类似 Docker 这样的高效工具。因此这里只列出尽可能少而直接的内容，希望对大家有所帮助~若有遗漏或补充，欢迎指出哦 😀
