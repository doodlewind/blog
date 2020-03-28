categories: Note

tags:

- macOS

date:  2016-03-29

toc: false

title: 解决 OS X 上 TeXShop 无法编译的问题
---

在 El Capitan 上，全新安装的 [MacTeX](https://tug.org/mactex) 若出现 TeXShop 按 `cmd-T` 无法编译，提示 `/usr/texbin/pdflatex 不存在` 的报错信息<!--more-->，在 TeXShop 的偏好设置 - 引擎 - 路径设置中，将 (pdf)TeX 一项路径改为 `/Library/TeX/texbin` 即可。
