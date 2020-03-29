categories: Note

tags:

- macOS

date: 2014-05-31

toc: true

title: Mac 快捷键总结
---

> Mac 狗对部分快捷操作的总结。

<!--more-->

## Finder
* `cmd + C / V / A / H / M/ tab / space` 不解释…
* `cmd + option + V` 剪切
* 按住 `cmd` 拖动『叠在下面』的窗口，不会改变窗口的叠放顺序
* `cmd + option + 1` 整理桌面！
* `cmd+ option + H` 隐藏当前窗口外的所有其它窗口
* `cmd + option + D` 显示 / 隐藏 Dock
* `shift + cmd + G` 直接输入目录名访问目录
* `cmd + T` 建立新标签页。要快速切换标签页，使用
	* `ctrl + tab` 或 `ctrl + shift + tab`
	* `cmd + shift + [` 或 `cmd + shift + ]`
	* Safari 中同样可以使用这两个快捷键
* `shift + cmd + O` 打开『文稿』目录
* 更改某格式的默认打开方式：
	1. 选中此文件，`cmd + I`
	2. 选择『打开方式』
* 查看多个文件的全部信息：多选后 `cmd + option + I`

## TextMate
* `cmd + R` 不解释
* `cmd + 数字` 切换到第 x 个标签页，0 为上一个标签页
* `esc` 自动补全（变量名、函数名…balabala）
* `cmd + [` 或 `cmd + ]` 改变缩进量
* `cmd + option + ctrl + D` 显示 / 隐藏文件侧边栏
* `cmd + ctrl + R` 侧边栏跳转到当前文件所在目录
* `cmd + L` 访问行
* `option + 方向键`
	* 配合左右键：按词移动光标
	* 配合上下键：按相同缩进行移动光标
* `cmd + shift + return` 自动在当前行尾添加分号，并跳到下一行（对 c++ 和 php 党有特效）
* `cmd + shift + T` 列出当前文件 symbol（例如 php 的函数头和html的标签ID），方便跳转
* combo 技能 1：
	* 选定一部分文本，可以使用：
		1. `option + shift + 方向键`
		2. `cmd + shift + L`
	* `cmd + ctrl + 方向键` 移动选定部分（这也行？）
* combo 技能 2：
	1. `cmd + option + F` 找出所有文字（配合 `cmd + F`）
	2. 按左右方向键，召唤光标分身术…好吧正则已死
* combo 技能 3：
	1. 按住 option 拖动光标（诶好像有点不一样？）
	2. 按左右方向键，召唤光标分身术 II…好吧 csv 哭了
* `cmd + F2` 为当前行添加书签，`F2` 和 `shift + F2` 在书签中跳转
* 在 Menu 的 `Bundles` 中寻找其它福利吧

## Terminal
* alias 的配置文件在

``` text
nano ~/.bashprofile
# 打开后添加以下格式的行，保存后重启Terminal即可 

alias cdcpp='cd ~/code/cpp'
```

* Terminal 君不光会打字，还会说话

``` text
say hello
```

* 设定 Finder Dock 中仅显示正在运行的程序（像 Windows 的底部任务栏）

``` text
defaults write com.apple.dock static-only -boolean yes

# 想关闭这个功能，只需要
defaults write com.apple.dock static-only -boolean false
```
