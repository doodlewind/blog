categories: Note

tags:

- macOS
- Web

date: 2014-01-11

toc: false

title: GoAgentX 的简单配置
---

有了图形化的 GoAgentX，Mac 下通过 Google App Engine 科学上网的配置相当简捷。

<!--more-->

首先申请 GAE 帐号。[传送门](https://appengine.google.com/)在此，循序渐进按下不表。
接下来[下载](http://goagentx.com/)安装 GoAgentX 客户端，完成后界面大致如下，新版界面和网上教程截图有些出入

![main](/images/goagentx/1.png)

首先点左下角的+添加一个 goagent 的配置文件

![config](/images/goagentx/2.png)

然后部署服务器端。选择主界面右下角的高级设置

![advance](/images/goagentx/3.png)

注意区分 App ID 不带后缀，用户名带邮箱后缀。服务密码可不填写，密码填 GAE 生成的 16 位密码。

![main](/images/goagentx/1.png)

部署完成后回到该界面，填写服务器 App ID 和服务密码后，打开右上开关架起梯子吧！如果 twitter 无法访问，是证书问题，可参考[这里](http://www.guokr.com/blog/436937/)
