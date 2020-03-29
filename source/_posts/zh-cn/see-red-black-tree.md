categories: Note

tags:

- Java
- Algorithms
- Visualization

date: 2015-02-07

toc: false

title: 种棵红黑树瞧瞧
---

![红黑树](/images/misc/red-black-tree.jpg)

作为一种用于改善二叉查找树最坏情形下性能的数据结构，红黑树的厉害之处在于无论你用什么顺序插入节点，它都能保持对数级的查找速度。

<!--more-->

而且，红黑树是基于二叉查找树的。这意味着在你实现了一棵二叉查找树后，只需要重写插入 / 删除方法，就能实现红黑树，而 `size()` / `max()` / `min()` 等方法都可以直接继承二叉查找树。

那么，红黑树相比二叉查找树，是怎么保证的完美平衡性，又多出了一些什么特性呢？

二叉查找树在按照元素大小顺序插入节点时是要跪的，因为这时候每次都要往最左边或最右边插入节点，造成树往同一边生长的问题。而且，即便是「完美地随机插入节点」，二叉查找树的叶子到根的距离也是不均匀的（下层节点数量恰好是上层两倍时才能满足对称强迫症嘛，当然了这和完美平衡的定义不同）。这时候码农们就想这样改进这棵树：只要我让每个节点能伸出不止两条边，并且允许每个节点存储多个键的信息，那么就可以种出一棵树，保证它的每个叶子到根的距离是相等的。有了这棵树，要保证「叶子到根距离相等」，下层节点数量就不必严格是上层的两倍了。

红黑树，就可以等效成一棵这样的树。你肯定会吐槽：说好是要继承二叉查找树的嘛，那每个节点不是只能伸出 `left` 和 `right` 两条边吗？这时候就可以做个奇妙的等效了：我们约定，给一些左链接（注意，不是所有的左链接）涂上红色，然后把这些红色链接放平，**把这些链接连接的两个节点等效成一个新节点**，这种新节点就可以伸出 2-3 条链接，存入 2 个键了。

做了这种等效，我们就能保证无论键有多少个，都能在插入节点时保持平衡了。但是，仍然不能保证任意顺序插入节点时的平衡性。对一棵二叉查找树，插入时节点总是生长在树的底部。而红黑树在插入时，可能会把节点递归地往上「挤」，如果一直「挤」到了树根，那么树高就会加 1。对红黑树，这是通过左右旋转和翻转的操作实现的。

左右旋转的对象是由红链接连接的节点。**旋转并不意味着节点的左右顺序发生了改变**（毕竟左右是按大小关系决定的），而是**相当于将两个节点的上下关系翻了过来**。因为红色链接连接的节点会被我们等效为「平」的，所以改变它们的上下关系，等效过来并不影响平衡。我们默认每次插入的节点都是用红链接连接的，于是就有了这样的几种可能性：

* 插入后，**右链接是红链接**，这时候右链接是红链接，和前面的约定不符，于是需要*左旋转*
* 插入后，**左右都是红链接**。这时候需要把左右链接颜色都翻成黑色，然后把中间的节点标成红色。（标成红色后，递归回溯时就相当于向上「挤」节点了）。
* 插入后，**有两个连续向左的红链接**，也就是 `isRed(x.left) && isRed(x.left.left)`。这时候就需要先把上面那条链接向右翻，然后就会化归为上面的需要翻转的情况。

只要依次解决这三种情况，就能保证每次不管插入的节点位于树的哪个位置，都能使它保持平衡。

这棵树的基础数据结构是这样的：

``` java
public class RedBlackBST<Key extends Comparable<Key>, Value > {
    private static final boolean RED = true;
    private static final boolean BLACK = false;
    private Node root;
    public class Node {
        private Key key;
        private Value val;
        private Node left, right;
        private int N;
        private boolean color;
        private int depth;
        public Node(Key key, Value val, int N, boolean color) {
            this.key = key;
            this.val = val;
            this.N = N;
            this.color = color;
        }
    }
}
```

略去一些比较平凡的方法，像 `isRed()` 和 `size()` 这些，以及和二叉搜索树完全相同的 `get()`，剩下的就是为了实现插入操作的 `rotateLeft()` / `rotateRight()` / `flipColors()` 方法了。

