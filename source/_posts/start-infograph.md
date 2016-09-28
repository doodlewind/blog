categories: Note

tags:

- Visualization
- SQL
- Python

date: 2015-02-09

toc: false

title: 从零开始信息图
---

闲着翻出了去年春节独立统计、分析并绘制的 Infographic，内容是高中母校的毕业信息。

先上效果图~

<!--more-->

如果显示不正常，你也可以直接[访问图片地址](http://7u2gqx.com1.z0.glb.clouddn.com/从零开始信息图0.jpg)。

![final](http://7u2gqx.com1.z0.glb.clouddn.com/从零开始信息图0.jpg)

简述一下过程吧。首先我们要确定需求，想要的图应该有以下几个方面的信息

* 985、211、本一比率的金字塔
* 历年本一率
* 军校统计
* 省内、省外学校人气排行
* 海外统计
* 八年一遇的若干同学条目

开工后，首先得确定每个人的学校都能在数据库中找到，通过一个小 Python 脚本，可以找到所有不匹配的条目。接着就是逐个修改大学地址库中的信息（比如某学院改名为某大学导致无匹配），或者录取数据中的信息（一般是错别字）

![step1](http://7u2gqx.com1.z0.glb.clouddn.com/从零开始信息图1.png)

逐个排除一些坑爹的错别字

![step2](http://7u2gqx.com1.z0.glb.clouddn.com/从零开始信息图2.png)

途中 TextMate 按 option 列选的功能拿来改一些条目很好用

![step3](http://7u2gqx.com1.z0.glb.clouddn.com/从零开始信息图3.png)

最后 diff 一下，还是改了不少东西的（超过 300 lines）

![step4](http://7u2gqx.com1.z0.glb.clouddn.com/从零开始信息图4.png)

再添加一些欧美港澳的学校信息，确保每个人都匹配上就完事。

费了些周折把数据格式化以后，就可以获得『每个省去了多少人』和『每个学校去了多少人』的信息了。
因为 Excel 苦手，还是用到了 MySQL Workbench…每个问题一句 SQL 搞定

![step5](http://7u2gqx.com1.z0.glb.clouddn.com/从零开始信息图5.png)

图中高亮的一行就是获取每个学校总人数的语句，这下就方便作图了~

首先用地图汇的服务生成分色的可视图，把爆丑的默认图表修改一下配色和格式，以满足蓝橙配色的要求。

![step6](http://7u2gqx.com1.z0.glb.clouddn.com/从零开始信息图6.png)

关于省内和省外 Top 10 学校的排名，可以用 [Tagxedo](http://tagxedo.com) 生成，十分简便（这里按照人数比例来决定 Tagxedo 的语料，比如哈工大的重复次数就是中大的约 2 倍）。

![step7](http://7u2gqx.com1.z0.glb.clouddn.com/从零开始信息图7.png)

985 和 211 的统计结果，用金字塔图来做可视化。注意把要用面积比来表达比例关系时，边长比要开个根号。

![step8](http://7u2gqx.com1.z0.glb.clouddn.com/从零开始信息图8.png)

查找军校和医科人数的方式和统计 985、211 比率类似，找到学校名单就可一步到位。

不过有趣的在实现可视化的方式，所谓『100 个小人排队』的效果，通过 Keynote 建立 10×10 表格，分别填充小人背景就可以实现哈，相当有趣呢 :D 至于小人的 logo 出处，就自行 Google 一下 man sign 吧~

![step9](http://7u2gqx.com1.z0.glb.clouddn.com/从零开始信息图9.png)

关于出国的统计，如果把每个国家分开统计，会使得二维柱形图的颜色辨识度过低…最后分了 5 个地区，效果可以接受（切记尽量不要超过 6 个哦）

![step10](http://7u2gqx.com1.z0.glb.clouddn.com/从零开始信息图10.png)

最后长图手工拼接，效果就是开头那样咯
