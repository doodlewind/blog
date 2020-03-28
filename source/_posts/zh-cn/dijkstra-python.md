categories: Note

tags:

- Python
- Algorithms

date: 2015-02-04

toc: false

title: 10 行代码实现最短路径算法
---

利用 Python 的列表推导式可以灵活而方便地进行迭代，这个特性能简洁地处理经典的最短路径算法中用到的细节。

<!--more-->

我们知道，最短路径算法的经典思想，就是每次从未访问的节点中，挑出到起始点最近的一个访问，并更新该点的各邻接点到起始点的最短路径长度。当节点被全部访问后，也就得到了起始点到其余所有点的最短路径长度了。

这里把输入的数据用这样的格式表示：

``` python
graph = {
   'B': {'A': 5, 'D': 1, 'G': 2},
   'A': {'B': 5, 'D': 3, 'E': 12, 'F': 5},
   'D': {'B': 1, 'G': 1, 'E': 1, 'A': 3},
   'G': {'B': 2, 'D': 1, 'C': 2},
   'C': {'G': 2, 'E': 1, 'F': 16},
   'E': {'A': 12, 'D': 1, 'C': 1, 'F': 2},
   'F': {'A': 5, 'E': 2, 'C': 16}
}
```

下面是算法。这里我们用 `distances` 标识节点间的路径长度；用 `unvisited` 标识未访问的节点集；用 `visited` 的键标识已经访问的节点，用它的值表示起始点到已访问节点的最短距离；用 `None` 表示存在节点间不存在通路（距离无穷大）：

``` python
def dijkstra(distances, start):
    unvisited = {node: None for node in distances}
    visited = {start: 0}
    while len(unvisited) > 0:
        tmp = {u: visited[u] for u in unvisited if u in visited}
        min_node, min_distance = min(tmp.items(), key=lambda x: x[1])
        del(unvisited[min_node])
        for node in distances[min_node]:
            if node not in visited \
                    or visited[node] > visited[min_node] + distances[min_node][node]:
                visited[node] = visited[min_node] + distances[min_node][node]
    return visited
```

这短短几行就做了这么几件事：

1. 初始化 `unvisited` 词典。
2. 初始化 `visited` 词典。
3. 当 `unvisited` 中还有元素时，依次：
    1. 生成一个 `{节点名: 起始点与其距离}` 格式的词典 `tmp`。
    2. 用 lambda 表达式对 `tmp` 的值排序，找到当前与起始点最近的节点 `min_node`。
    3. 从 `unvisited` 中删掉这个节点。
    4. `distances[min_node]` 表示了 `min_node` 到其余所有节点的距离。如果 `start` 到 `min_node` 的距离加上这个距离，小于从 `start` 直达的距离，那么更新由 `visited` 表示的最短距离。
4. `unvisited` 为空时，将 `visited` 作为需要的结果返回。

这里面，用形如 `{x: f(x) for x in X if Y}` 的列表推导式构造了一个倒手用的词典。而要这个词典里选取最小值的键，则是先用词典的 `items()` 方法将词典表为 `(key, value)` 形式的元组，再传入 `min()` 中，排序参数用匿名表达式 `lambda x: x[1]` 来表示。这样，原本需要一个函数来完成的任务，两行就可以完成了。

函数部分去掉头部和 `if` 为保持可读性的分行，一共就只要 10 行，应该不坑吧？
