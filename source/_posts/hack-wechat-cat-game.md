categories: Scribble

tags:

- Web

date: 2014-07-23

toc: false

title: 如何用任意步围住神经猫
---

首先，你得有个服务器，多烂都行，比如[我们学校的 FTP 服务器](http://home.ustc.edu.cn)。

然后，在网页目录下，新建一个空白的 sjm.html。这样你就可以在 `http://你的域名/sjm.html` 里访问到它了。

下一步，往里面写这些东西：

<!--more-->

``` html
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN">
<html>
    <head>
        <meta charset="utf-8">
        <title>我用了250步围住神经猫，击败250%的人，你能超过我吗？</title>
    </head>
    <body>
    </body>
</html>
```

保存，然后找个二维码生成器，比如[这里](http://cli.im)，用你那只假神经猫的地址，生成个二维码。然后微信扫描这个二维码。看到了什么？

等等，先把手机搁一边，别急着分享，分享以后人家一打开你就露馅了。现在修改一下 sjm.html，只要改一行，让它跳转到真的神经猫那儿就行（什么，你问我刚才为什么不直接改？改完以后一打开链接就跳到真猫那了，你还分享个什么劲啊…）

``` html
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN">
<html>
    <head>
        <title>我用了1步围住神经猫，击败100%的人，你能超过我吗？</title>
        <meta charset="utf-8" http-equiv="refresh" content="0;"url=http://1251001823.cdn.myqcloud.com/1251001823/wechat/sjm/launcher?from=timeline&isappinstalled=0>
    </head>
    <body></body>
</html>
```

保存以后，堂堂正正地把这个链接发到朋友圈吧！反正他们一打开链接看见的就是真猫。
