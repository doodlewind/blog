categories: Note

tags:

- Web
- JS
- Algorithms

date: 2015-03-27

toc: false

title: Markdown 表格编辑器
---

![editor](/images/Markdown表格编辑器1)

在用 Markdown 写《踏实地构建LR分析表》的时候，我深刻地感到了 Markdown 表格语法的坑爹之处——虽然排版出来挺不错，但是源码很难对齐，后面改起来更是难受。于是就有了这个可以让 Markdown 表格源码看起来更好看一点的小页面<!--more-->，希望对常用 Markdown 的同学有点帮助吧。

它的基本功能也就两个：

* 用图形化方式编辑表格，即时生成整洁的 Markdown 代码。
* 贴进 Markdown 格式表格，即时解析到图形界面中。

前者很容易实现，只要遍历一遍 `<table>` 取得每列的最大长度，再补齐空白就行。至于后者其实也就是倒腾 `split()` 的事情。不过由于这段时间编译原理还没有实验，而这个表格的文法又是 LL(1) 的，所以也这里就用了个递归下降的分析器来处理它。
这下妈妈就不用担心填表不工整啦。题图填的表对应的源码是这样：

```
| Canon | Nikon | Sony  | Pentax |
|-------|-------|-------|--------|
| 5D3   | D810  | α7    | 645Z   |
| 70D   | D600  | α7000 | K-01   |
```

生成的表格就是这样的

| Canon | Nikon | Sony  | Pentax |
|-------|-------|-------|--------|
| 5D3   | D810  | α7    | 645Z   |
| 70D   | D600  | α7000 | K-01   |

它的 Repo 在[这里](https://github.com/ewind2009/Markdown-Table-Converter)，可以存下来直接离线使用。希望这个小玩意对你能有一点帮助 :)
