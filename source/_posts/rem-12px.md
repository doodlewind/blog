categories: Note

tags:

- Web
- CSS

date:  2016-10-05

toc: false

title: 解决 REM 单位的跨浏览器问题
---

基于 REM 的布局，可以配合媒体查询，解决页面在不同大小屏幕上等比缩放的问题。这尤其适合处理移动端布局，以及在 PC 端将单一的定宽设计稿适配到不同尺寸屏幕上。

<!--more-->

[原始布局方案](https://snook.ca/archives/html_and_css/font-size-with-rem)非常简单：为 `html` 指定 `font-size` 为 rem 的基准单位，所有以其余元素均以 rem 作为布局单位，从 `html` 继承基准值：

``` css
html {
    font-size: 62.5%; /* 16px * 0.625 = 10px */
}
.foo {
    /* width 和 font-size 单位均继承自 html 根元素 */
    width: 20rem; /* 10px * 20 = 200px */
    font-size: 1.4rem /* 10px * 1.4 = 14px */
}

/* 小屏幕下整体缩放 */
@media (max-width: 600px) {
    html {
        /* 将元素宽高和字体大小均缩放为原来 (62.5%) 的一半 */
        font-size: 31.25%;
    }
}
```

由于 `html` 的 `font-size` 不仅作用于字体大小的单位，还作为 `div` 的宽高单位，因而通过媒体查询更改该属性，即可**直接无损地缩放整个页面**。出于计算的简便考虑，上面的做法直接将 rem 单位设置为 10px，从而可以用 20em 来表示 200px，非常优雅，没错吧？

然而由于中文版的 Chrome 对字体大小的下限限制，小于 12px 的 `font-size` 均会被当做 12px 处理，因此在指定 rem 单位为 10px 时，上面的方式定义的 20rem 在 Chrome 下实际渲染出的宽度是 20 * 12 = 240px 而不是 200px！相应地，Safari 和 Firefox 下并没有这个问题。解决方案很简单，增大根元素 `font-size` 为另一个容易计算的值即可：

``` css
html {
    font-size: 625%; /* 16px * 6.25 = 100px */
}
.foo {
    width: 2rem;
    font-size: 0.14rem
}

@media (max-width: 600px) {
    html {
        font-size: 312.5%;
    }
}
```

只要将 rem 设置为 12px 以上的单位，即可保证跨浏览器时单位换算的一致性。上例中 1rem 默认等于 100px，从而用 2rem 表示 200px，并在小屏幕上缩放至 1rem 等于 50px。考虑到 10px 以下的单位在实际页面中非常少见，因而页面元素大小原则上都可以大于 0.1rem 这个底线，不会出现精确到小数点后三位的诡异布局代码。

对于 IE9，`font` 属性中不能指定 rem，通过 `font-size` 设定即可。
