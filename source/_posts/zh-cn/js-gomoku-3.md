categories: Note

tags:

- Web
- JS
- CSS

date: 2015-03-16

toc: true

title: 自制五子棋 (3) 包装发布
---

做了些交互的改进后，来试试这个 [Sifu 五子棋](http://ewind.us/h5/gomoku) 吧~

<!--more-->

![Sifu](/images/gomoku/3.jpg)

下面就简要地描述一下发布前的几项改进吧。完整的代码可以看[这里](https://github.com/doodlewind/gomoku)。

## 多线程 Web Worker
虽然 Sifu 已经实现了不少优化，但它的试作性质决定了它的速度不会有多快……而 JS 默认的单线程一跑起来就会阻塞，解决方案就是通过 Worker 实现多线程。

Worker 已经作为现代浏览器的多线程解决方案，在 webkit 内核浏览器中得到了广泛的应用。它通过 Worker 对象导入脚本，实现多线程的执行。它的回调形式 API 十分简洁，给一个简单的示例吧。注意，在 Chrome 中 Worker 是不能用于打开本地脚本的，调试时还是通过 localhost 吧。

主脚本中的代码示例。

``` js
var worker = new Worker("demo.js");
worker.onmessage = function (event) {
    var data = event.data;
    show(data);
};
```

Worker 脚本中的代码示例。

``` js
self.onmessage = function (event) {
    var data = event.data;
    var resp = process(data);
    self.postMessage(resp);
};
```

把之前的 `SIFU` 模块嵌入 Worker 脚本里，这样就能实现计算时的非阻塞啦。

## 自适应布局
要实现适配手机和桌面的自适应布局，这里的实践是对页面的 HTML 和 JS 做了一点儿小改进。

### HTML
为了在手机屏幕上以正确的宽度显示，需要通过 `<meta>` 标签指定显示模式，也就是以下的这几行。

``` html
<head>
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
    <meta name="apple-mobile-web-app-capable" content="yes"/>
</head>
```

### JS
棋盘的尺寸可以在页面载入完成时动态指定，这样就能够绕过 Media Query 的级联样式表，实现对不同页宽的自动匹配了。

``` js
window.onload = function () {
    alert(window.innerWidth);
}
```

## 静态 Modal 提示
在 Sifu 思考的时候，可以用 Modal 效果让页面变暗，显示一个模态框来提示状态。这个模态框的实现方式很简单，纯粹的 HTML + CSS 就行。

### HTML
Modal 其实就是一个特殊的 `<div>` 啦，没有对应 CSS 的话会显示在页面上。

``` html
<div id="modal" class="modalDialog">
    <div>
        <!--close tag-->
        <a id="close" href="#close" title="Close" class="close">Retry</a>
        <h1>He is Sifu!</h1>
    </div>
</div>
```

### CSS
为 Modal 匹配 CSS 后，就能直接使用 Modal 啦。

``` css
.modalDialog {
    position: fixed;
    font-family: serif;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99999;
    opacity:0;
    -webkit-transition: opacity 400ms ease-in;
    -moz-transition: opacity 400ms ease-in;
    transition: opacity 400ms ease-in;
    pointer-events: none;
}
.modalDialog:target {
    opacity:1;
    pointer-events: auto;
}
.modalDialog > div {
    padding: 20px;
    width: 250px;
    position: relative;
    margin: 20% auto;
    background: rgba(185, 216, 204, 0.5);
    border: 2px #fff solid;
    color: #ffffff;
}
.close {
    background: #606061;
    color: #FFFFFF;
    line-height: 25px;
    position: absolute;
    right: -12px;
    text-align: center;
    top: -10px;
    width: 50px;
    text-decoration: none;
    font-weight: bold;
}
```

### JS
最后，通过 JS 动态调用 Modal 的方式（其实就是设定 HTML Hash 啦）也很简单，只要一句就行。

``` js
window.location.hash = 'modal';
```

是不是有点容易得过分了？好吧，最后再安利一把，想虐 AI 找自信，[Sifu](http://ewind.us/h5/gomoku) 欢迎你！
