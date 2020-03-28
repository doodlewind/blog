categories: Note

tags:

- Linux

date:  2016-05-20

toc: true

title: AngularJS 网球计分器
---

[Match Recorder](http://tennis.ewind.us) 是一个用来熟悉 AngularJS 的小作品，[源码](https://github.com/doodlewind/tennis-match-recorder)已上传到 Github 了。它虽然小巧，但特性并不少<!--more-->：

* 可设定单盘局数、先发球方、平分制。
* 自动维护双方盘分、局分和发球顺序。
* 支持抢七局计分。
* 支持撤销单次得分。
* 可分析双方对局数据，包括一二发进球 / 得分率、正反手制胜分与 UE、破发点与网前得分等。
* 适配多种设备的响应式界面设计。
* 图标支持添加至 iOS / Android 设备主屏幕。
* 核心脚本仅 300 余行代码。

下面以若干核心功能为例，说明如何利用 AngularJS 进行实现。


## 前端路由
通过 Angular 的 stateProvider 模块，可以将单页应用中的每个功能模块所对应的业务逻辑、模板文件抽取出来，实现拆分和解耦。

首先，引入 `ui.router` 模块。

``` html
<script>path/to/angular.js></script>
<script>path/to/angular-ui-router.js</script>
```

`main.js` 中声明 `ui.router` 作为依赖后，即可注入 `$stateProvider` 和 `$urlRouterProvider` 依赖到控制器中。啰嗦一下，Angular 著名的依赖注入方式，实际上就是为每个业务的控制器显式传入其所需要依赖的对象。例如，控制器（为页面增加具体业务逻辑的函数）需要和后端交互时，传入 `$http` 依赖；需要绑定页面作用域内变量时，传入 `$scope` 依赖；需要获取当前 URL 参数时，传入 `$stateParams` 依赖等。如下所示的例子，则是在注入了路由依赖的基础上，通过 `$urlRouterProvider.otherwise()` / `$stateProvider.statestate()` 等 API 方式，为当前页面添加路由。

``` js
var matchRecorder = angular.module('match.recorder', ['ui.router']);
matchRecorder.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('config');
    $stateProvider
        .state('config', {
            url: '/config',
            controller: 'ConfigCtrl',
            templateUrl: 'config.html'
        })
        .state('scoring', {
            url: '/scoring',
            controller: 'ScoringCtrl',
            templateUrl: 'scoring.html'
        })
        .state('result', {
            url: '/result',
            controller: 'ResultCtrl',
            templateUrl: 'result.html'
        })
        .state('help', {
            url: '/help',
            templateUrl: 'help.html'
        });
});
```

例如，在声明路由 `config` 后，访问 `index.html#/config` 即可访问到这个路由对应的 HTML 模板文件。通过 HTML 中的 `<a ui-sref="config">DEMO</a>` 这样的标签，也可以正常访问该路由。

最后再多个嘴。在实现了前端的路由之后，实际上可以将后端所需开放的接口减小到仅对 XHR 响应返回 JSON 格式数据，从而彻底将交互逻辑分离给前端，更方便前后端的对接。


## 状态间数据传递
在路由状态之间切换时，经常需要在状态之间进行数据的共享。例如，注入到 `config` 路由中的 `$scope.title` 需要在切换到 `result` 路由中后继续展示，然而由于 Angular 的依赖注入机制，这两个路由状态所分别对应的 `$scope` 实际上是完全不同的。这时候，Angular 提供了一种共享数据的机制，即通过 Service 进行数据的传递。你可以声明一个 MyService 函数，作为依赖注入到两个你想要共享数据的状态控制器之间，这样在一个控制器中调用 `setter` 后再在另一个中调用 `getter` 方法，即可实现数据的传递。范例如下所示：

``` js
matchRecorder.service('dataService', function() {
    var data = {};
    var setDate = function(myData) {
        data = myData;
    };
    var getData = function() {
        return data;
    };
    return {
        addData: addData,
        getData: getData
    }
});
```

将上面的 Service 分别注入两个需要数据交互的 Controller 后，即可实现状态间数据的传递。


## 按钮点击交互
UI 中最常见的交互逻辑，或许就是按钮触发函数了。Angular 采用简洁的声明实现了这一功能。

首先在 HTML 中声明一个 `button` 附带特殊的 `ng-click` 属性

``` html
<button ng-click="boomShakalaka()">BOOM</button>
```

然后在该 HTML 对应的 Controller 中，实现 `ng-click` 所声明的函数即可。

``` js
$scope.boomShakalaka = function() {
    alert("Boom Shakalaka");
};
```

以上就是对 Angular 一些基础使用范式的总结。
