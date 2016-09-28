categories: Note

tags:

- Web

date:  2016-08-02

toc: true

title: 初识 OAuth 2.0
---

RFC 6749 定义了 OAuth 2.0 协议框架。下面是对文档中基本概念和协议流程的简介。

<!--more-->

## 角色
OAuth 协议中定义了四个角色（终于不仅仅是 Alice 和 Bob 啦）。

* **Resource Owner** 是资源的所有者。如第三方登录时，这个概念对应拥有账号数据资源的用户。
* **Resource Server** 是托管资源的地方，一般场景下指代存储用户账号数据的服务器。
* **Client** 是请求访问资源的应用。和一般场景下指代用户浏览器不同，这里的客户端指第三方的网站服务器。
* **Authorization Server** 是为 Client 签发 Token 的认证服务器。


## 认证流程
下图是 [RFC 6749 Section 4.1](https://tools.ietf.org/html/rfc6749#section-4.1) 定义的，由第三方服务器请求资源（Web Server Side）时，协议的流程草图。如果由第三方的客户端（User Agent Side）请求资源，那么可以应用简化版的 [RFC 6749 Section 4.3](https://tools.ietf.org/html/rfc6749#section-4.3) 过程。

``` text
+----------+
| Resource |
|   Owner  |
|          |
+----------+
     ^
     |
    (B)
+----|-----+          Client Identifier      +---------------+
|         -+----(A)-- & Redirection URI ---->|               |
|  User-   |                                 | Authorization |
|  Agent  -+----(B)-- User authenticates --->|     Server    |
|          |                                 |               |
|         -+----(C)-- Authorization Code ---<|               |
+-|----|---+                                 +---------------+
  |    |                                         ^      v
 (A)  (C)                                        |      |
  |    |                                         |      |
  ^    v                                         |      |
+---------+                                      |      |
|         |>---(D)-- Authorization Code ---------'      |
|  Client |          & Redirection URI                  |
|         |                                             |
|         |<---(E)----- Access Token -------------------'
+---------+       (w/ Optional Refresh Token)
```

上图中的步骤介绍如下：

* A. 第三方网站（Client）将用户（Resource Owner）的浏览器重定向到授权服务器（各大门户网站的 OAuth 接口地址），浏览器重定向的目标 URI 中需要写入 Client 的 ID、本地 State、回调 URI 等关键参数。
* B. 在授权服务器的页面，用户通过密码等形式进行认证，这个认证过程对第三方网站不可见。
* C. 若上一步认证成功，授权服务器将用户浏览器重定向到 A 中提供的回调 URI 地址，并提供一个 Auth Code 供第三方网站使用。
* D. 第三方网站拿着上一步中获得的 Code，请求用于访问用户资源的 Access Token，同时提供回调 URI 地址。
* E. 授权服务器校验 Code 合法性，并判断 A 和 D 中提供的 URI 是否一致。若通过，则返回 Access Token 供第三方网站访问用户资源。


## 前端接入
在上面的流程中，Client 和授权服务器的交互过程实际上都发生在后端。以第三方登录而言，前端需要做的只有两件事：

1. 点击 QQ 或人人等登录按钮图标时，`window.open` 出一个新窗口，其中 URI 包含了当前所在地址的参数。
2. 在新窗口中认证成功后，一连串 302 重定向会访问当前地址，并将登录成功页的地址以 Cookie 形式写入。在当前页面轮询查找到该 Cookie 后直接跳转即可实现登录。
