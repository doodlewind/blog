categories: Note

tags:

- Linux
- USTC

date: 2015-03-27

toc: false

title: 清理学生主页的顽固空目录
---

[我科学生 FTP 主页](http://home.ustc.edu.cn/)是个扔东西共享的好地方。不过熵增容易清理难，在桌面客户端里删东西时会发现有些看起来空的目录怎么也删不掉，以下是个简单的解决方案。

<!--more-->

安装 `lftp`，OS X 下在终端里执行一句 `brew install lftp` 即可。

登录个人主页

``` text
lftp -u username,password home.ustc.edu.cn
```

删东西

``` text
set ftp:list-options -a
cd /folder/to/be/empty/
/folder/to/be/empty/> glob -a rm -r *
```

就酱
