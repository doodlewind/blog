categories: Note

tags:

- Web
- CSS
- JS

date: 2015-03-15

toc: true

title: 自制五子棋 (1) 棋盘绘制
---

这篇和接下来的几篇文章，将会描述如何从零开始，不依赖于特定的框架和库，搭出一个棋力靠谱，并且适配手机和桌面浏览器的迷你五子棋应用页面来。

<!--more-->

接下来我们首先从前端入手，关注一下怎样在浏览器里从一片空白的页面开始，画出一个棋盘来。这一步完成后，效果就会像下面这样（嗯对，现在暂时不关心 AI 算法，只关心棋盘最基础的外观布局）：

![Goban](/images/gomoku/1.jpg)

## 生成棋盘
要想生成一个棋盘外观的页面，最自然的方法肯定是通过一个 <table> 表格，把棋盘之间的网格用表格的边框表示出来。这么做肯定也不是不行，但是这么做会有个比较麻烦的问题：五子棋不像国际象棋那样把棋子放在网格里，而是放在框线上。这样一来棋子就不能放在表格内，需要一些 CSS Trick 来设置偏移量。

所以在这里我选了一种比较罕见的解决方式：在嵌套的 <div> 里用 CSS 画十字，从而拼凑成一个完整的棋盘。

而要用 CSS 绘制十字，最简便的方式则是为每个 <div> 生成一个包括横向和纵向的渐变。以一个 2x2 的棋盘为例，相应的 HTML 和 CSS 代码如下。注意，要为每行 <div class="row"> 的行元素清除浮动，这样才能排列成一个完整的棋盘。

### HTML

``` html
<div id="goban">
    <div class="row r-0">
        <div class="col c-0"></div>
        <div class="col c-1"></div>
    </div>
    <div class="row r-1">
        <div class="col c-0"></div>
        <div class="col c-1"></div>
    </div>
</div>
```

### CSS

``` css
#goban {
    padding-top: 40px;
    width: 600px;
    margin: auto;
}
.row {
    clear: both;
}
.col {
    display: table;
    float: left;
    margin: 0;
    width: 40px;
    height: 40px;
    background:
    linear-gradient(to bottom, transparent 48%,
            #4c4c4c 48%,
            #4c4c4c 52%,
            transparent 52%),
    linear-gradient(to right, transparent 48%,
            #4c4c4c 48%,
            #4c4c4c 52%,
            transparent 52%);
}
```

## 放置棋子
放置棋子是个和 Web 页面交互的过程，需要通过 JavaScript 来实现。这里基本的思路是为每个 `<div>` 注册 `click` 事件的监听器，在接受到点击事件时，在 `<div>` 里放个棋子。而棋子的实现就比较作弊了：放一个圆形的 Unicode 字符进去就行，哈哈

### JS

``` js
function set(row, col, color) {
    // get row element
    var r = document.getElementsByClassName('row r-' + row);
    
    // get col element
    var square = r[0].children[col];
    
    // set text
    square.innerHTML = "<span class='" + color + "'>●</span>";
}
```

不过，这么放进去的棋子会有点问题：它没法对齐到格子上！好在通过 CSS，可以方便地设定对齐的方式。注意下面示例里对 `display` 方式的设定。只有设定了 `table-cell` 后，竖直方向的对齐才会生效。

### CSS

``` css
.col {
    display: table;
}
.black {
    display: table-cell;
    text-align: center;
    vertical-align: middle;
    font-size: 2em;
}
```

嗯，以上就是画棋盘过程中的一些注意事项啦。而画好了棋盘之后，下一步就是下棋啦。接下来需要做的就是制造一个 AI 来与你对弈啦~
