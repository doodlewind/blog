categories: Note

tags:

- Web
- CSS
- JS

date:  2016-07-21

toc: false

title: 实现网页整屏滚动特效
---

Apple 官网的产品介绍页经常出现「整屏滚动」的特效，即每次鼠标滚动时，网页移动一整个屏幕的距离，完整地切换到下一项产品介绍的图文界面。

<!--more-->

有许多 jQuery 的插件可以实现这一效果，但它们的代码都存在一定的冗余等问题。为了学习前端动画基础，这里实现了一个新的 jQuery 插件 [naiveScroll](http://static.ewind.us/naiveScroll) 以实现整屏滚动。目前它虽然还很不完善，需要进一步定制才能整合到实际项目中，但已经有了基本可用的骨架。下面分享一下这一特效的设计思路，以供参考和改进。

首先在参考已有轮子的方面，能够找到最详细的介绍应该是这篇[博客](https://www.smashingmagazine.com/2014/08/how-i-built-the-one-page-scroll-plugin)了。它分析了整屏滚动特效的基本设计思路，并且提供了相应的开源插件。可惜这个插件的代码质量并不算特别好（甚至充斥着缺少标点所导致的全局变量），因此重新造一个小轮子还是有一定意义的。


## HTML 与 CSS
首先补全一个在上面引用的博文中略过的部分，即 CSS 骨架的设计。要实现整屏滚动的效果，首先需要构建的，其实是需要展示的各个「屏幕」。这每一个屏幕，都装在一个独立的 `<section>` 标签中。这些容器 `<section>` 需要满足这些条件：

* 宽度和高度填满当前浏览器 viewport 显示区域。
* 内部填充的图片或背景能够自动拉伸适配整个屏幕。
* 依次从上到下排列。

首先是基本的 HTML 代码段，注意 `<section>` 中是完全空白的：

``` html
<body>
    <section class="page1"></section>
    <section class="page2"></section>
    <section class="page3"></section>
</body>
```

为这些 `<section>` 添加下面的关键样式，即可实现上面的容器需求。

``` css
section {
    width: 100%;
    left: 0;
    height: 100%;
    position: absolute;
}
.page1 {
    top: 0;
    background: url("xxx.jpg") no-repeat center center;
    background-size: cover;
}
.page2 {
    top: 100%;
    background: url("yyy.jpg") no-repeat center center;
    background-size: cover;
}
.page3 {
    top: 200%;
    background: url("zzz.jpg") no-repeat center center;
    background-size: cover;
}
```


## JS
在实现 JS 脚本的过程中，思路是首先实现对单个元素的滚动动画，然后考虑并计算页面的状态（如当前处在第几页，接下来的滚动方向是向上还是向下），最后将代码整合为 jQuery 的插件。

### 实现滚动动画
由于 CSS 的平移动画可以基于 GPU 渲染，比 JS 实现效率要高，因此在这里使用直接定制 CSS 属性的方式，实现滚动效果。下面代码段中的 `percentage` 值为滚动的百分比。如果需要滚动到第一页，那么这个值为零，如果滚动到第二页，那么值为 `-100`，以此类推即可定制出滚动动画效果。

``` js
var percentage = -100;
$("section").css({
    "transform": "translate(0, " + percentage + "%)",
    "transition": "all 1000ms ease"
});
```

### 计算页面状态
实现动画效果后，下一步就是根据页面状态，确定每一次滚动的方向了。这里的实践是给当前 `<section>` 增加 active 的 CSS 属性来确定当前页面位置，在滚动完成后更新这个 `active` 属性所在的状态即可。注意，没有必要新增一个当前处在第几页的计数器全局变量，只要每次用 jQuery 选择器找出 `active` 位置即可。维护根据状态计算出的变量，是很容易出问题的。

``` js
var activeSection = 0;
$("section").each(function(index, element) {
    if ($(element).hasClass('active')) {
        activeSection = index;
    }
});
```

### 避免重复触发事件
理论上，直接监听浏览器的滚轮事件即可实现将特效与鼠标滚动相结合。但实际在浏览器里使用鼠标或触摸板向上或向下滑动时，触发的是一连串小滚动的事件，对每个事件都触发一次滚动效果会造成滚动的重复。

这里采用的简单解决方案，是在响应滚动时记录时间戳，后面的每一个滚动事件，都需要在一定延迟后才能触发。

``` js
// lastAnimationTime is defined before
var timeNow = new Date().getTime();
if (timeNow - lastAnimationTime < 1500) {
    return;
}
```

### jQuery 插件模式
将计算状态的模块和实现动画的模块整合起来，就得到了一个简单的 jQuery 插件。定制自己插件的方法很简单，将自己添加的方法添加到 `$.fn` 上即可。如下所示：

``` js
$.fn._naiveScroll.transformPage = function(direction) {
    var percentage = $(this)._naiveScroll.getPercentage(direction);
    $("section").css({
        "transform": "translate(0, " + percentage + "%)",
        "transition": "all 1000ms ease"
    });
};
```

注意，最好不要直接挂接过多的方法到 jQuery 对象上，这样容易造成和其它第三方插件的冲突。这里的实践是先挂载自己的插件对象 `$.fn._naiveScroll`，然后把插件的其它方法添加到上面。

另外，jQuery 可能和其它的第三方库产生 `$` 符号的冲突，解决方式之一是采用下面的代码将整个插件包裹起来：

``` js
!function($) {
    //...
}(window.jQuery)
```

这个模式会利用 `!` 将函数定义转化为一个立即执行的表达式，并将 jQuery 作为参数传入为 `$` 符号供调用，从而避免潜在的冲突。


## naiveScroll
经过完善添加文档后的滚动插件分享在了[这里](https://github.com/doodlewind/naiveScroll)，欢迎意见和建议，谢谢。
