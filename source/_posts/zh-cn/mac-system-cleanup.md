categories: Scribble

tags:

- macOS

date: 2014-07-04

toc: false

title: 记一次愉 (keng) 快 (die) 的系统清理
---

![demo](/images/mac-system-cleanup/0.jpg)

> 起因是这样的，老夫的 MacBook Air 在蹦跶快一年了之际，128G 的 SSD 占用已经突破 60% 了……

<!--more-->

![demo](/images/mac-system-cleanup/1.jpg)

注意绿色部分…对一个没装游戏的死宅，除了 Xcode 那个吃 4G 硬盘的怪兽，其它所有应用几乎都不超过 200M 好吗？！ 实在想不通是何方神圣的应用把捉急的 SSD 抢光了…妈蛋过了一年终于还是逃不掉清理电脑啊…

等等，老夫刚买了 Apple Care…本着能不折腾就不折腾的原则，先来个电话支持试试：


> 我：为什么系统信息里的应用容量比 Applications 文件夹大了那么多哇 balabala…
> 客服：稍等我看看…
> （几分钟后）
> 客服：您好，我的电脑也是这样！

………end

简直不能愉快的玩耍啊…好吧都听说果粉素质高，那就上传说中的 Support Community 问问？

[于是就出现了这个链接](https://discussions.apple.com/thread/6431173)

（没人理我…）

尼玛谁让上了大学以后英语拙计呢……社区果粉真高冷……

那就动用搜索引擎吧…什么 usage 啊 clean 啊 capacity 啊 mac 啊能想到的关键词都来吖排列组合一遍…于是发现了几个可以显示磁盘占用的应用（以下排列按时间顺序）：

### OmniDiskSweeper
![step1](/images/mac-system-cleanup/3.jpg)

看着数字方便不？有数字放心不？告诉你这货还真是糊弄我啊…把列表里所有东西加起来的体积比 System Info 的体积差了至少 10G！妈蛋这玩意不靠谱哇…不过好歹用它找到了几个上 G 的 iPhone 备份，删之

### GrandPerspective
![step2](/images/mac-system-cleanup/4.jpg)

哇塞可视化高端大气有木有！可是这玩意和 Omni 一个德性，显示出来的文件列表不完整哇…布吉岛那神秘的 10G 在哪里… 当然了有了这么漂亮的工具，人家怎么可能没有收获呢？哼删了 3G 的 LaTex 残留和 1G 的 Xcode 文档我会乱说吗

### Onyx
![step3](/images/mac-system-cleanup/5.jpg)

我就不打开这货截图了…每次打开都会扫描一遍主分区…虽然这玩意没起到什么作用，但是它需要管理员权限的这一点，不就是在暗示某些坑爹文件没有提权是看不到的嘛！于是果断搜终端命令，发现了个简单粗暴的命令行

``` text
sudo du -h -d1
```

![step4](/images/mac-system-cleanup/6.jpg)

哎这下好像很方便了哇 >_< 然后搜索发现好像就算 sudo du 得到的体积还是和系统显示的有出入…何弃疗

干脆修复磁盘试试…重启按住 cmd + R 进恢复模式，选磁盘工具来个修复…嗯大概是这样，别问我为什么没截图，你吖 Windows 蓝屏的时候你给我来个扣扣截图试试！

![step5](/images/mac-system-cleanup/9.jpg)

然后一切如故…妈蛋继续 Google 的结果一般说的是 Time Machine 本地备份可能莫名其妙占空间…真心没有帮助！ 不过还不是太糟糕，中途在某讨论社区发现了 DaisyDisk 这个小东西，姑且试试

![step6](/images/mac-system-cleanup/7.jpg)

好华丽的界面！真心跪舔啊…然后 DaisyDisk 居然可以通过 Administrator 权限得到和 System Info 一样的输出…！为什么不让我早点发现这个呢…..好吧最后按『一直找不到的单个巨型文件』这个思路定位了这玩意

![step7](/images/mac-system-cleanup/2.jpg)

在 Finder 里不改权限是进不去的哦亲~顺便还学了一招在 Finder 里可以 `cmd + J` 选择显示文件夹大小…

这玩意虽然在 Cache 里理论上删了没事，但是毕竟在 Google 上找到了跟它有关的报错信息，不放心啊……遂将其改名后重启，发现生成了一个新的 8M 大的同名缓存文件，窃喜，遂删之！

于是理论上我的磁盘空间应该没什么大问题了吧…于是终于 System Info 变成了这样

![step8](/images/mac-system-cleanup/8.jpg)

有什么问题吗？妈蛋人家一开始是要清理 App 的 40G 哇…结果这个没变反而是 Others 给几乎清干净了…

Others 不到 2G…? 要知道我的 Downloads 都不止 2G 啊……终于醒悟了，容量分类的 Filter 一定是逗比！ 折腾这么久以后有什么收获呢…

* 提权也不一定能用第三方得到与 System Info 的容量显示相同的结果
* 可以用 DaisyDisk 来看到准确的容量情况（而且还是各种可视化里最漂亮的）
* 如果容量莫名其妙减少，也可能与 Time Machine 本地备份或磁盘问题有关
* 对于拖进 Applications 里直接安装的软件，确实只要拖废纸篓里倒了就行，Library 里的残留基本是 KB 级别的
* 对于用 pkg “下一步->下一步->完成” 安装的软件，可以用 Onyx 找到 pkg 的详情，手动干掉
* port 和 homebrew 安装的命令行程序，容量基本可以忽略不计
* System Info 里，“Others” 和 “Apps” 各自占用的容量，系统可能傻傻分不清楚，但是总容量是准确的
* 特地为了删文件来写这篇文章真有点无聊…
