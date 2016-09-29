categories: Note

tags:

- Web
- JS

date:  2016-09-30

toc: true

title: jQuery 轮播插件 easyLoop 发布
---

easyLoop 是一个简洁而易用的 jQuery 轮播插件，支持双向、嵌套、多元素同屏轮播，压缩后大小仅 1.9k，且具有丰富的定制选项。

<!--more-->

## 示例
可直接访问 [easyLoop Demo](http://ewind.us/platform/doc/easy-loop.html) 以查看效果，该示例由 [imdoc](http://github.com/doodlewind/imdoc) 工具生成。

## 原理
在示例链接最后的调试模式中，可以直观地看到轮播的实现机制：添加一个遮罩层，将首部元素复制到尾部、尾部元素复制到首部。在轮播元素序列向左或向右移动到头时，动画播放完成后调整偏移量，使得元素重新归位到初始状态，从而模拟出循环的效果。

在同屏需要展示 n 个元素的时候，就需要分别把首部的 n 个元素复制到尾部，尾部的 n 个元素复制到首部。

在 CSS 样式的实现上，可以采用 `inline-block` 来减少浮动的一些样式问题，通过是否添加 `whitespace: nowrap` 属性来控制元素的横向和纵向排列。