``` java
public Node rotateLeft(Node h) {
    Node x = h.right;
    h.right = x.left;
    x.left = h;
    x.color = h.color;
    h.color = RED;
    x.N = h.N;
    h.N = size(h.left) + size(h.right) + 1;
    return x;
}
public Node rotateRight(Node h) {
    Node x = h.left;
    h.left = x.right;
    x.right= h;
    x.color = h.color;
    h.color = RED;
    x.N = h.N;
    h.N = size(h.left) + size(h.right) + 1;
    return x;
}
private void flipColors(Node h) {
    h.color = RED;
    h.left.color = BLACK;
    h.right.color = BLACK;
}
public void put(Key key, Value val) {
    root = put(root, key, val);
    root.color = BLACK;
}
private Node put(Node h, Key key, Value val) {
    if (h == null) return new Node(key, val, 1, RED);
    int cmp = key.compareTo(h.key);
    if (cmp > 0) {
        h.right = put(h.right, key, val);
    }
    else if (cmp < 0) {
        h.left = put(h.left, key, val);
    }
    else {
        h.val = val;
    }
    if (isRed(h.right) && !isRed(h.left)) h = rotateLeft(h);
    if (isRed(h.left) && isRed(h.left.left)) h = rotateRight(h);
    if (isRed(h.left) && isRed(h.right)) flipColors(h);
    h.N = size(h.left) + size(h.right) + 1;
    return h;
}
```

这样在实现 `put()` 方法后，就可以实现 `draw()` 方法画出这棵树了。这个方法需要获得树的深度。在调用前，简单地遍历一次，更新节点深度即可。

``` java
public void updateDepth() {
    updateDepth(root, 1);
}
public void updateDepth(Node h, int depth) {
    if (h.color == RED) depth--;
    if (h.left != null) updateDepth(h.left, depth+1);
    if (h.right != null) updateDepth(h.right, depth+1);
    h.depth = depth;
}
public int maxDepth() {
    updateDepth();
    return maxDepth(root, 1);
}
public int maxDepth(Node x, int max) {
    if (x.left != null) return maxDepth(x.left, max);
    if (x.right != null) return maxDepth(x.right, max);
    if (x.depth > max) {
        return x.depth;
    }
    else return max;
}
public void draw() {
    int size = size(root);
    updateDepth();
    int maxDepth = maxDepth();
    draw(root, size, maxDepth);
    StdDraw.show(233333);
}
private void draw(Node x, int size, int maxDepth) {
    double px = (double)rank(x.key) / size;
    double py = 1 - ((double)x.depth - 1)/ maxDepth;
    if(x.left != null) {
        double pxLeft = (double)rank(x.left.key) / size;
        double pyLeft = 1 - ((double)x.left.depth - 1)/ maxDepth;
        if (x.left.color == RED) StdDraw.setPenColor(StdDraw.RED);
        StdDraw.line(px, py, pxLeft, pyLeft);
        StdDraw.setPenColor(StdDraw.BLACK);
    }
    if(x.right != null) {
        double pxRight = (double)rank(x.right.key) / size;
        double pyRight = 1 - ((double)x.right.depth - 1)/ maxDepth;
        if (x.right.color == RED) StdDraw.setPenColor(StdDraw.RED);
        StdDraw.line(px, py, pxRight, pyRight);
        StdDraw.setPenColor(StdDraw.BLACK);
    }
    StdDraw.setPenColor(StdDraw.WHITE);
    StdDraw.filledCircle(px, py, 0.04);
    StdDraw.setPenColor(StdDraw.BLACK);
    StdDraw.circle(px, py, 0.04);
    StdDraw.text(px, py, x.key.toString());
    if (x.left != null) draw(x.left, size, maxDepth);
    if (x.right != null) draw(x.right, size, maxDepth);
}
```

构造完成的红黑树中，键的数据类型是泛型。可视化展现时，则用英文字母作为泛型实例的类型。绘图用到的 `StdDraw` 库可以从[这里](http://algs4.cs.princeton.edu/code/)获取到。为了展示红黑树黑色平衡的特性，把红链接画平了。这样画出来就是题图的结果。
