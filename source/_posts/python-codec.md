categories: Note

tags:

- Python

date: 2014-01-12

toc: false

title: Python 编码那点事
---

首先搞明白 Unicode / GBK / UTF-8 等概念。

不妨把 Unicode 理解成一个建筑师，他把造一座楼（写一篇文章）可能需要的所有砖头（世界上所有的文字）都列了出来，但是他不关心制造砖头（具体编码）的细节。

<!--more-->


而 UTF-8 / GBK / UTF-16 等编码，则是按不同方式制造砖头的苦力。同样解析出一段话，按照不同的方式编码，实现起来自然有差别。Python中，unicode 对象就是一种抽象，具体 print 给用户的，都是由 unicode 类型调用 encode 方法所得到的 str 类型（字符串）。

相应地，由 str 类型 decode 就能得到 unicode。这样，就实现了不同文字编码的转换。Python 的 unicode 在编辑脚本时，推荐将脚本的文字编码存储为 utf-8 格式，而字符串一律采用 u’balabala’ 的形式。脚本中记得声明编码为 utf-8。对于未加 u 前缀的中文字符串，如果不使用 decode 方法解码为 utf-8，则会报错。不作死就不会死啊，骚年。比如

``` python
#coding=utf-8
a = u"呵呵"
print type(a) # <type 'unicode'>
print a # 呵呵
print repr(a) # u'\xe5\x91\xb5\xe5\x91\xb5'
b = "呵呵"
print type(b) # <type 'str'>
print repr(b) # '\xe5\x91\xb5\xe5\x91\xb5'
print b.decode("utf-8") # 呵呵
```