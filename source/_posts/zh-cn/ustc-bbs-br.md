categories: Note

tags:

- Web
- JS
- USTC

date:  2016-05-18

toc: false

title: 改善瀚海星云 BBS 的排版问题
---

[瀚海星云 BBS](http://bbs.ustc.edu.cn) 由于兼容 telnet 的原因，帖子内容每隔定长会自动换行。<!--more-->具体一点地说，BBS 每条帖子内容所在的 `<div class="post_text">` 容器中，帖子文本每隔定长，就会加入一个 `<br>` 来换行。把这个 `<div>` 的内容提取出来后，排版效果如下图所示。

<!--more-->

![bbs-original-1](http://7u2gqx.com1.z0.glb.clouddn.com/ustc-bbs-1.png)

这种做法在 PC 端 viewport 宽度较大时，虽然可以整齐地断行，但右侧存在一段诡异的空白。而在移动端 viewport 宽度较小时，由 `<br>` 分隔的行会被进一步断行，出现如下图所示的奇葩排版：

![bbs-original-2](http://7u2gqx.com1.z0.glb.clouddn.com/ustc-bbs-2.png)

解决这个问题，关键在于清理冗余的 `<br>` 标签。浏览器中查看源码可以发现，需要改进的帖子主体有如下所示的格式：

``` html
<br>
<br>下面仍然是一本正经的正文：
<br>
<br>春日迟迟，卉木萋萋。仓庚喈喈，采蘩祁祁。在这美好的五月天里，以一颗欣欣向荣的
<br>心，为我的好朋友写一篇征友稿，大概也是我做过最让人期待的事了。说来也巧，我和
<br>我先生也是因为朋友在鹊桥版发的一篇文章而结缘的。如今我们已经相识四年，结婚一
<br>年半，感谢瀚海星云，能够在千万人之中遇见你所要遇见的人是我们的幸运。
<br>&nbsp;
<br>——所以我也希望能够借贵宝地为好友觅得良人，诺，这个见证了我们婚礼的可爱妹子
<br>就是我要介绍的人，她叫响响，是我的大学同学。
<br>
<br>响响89年出生，身高165左右，老家浙江磐安，现在坐标上海，双鱼座，性格慢热。有多
<br>慢呢？比如虽然大一我们就平平淡淡地认识了，可是直到大四才成为极好的朋友……她
<br>是属于静若处子动若疯兔的那种女生，如果跟你不熟绝对是装深沉的一把好手，但是一
<br>旦你说出句符合她奇怪笑点的话，那种磅礴的大笑就怎么也刹不住了。如果有幸和她结
<br>下点交情，那么恭喜你，这是一个绝对不会被时间和距离打败的朋友。
<br>
<br>她有一种倔强的、不张扬的多情。学校的银杏道最后一次落满黄叶的时候，她拉上我一
<br>定要去拍一次纪念照；一起实习过100多天的小伙伴，最后要各奔东西的时候她嘴上不说
<br>什么，但是唱到“我会牢牢记住你的脸，我会珍惜你给的思念”，她会悄悄别过脸去，
```

我们需要在保留每段（存在两个连续换行符）之间空白的前提下，删除段间（前后都是文字）的换行符。可以用 JS 做两次正则替换来实现。

1. 用 `/<br>(\s)+<br>/g` 正则表达式，取出所有中间是空白（用 `\s` 表达式匹配空白）的 `<br>` 并替换成空行 `<div><br></div>` 元素。
2. 用 `/(\s)+<br>/g` 匹配并清理所有左边连着空白的 `<br>` 元素（上一步中替换掉的 `<br>` 由于直接包裹在 `<div>` 里，不会被匹配到）。

完整代码如下：

``` js
window.onload = function() {
    var reKeepBr = /<br>(\s)+<br>/g;
    var reRemoveBr = /(\s)+<br>/g;
    var posts = document.getElementsByClassName("post_text");
    for (var i = 0; i < posts.length; i++) {
        posts[i].innerHTML = posts[i].innerHTML.replace(reKeepBr, '<div><br></div>').replace(reRemoveBr, '');
    }
};
```

使用了该脚本后，宽屏幕下的排版效果如下所示：

![bbs-modified-1](http://7u2gqx.com1.z0.glb.clouddn.com/ustc-bbs-4.png)

段落宽度可以匹配屏幕宽度了。对于大屏幕上段落宽度过大的问题，可以将帖子文本置入响应式的布局的 `<div>` 中，在大屏幕上保持帖子内容以最佳宽度展示，这也更符合 HTML5 将样式与内容分离的理念。而对于移动端的窄屏，这个脚本对排版效果有更好的优化，如下图所示：

![bbs-modified-2](http://7u2gqx.com1.z0.glb.clouddn.com/ustc-bbs-3.png)

这个脚本在添加了对 `<img>` 元素的排版优化功能后，托管在 `ewind.us` 的静态文件服务器上。如果需要，可以直接以如下方式导入：

``` html
<script src="http://ewind.us/h5/bbs-clean-br/clean.js"></script>
```
