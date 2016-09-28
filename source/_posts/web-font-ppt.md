categories: Scribble

tags:

- Web
- Visualization

date: 2015-04-08

toc: false

title: 用 Web 矢量图标提升 PPT 配图逼格
---

![penguin](http://7u2gqx.com1.z0.glb.clouddn.com/用Web矢量图标提升PPT配图逼格7.jpg)

各种「PPT 设计指南」鼓吹的内容核心，其实就是一件事：要简洁！于是各种样例里，遍地都是苹果/小米官网产品介绍页风格的「一句话文案 + 照片」组合。

这种风格的视觉效果固然是极好的，不过实践中要是处在明天 Deadline 今晚要通宵赶 PPT 的状态时，它的问题就会体现出来<!--more-->：图可不好找啊！指南中构图精美调色恰当的配图，和自己 Google 来的这些带着水印又经过不知道多少次压缩的的差别，效果区别基本接近淘宝的「卖家秀」和「买家秀」了。要快速找到合适又美观的配图也不是不可以，不过那就需要 [Shutterstock](http://shutterstock.com) 甚至 [500px](https://500px.com) 一类的付费服务了……有没有美观、开源且高效的 Silver Bullet 呢？

来试试**矢量图标**吧？比如 [FontAwesome](http://fortawesome.github.io/Font-Awesome/) 就是一个这样的好东西。矢量图标的好处至少有这么几条：要说美观，它任意放大都无码，底色透明不需要抠图，还不存在色调问题，几乎通吃所有模板；说开源，它一般采用的 CC 协议也十分宽松；说高效，下面就来安利一下要导入它有多容易……

<!--more-->

虽然它是为 Web 而生的，但要把它导入到 PPT 中，只需要这样：

1. 在 [Github 主页](http://fortawesome.github.io/Font-Awesome/)下载它的 zip 压缩包。
2. 解压，安装 font 目录中的 TTF 格式字体（Windows 下复制到 C:\Windows\Font 中，OS X 直接打开字体文件）。

在赶 PPT 的时候，要实际使用它，也非常的容易：

1. 在 [FontAwesome Cheeatsheet](http://fortawesome.github.io/Font-Awesome/cheatsheet/) 中找到自己需要的图标，选中复制。
2. 在 Keynote / PowerPoint 中新建一个*文本框*，选择 FontAwesome 字体，直接粘贴入需要的矢量图标。

多说一句，一般嵌入 FontAwesome 的网页里，通过 `<span>` 标签嵌入的图标，是不能选中复制的，所以相应的图标对应的文字编码还是需要通过 Cheatsheet 页来找。不过直接在 Cheatsheet 中搜索关键词的效率，甚至可以比 Google 还要高一点，这实在是生产力和审（bi）美（ge）的大飞跃啊。

以下是几个示例，可以看出矢量图标对深浅色模板的兼容性都不错，最多简单地改一下阴影和透明度就行，比修图时各种拖滑块要方便多了。

![Github](http://7u2gqx.com1.z0.glb.clouddn.com/用Web矢量图标提升PPT配图逼格4.jpg)

![Taxi](http://7u2gqx.com1.z0.glb.clouddn.com/用Web矢量图标提升PPT配图逼格5.jpg)

![Earth](http://7u2gqx.com1.z0.glb.clouddn.com/用Web矢量图标提升PPT配图逼格2.jpg)

![](http://7u2gqx.com1.z0.glb.clouddn.com/用Web矢量图标提升PPT配图逼格6.jpg)

除了 FontAwesome，还有 [Glyphicons](http://glyphicons.com/) 一类的图标也可以免费使用。如果有其它更好更便捷的解决方案，也请告知，谢啦
