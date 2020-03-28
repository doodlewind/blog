categories: Note

tags:

- JS

date: 2015-04-05

toc: true

title: 几个好用的 JS 助手函数
---

## 数组去重
「如果这个对象不存在于数组中，那么就加入该对象」是个常见的需求。比起每次遍历判断是否加入，直接 `push()` 进以后再做一次去重显然更方便一些。对于对象，我们需要指定去重的方式，对于对象数组，可以使用 `uniqueBy(array, JSON.stringify)` 来使用它。

``` js
function uniqueBy(a, key) {
   var seen = {};
   return a.filter(function(item) {
       var k = key(item);
       return seen.hasOwnProperty(k) ? false : (seen[k] = true);
   })
}
```

## 深拷贝
如果直接遍历对象赋值，拷贝的只是引用。要实现拷贝值的深拷贝，可以用这个 `clone(obj)` 来实现深拷贝。

``` js
// 递归实现的深拷贝
function clone(obj){
   var newObj = obj.constructor === Array ? [] : {};
   if(typeof obj !== 'object'){
       return;
   } else {
       for(var i in obj){
           newObj[i] = typeof obj[i] === 'object' ?
               clone(obj[i]) : obj[i];
       }
   }
   return newObj;
};
```

## 判断数组是否有值
这个其实只是 `indexOf` 方法的封装，但是却好用了不少。从此可以看出 API 设计的重要性……

``` js
// 判断数组是否含有值
function hasValue(arr,obj) {
   return (arr.indexOf(obj) != -1);
};
```
