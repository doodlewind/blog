categories: Scribble

tags:

- Web
- JS
- USTC

date:  2016-06-08

toc: true

title: USTC Tennis 积分榜测试上线
---

[USTC Tennis](http://tennis.ewind.us) 是在 Match Recorder 网球计分器基础上开发的 Web App，支持上传每场比赛进程，记录选手生涯累计数据，并参考国际象棋的排名算法实现了选手的积分排名。

<!--more-->

USTC Tennis 除支持 PC 端和移动端浏览器访问外，还为安卓用户提供了打包好静态网页的 APK 安装包。安装后，不仅可节约流量，也可以离线使用计分器。对 iOS 用户，可使用 Safari 打开 USTC Tennis 并将其添加至主屏幕，方便使用。

[安卓 APK 下载地址](http://static.ewind.us/ustcTennis.apk)

对初次使用的用户，以下是一份简单的上手指南。

## 比分记录
作为这个 App 最核心的部分，计分器功能实现了对单盘局数、先发球方、平分制、抢七的支持，并且在赛后可展示双方对局数据。如何使用计分器呢？首先点击右上角的 [Recorder](http://tennis.ewind.us/index.html#/config) 按钮（移动端里按钮被折叠在导航栏里，点击打开即可），输入赛事的基本信息，包括双方选手名、赛名、局数、是否有占先等，界面如下所示

![config](http://7u2gqx.com1.z0.glb.clouddn.com/ustc-tennis-config.png)

然后就是最重要的计分部分了。要想记录一分，必选的内容只有三个：

* 这一分是**一发还是二发**
* 这一分**谁赢**
* 这一分以**哪一种方式结束**（ACE / Winner / UE / FE 四选一）

![scoring](http://7u2gqx.com1.z0.glb.clouddn.com/ustc-tennis-scoring.png)

所以，上图中只要依次点击按钮组，即可完成一分的输入。完成后点击下面的箭头，分数就会按照之前设定好的规则自动更新。如果一发失误，点击一次 **OUT** 按钮就会切换至二发，双发失误时再点击一次 **OUT** 即可。**点击两次 OUT 后再点击一次这个按钮，就会撤销这一分。**

而如果想更完整地输入一分的信息，还可以选择图中最后的两个附加选项：

* 这一分结束的那一拍是正手还是反手
* 这一分是否上网

当比分达到设定的胜利条件时，会弹出提示并切换到比赛详情的显示页面。

![result](http://7u2gqx.com1.z0.glb.clouddn.com/ustc-tennis-result.png)

点击图中的上传按钮，即可将比分及比赛进程上传至服务器。上传完成后，会跳转回显示赛事信息的主页。


## 赛事信息
![feed](http://7u2gqx.com1.z0.glb.clouddn.com/ustc-tennis-feed.png)

上传的赛事以时间顺序排列在主页中，可以点击选手名查看选手信息，也可以点击 More 按钮，查看比赛的详细数据。


## 选手信息
![player](http://7u2gqx.com1.z0.glb.clouddn.com/ustc-tennis-player.png)

选手信息中，记录了选手的比赛的累计数据，暂时还没有添加每位选手所参加的赛事。这里面最醒目的数据之一是选手的积分，它用于为所有选手进行排名。

在导航栏上方的搜索框中输入姓名，即可直接查看这名选手的战绩信息。


## 排行榜
排行榜界面如下所示。可以直接点击选手名，跳转查看选手的个人战绩。

![rank](http://7u2gqx.com1.z0.glb.clouddn.com/ustc-tennis-rank.png)

排行榜的积分排名功能，采用的是《社交网络》里扎克伯格为哈佛女生颜值对对碰的 Facemesh 网站的算法。这一名为 [Elo rating system](https://en.wikipedia.org/wiki/Elo_rating_system) 的算法还用于国际象棋的排名系统。简单来说它的特点是：越弱者胜利能得到越多积分，越强者失败会损失越多积分，从而鼓励大家和强者竞争。

算法的具体参数可以参见 [Github](https://github.com/doodlewind/ustc-tennis-tornado) 上的 Demo 实例，这里列出一些情况下胜负双方的积分变化情况：

* 甲初始 0 分，乙初始 0 分，甲获胜：甲变为 16 分，乙变为 0 分
* 甲初始 500 分，乙初始 500 分，甲获胜：甲变为 516 分，乙变为 500 分
* 甲初始 1000 分，乙初始 10 分，甲获胜：甲变为 1000 分，乙变为 10 分
* 甲初始 1000 分，乙初始 10 分，乙获胜：甲变为 984 分，乙变为 26 分

可以发现，欺负积分相差悬殊的对手，并不能赚取更多积分。而挑战强者或同水平选手，则是上分的好方法。

非常希望各位同学能为 USTC Tennis 站点提出建议和反馈！有任何想说的，都可以直接在这里留言。最后，感谢 xyc 同学的 UI 界面创意，以及 ysb 同学对计分器的详细测试。
