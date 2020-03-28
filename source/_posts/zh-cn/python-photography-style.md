categories: Note

tags:

- Python
- Visualization
- Photography

date: 2014-01-10

toc: false

title: 用 Python 了解自己的摄影风格
---

<!-- ![用 Python 了解自己的摄影风格](/images/python-shot-style/0.jpg) -->

手持单反，却在镜头升级的茫茫选择中飘忽不定？试着了解自己吧！通过 Python 读取每张图的 EXIF 信息，统计自己出片的光圈、快门速度、ISO、焦距，可以很方便地了解到自己拍摄的习惯，并且发现瓶颈。

<!--more-->

（比如如果出了一堆 f3.5-5.6 的图，就说明狗头的光圈值是瓶颈啦；要是 50-55mm 焦段的图少于 18mm 的图，那么把 18-55mm 换成 17-50mm 就赚到了焦段^_^）

Let’s Rock! 首先需要安装 Python 的图像处理库 PIL，我的 OSX 环境下用 ports 和 pip 都安装不能，最后改用了包含 PIL 的 pillow 库。 在终端输入

``` text
sudo pip install pillow
```

即可。脚本里首先导入 os 模块和 Image 模块，注意 PIL 的调用方法不能直接 import Image 而是

``` python
import os
from PIL import Image 
# 接下来是收集exif信息
exif = []
for i in range(0,size_of_photos):
    name = 'working_path/'+str(i)+'.jpg'
    try:
        cache = Image.open(name)
    except IOError:
    continue
    exif.append(cache._getexif())
```

这样会生成名为 exif 的列表，其中每个元素都是一个词典，存着一张图的 EXIF 信息。 EXIF信息的 key 名是一个五位数，对应内容是一个元组，例如光圈的 key 是 33437，第 i 张图 f 为 6.7，那么

``` python
exif[x][33437] = (67, 10)
```

相应的还有：

* 快门速度：下标 33434
* 焦距：下标 37386
* ISO：下标 34855

这样就轻易地收集到了每张图的 EXIF 信息，接下来利用 Python 的词典类型来做个简单的小统计：

``` python
def count_classify(array):
    item={}
    for i in range(0,len(array)):
        if array[i] in item:
            item[array[i]]+=1
    else:
        item[array[i]] = 1
    for i in item:
        print str(i)+'\t'+str(item[i])
```

把 EXIF 列表中的每个光圈、快门等参数传入上面的函数，就可以输出结果啦~

![结果](/images/python-shot-style/1.png)

把数据 copy 进 Keynote 以后画几个饼图就一目了然咯

![快门速度](/images/python-shot-style/2.png)

![ISO](/images/python-shot-style/3.png)

![焦距](/images/python-shot-style/4.png)

![光圈](/images/python-shot-style/5.png)

嗯，发现了没有，论光圈，虽然半壁江山都属于 f8，不过看看 f3.5-5.6 平分秋色的拍摄需求，显然应该升级一个大光圈的镜头。所以，定焦还是变焦？图上 18-50 的焦段分布并不能支持『35 通吃』或者『50 够用』的说法，一支变焦镜头应该更能满足需求。再看看 ISO 和快门速度，显然低感 + 慢门的配合占了多数，毕竟在魔都拍夜景不少嘛O(∩_∩)O
希望这次复活能有动力持续更新 blog >_< 准备概率论 final 去啦！