categories: Note

tags:

- Python
- Visualization

date: 2014-01-13

toc: false

title: 统计 QQ 回复时间分布
---

![graph](/images/统计QQ回复时间分布0.png)

你可曾面对手机屏幕里妹纸的头像延续那漫长的等待？是否觉得对方回复奇慢无比而你却是个秒回达人？不用猜测了，把记录稍作分析，就能得到结论。

<!--more-->

统计样板是半年前和某人的聊天记录，只消一个正则把符合(昵称-时间)的所有模式提取出来就足够了。这样写：

``` python
import re
name1 = "ewind"
name2 = "hehe"
record = open("record.txt", "r").read().decode('utf-8')
times = re.findall('(%s|%s)  ([0-9][0-9]):([0-9][0-9]):([0-9][0-9])'%(name1,name2),message_set)
```

呃，是不是太简单了一点呢。用相似的思路可以提取出聊天双方的每一句话，以算出长度之比。

![result](/images/统计QQ回复时间分布1.png)

这就是脚本跑出来的内容。样本量并不大，enough for fun. 把每句话的回复时间作为随机变量，导入excel（好低端）后用 FREQUENCY 函数得到频数分布，得到本文开始的那幅图（横坐标为回复时间）。脚本显示，我的回复时间 : 对方回复时间 = 44 : 174，这样看来图上谁是谁显然一目了然了吧 :-S

再给自己发张好人卡吧。
