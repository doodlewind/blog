categories: Note

tags:

- CSS

date:  2016-08-07

toc: true

title: 画画 CSS Emoji
---

这个 [Demo](http://ewind.us/h5/css-emoji) 用了两个 div 画了个简单的 Emoji 表情，下面简单分享一下重点。

<!--more-->

## 定位
表情的每个组件都可以通过绝对定位以精确地按像素定位到背景上。如果有些偏差，可以试试修改 `z-index` 和 `backgroud-color` 来调试。


## 渐变
`linear-gradient` 提供了十分强大的线性渐变支持。通用的语法可以这么写：

``` css
.foo {
    background-image: linear-gradient(180deg, rgba(255, 255, 255, 1) 20%, rgba(0, 0, 0, 0));
}
```

首先声明渐变方向后，依次以逗号分隔来定义渐变的节点，这个节点可以形如 `red 50%` 定义节点所在的百分比，也可以直接写 `rgba(1, 2, 3, 1)` 从而使节点默认处于相邻的两个节点的中间。

而对于环形渐变，可以添加 `radical-gradient` 属性。和线性渐变的语法相似地，环形渐变也是按照 `渐变中心及形状, 颜色位置1, 颜色位置2……` 的形式来定义的。


## 伪类
当想给一个元素添加多个特效，又不想为了这个特效而声明新的 `<div>` 元素的时候，就可以使用 `:before` 和 `:after` 伪类来助攻了。

为一个 DOM 元素添加的 `:before` 和 `:after` 伪类会分别添加到这个 DOM 元素的前后，有着相同的祖先节点。通过为这个伪类添加内容和定位，即可将其作为普通的 DOM 节点来编辑其样式，如下所示。

``` css
.className:before {
    content: " ";
    position: absolute;
    z-index: 100;
    top: 1px;
    left: 1px;
    width: 10px;
    height: 10px;
    background: red;
}
```

## TODO
一定要用 CSS 来画图的话，会发现基础的形状并不难绘制（三角形可以魔改 `border` 来得到，而三角形生万物），而难点在于如何 Hack 出曲线。有一种方式是通过为 CSS 伪类添加 `content` 属性来写文字，再用文字的曲线来模拟真实的曲线。另一种方式则是通过一串 `<div>` 来绘制曲线的各个部分，再巧妙地堆叠它们而得到最后的曲线。对于单色的图片这个技巧很有用，但是当曲线包裹的内容里需要添加渐变时，就很麻烦了。
