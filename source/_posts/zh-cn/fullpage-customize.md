categories: Note

tags:

- Web
- JS

date:  2016-09-30

toc: true

title: fullPage.js 插件实践
---

[fullPage.js](http://alvarotrigo.com/fullPage) 是一个强大的 JS 整屏滚动插件。但由于其侵入性过强，容易造成一些较为棘手的样式问题。使用过程的经验总结如下

<!--more-->

## 适配定高 footer
页面 footer 通常是固定高度并绝对定位到页面底部的。在普通布局情况下这没有问题。但在添加整屏滚动效果后，若 footer 定位到整屏滚动的最后一屏内部，那么在缩放页面高度至小于 footer 高度时，仍然绝对定位在页面底部的 footer 会遮挡住这一屏的其它元素。

解决方案是，在为 footer 指定高度后，将其作为一个单独的滚动 `section` 并添加 `fp-autoheight` 类名即可。


## 适配小屏幕
在小宽度的屏幕上，fullPage 的官方示例是不显示滚动条，采用响应式 CSS 来缩放元素以避免溢出。然而在一些采用定宽设计的页面上，这种行为难以在页面宽度变小时提供回退方案（无法左右滚动）。

好在 fullPage 的文档中提供了 `responsiveHeight` 和 `responsiveWidth` 两个参数来解决这个问题。在 Viewport 尺寸小于这两个值任意一个时，整屏滚动效果将被禁用（排版样式不变），回退到采用滚动条浏览页面的效果。


## 元素缩放
即便添加了适配小屏幕的 `responsiveHeight` 等属性，由于 fullPage 对排版仍有侵入，因而仍然可能存在 `positioned` 元素与其它元素重叠的情况。

为了解决这一问题，PO 主编写了 [easyScale](https://github.com/doodlewind/easyScale) 这一简单的插件，以实现对定宽元素的动态 zoom 缩放（Firefox 的实现机制有所不同）。

插件示例：

``` js
$.fn.easyScale([
    { el: "#foo", minBound: [0, 0], maxBound: [1300, 500] },
    { el: ".bar", minBound: [0, 0], maxBound: [1000, 500] },
    { el: "#baz", minBound: [600, 400], maxBound: [1000, 500] }
]);
```

插件选项如下：

* `el`: 必填, jQuery 选择器 `string`
* `minBound`: 必填, `[numberX, numberY]` 停止缩放的屏幕尺寸阈值
* `maxBound`: 必填, `[numberX, numberY]` 开始缩放的屏幕尺寸阈值


## 适配 Safari 字体
在 Safari 10 上，启用 fullPage 插件时会使得该页字体全部变细一级…

JS 识别 Safari 并修改相应元素 `font-weight` 属性即可。由于 UA 的混乱，这里采用的浏览器识别代码来自 Stack Overflow，如下所示：

``` js
var isChrome = navigator.userAgent.indexOf('Chrome') > -1;
var isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
var isSafari = navigator.userAgent.indexOf("Safari") > -1;
var isOpera = navigator.userAgent.toLowerCase().indexOf("op") > -1;
if ((isChrome)&&(isSafari)) { isSafari = false; }
if ((isChrome)&&(isOpera)) { isChrom = false; }
```
