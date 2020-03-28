categories: Note

tags:

- Web

date:  2016-09-15

toc: true

title: HTML 文档生成器 imdoc
---

[imdoc](https://github.com/doodlewind/imdoc) 是一个将 markdown 格式文档转换成 HTML 的简单命令行工具，整合了主题、语法高亮和批处理功能。

<!--more-->

## 安装
将 imdoc 安装到全局即可：
``` text
npm install --global imdoc
```

## 使用
只需将需要转换的 markdown 文件名作为参数传入：
```
imdoc file1.md file2.md...
```

imdoc 会将生成的 HTML 和 CSS 文件放置到相应 markdown 文件路径下的 `doc` 目录中。


## 特色
1. 对前端而言，由于 Markdown 对 HTML 的良好兼容性，它可以便捷地处理夹杂着 HTML/JS/CSS 代码块的 markdown 文件，生成类似 Bootstrap 风格的直观「代码」-「实例」文档。
2. 通过 node.js 的跨平台特性，解决不同平台上 markdown 编辑器输出 HTML 格式不统一的问题。
3. 处理过程极其简单，因而速度飞快。以 [ewind.us](http://ewind.us/) 目前的 86 份 markdown 文件为例，[Hexo](http://hexo.io/) 处理需要 7.41 秒，而 imdoc 只需 0.52 秒（当然了使用场景不同，imdoc 仅生成独立的文档，Hexo 功能要强大得多）。
