categories: Note

tags:

- Web
- JS

date: 2016-10-20

toc: false

title: 两行代码的 Cookie 操作库
---

虽然 `document.cookie` 的 API 设计确实可以算是历史遗留问题，但是为了基本的 Cookie 操作真的有调用第三方库的必要吗？这个两行有效代码的 [ck.js](https://github.com/doodlewind/ck.js) 就实现了 Get 和 Set 接口。

<!--more-->

``` js
window.ck = {
  get: function(key) { 
    return document.cookie.split(';').map(function(x) { return x.indexOf(key) > -1 ? x : '' } ).join('').split(key + '=')[1]
  },
  set: function(c) {
    document.cookie = Object.keys(c)[0] + '=' + c[Object.keys(c)[0]] + '; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/'
  },
}
```

API 和代码一样简单：

``` js
ck.set({ token: 123 }) // 设入一个永久 Cookie
```

相应的 Getter：

``` js
ck.get('token') // '123'
```

`get` 方法通过 `map` 来操作分隔后的 `document.cookie()` 字符串，并筛出查询 Key 对应的值，而 `set` 方法将接受的键值对设入 `document.cookie` 中。虽然 API 简陋，然而这确实能 Cover 许多场景。当然了，这只是个玩具项目，仅仅是用来调戏某些为了设入一个简单的 token 而调用了 jQuery 和 jQuery.cookie 的编码行为而已（真有这么干的）。
