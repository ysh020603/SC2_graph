# SC2 知识图谱可视化

基于 `data_base_add_graph.json` 的交互式知识图谱，使用 AntV G6 实现。

本目录为**自包含**部署：`data_base_add_graph.json`、前端代码、G6 库均在此文件夹内。

## 功能

- 左侧过滤：节点类型、种族、关系层级
- 中央画布：力导向布局、缩放、平移、拖拽节点
- 右侧详情：点击节点查看属性，点击连线查看关系描述
- 孤立节点：无关系的实体仍会渲染，并被布局推到外围

## 运行方式

必须在 `graph_viewer` 目录启动 HTTP 服务（浏览器无法直接 `file://` 读取 JSON）。

```bash
cd /data2/SC2_shy/relation_description_builder/graph_viewer
python3 serve.py
```

浏览器打开：

```
http://127.0.0.1:8765/
```

自定义端口：

```bash
python3 serve.py --port 8766
```

## 操作说明

| 操作 | 效果 |
|------|------|
| 滚轮 | 缩放画布 |
| 拖拽空白 | 平移画布 |
| 点击节点 | 高亮一度邻居，右侧显示实体属性 |
| 点击连线 | 高亮起终点，右侧显示关系描述 |
| 点击空白 | 取消高亮，清空详情面板 |
| 取消节点/种族勾选 | 隐藏对应节点及其关联边 |
| 取消关系层级勾选 | 仅隐藏该层级连线，节点保留 |

## 文件结构

```
graph_viewer/
  data_base_add_graph.json   # 数据集
  index.html                 # 页面入口
  serve.py                   # 本地 HTTP 服务
  vendor/g6.min.js           # G6 图可视化库
  css/main.css
  js/
    config.js
    parser.js
    graph.js
    details.js
    main.js
```

## 数据要求

每个 `Unit` / `Ability` / `Upgrade` 条目应包含 `relations` 字段（可为空数组 `[]`）。

更新数据时，直接替换本目录下的 `data_base_add_graph.json` 并刷新页面即可。
