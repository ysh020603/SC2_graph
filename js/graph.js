import {
  COLORS,
  EDGE_STYLES,
  NODE_SIZE,
} from "./config.js";

function nodeColor(kind, payload) {
  if (kind === "Ability") {
    return COLORS.Ability;
  }
  if (kind === "Upgrade") {
    return COLORS.Upgrade;
  }
  const race = payload?.race || "Terran";
  return COLORS.Unit[race] || COLORS.Unit.Terran;
}

function hexPoints(size) {
  const points = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    points.push([size * Math.cos(angle), size * Math.sin(angle)]);
  }
  return points;
}

function registerCustomNodes() {
  if (registerCustomNodes.initialized) {
    return;
  }
  registerCustomNodes.initialized = true;

  if (typeof G6 === "undefined") {
    throw new Error("G6 未加载，请确认 vendor/g6.min.js 可访问");
  }
  G6.registerNode(
    "unit-node",
    {
      draw(cfg, group) {
        const size = cfg.size || NODE_SIZE.Unit;
        const keyShape = group.addShape("circle", {
          attrs: {
            x: 0,
            y: 0,
            r: size / 2,
            fill: cfg.style?.fill || "#1E40AF",
            stroke: "#E5E7EB",
            lineWidth: 1.5,
            cursor: "pointer",
          },
          name: "key-shape",
        });
        group.addShape("text", {
          attrs: {
            text: cfg.displayLabel || cfg.name,
            x: 0,
            y: size / 2 + 14,
            textAlign: "center",
            textBaseline: "top",
            fill: "#CBD5E1",
            fontSize: 10,
          },
          name: "label-shape",
        });
        return keyShape;
      },
      setState(name, value, item) {
        const group = item.getContainer();
        const shape = group.find((element) => element.get("name") === "key-shape");
        const label = group.find((element) => element.get("name") === "label-shape");
        if (!shape) {
          return;
        }
        if (name === "highlight") {
          shape.attr("lineWidth", value ? 4 : 1.5);
          shape.attr("stroke", value ? "#FBBF24" : "#E5E7EB");
          shape.attr("shadowColor", value ? "#FBBF24" : null);
          shape.attr("shadowBlur", value ? 16 : 0);
        }
        if (name === "dim") {
          const opacity = value ? 0.12 : 1;
          shape.attr("opacity", opacity);
          if (label) {
            label.attr("opacity", opacity);
          }
        }
      },
    },
    "single-node",
  );

  G6.registerNode(
    "ability-node",
    {
      draw(cfg, group) {
        const size = cfg.size || NODE_SIZE.Ability;
        const keyShape = group.addShape("rect", {
          attrs: {
            x: -size / 2,
            y: -size / 2,
            width: size,
            height: size,
            radius: 4,
            fill: cfg.style?.fill || COLORS.Ability,
            stroke: "#E5E7EB",
            lineWidth: 1.5,
            cursor: "pointer",
          },
          name: "key-shape",
        });
        group.addShape("text", {
          attrs: {
            text: cfg.displayLabel || cfg.name,
            x: 0,
            y: size / 2 + 14,
            textAlign: "center",
            textBaseline: "top",
            fill: "#CBD5E1",
            fontSize: 10,
          },
          name: "label-shape",
        });
        return keyShape;
      },
      setState(name, value, item) {
        const group = item.getContainer();
        const shape = group.find((element) => element.get("name") === "key-shape");
        const label = group.find((element) => element.get("name") === "label-shape");
        if (!shape) {
          return;
        }
        if (name === "highlight") {
          shape.attr("lineWidth", value ? 4 : 1.5);
          shape.attr("stroke", value ? "#FBBF24" : "#E5E7EB");
          shape.attr("shadowColor", value ? "#FBBF24" : null);
          shape.attr("shadowBlur", value ? 16 : 0);
        }
        if (name === "dim") {
          const opacity = value ? 0.12 : 1;
          shape.attr("opacity", opacity);
          if (label) {
            label.attr("opacity", opacity);
          }
        }
      },
    },
    "single-node",
  );

  G6.registerNode(
    "upgrade-node",
    {
      draw(cfg, group) {
        const size = (cfg.size || NODE_SIZE.Upgrade) / 2;
        const keyShape = group.addShape("polygon", {
          attrs: {
            points: hexPoints(size),
            fill: cfg.style?.fill || COLORS.Upgrade,
            stroke: "#E5E7EB",
            lineWidth: 1.5,
            cursor: "pointer",
          },
          name: "key-shape",
        });
        group.addShape("text", {
          attrs: {
            text: cfg.displayLabel || cfg.name,
            x: 0,
            y: size + 14,
            textAlign: "center",
            textBaseline: "top",
            fill: "#CBD5E1",
            fontSize: 10,
          },
          name: "label-shape",
        });
        return keyShape;
      },
      setState(name, value, item) {
        const group = item.getContainer();
        const shape = group.find((element) => element.get("name") === "key-shape");
        const label = group.find((element) => element.get("name") === "label-shape");
        if (!shape) {
          return;
        }
        if (name === "highlight") {
          shape.attr("lineWidth", value ? 4 : 1.5);
          shape.attr("stroke", value ? "#FBBF24" : "#E5E7EB");
          shape.attr("shadowColor", value ? "#FBBF24" : null);
          shape.attr("shadowBlur", value ? 16 : 0);
        }
        if (name === "dim") {
          const opacity = value ? 0.12 : 1;
          shape.attr("opacity", opacity);
          if (label) {
            label.attr("opacity", opacity);
          }
        }
      },
    },
    "single-node",
  );
}

function buildNodeModel(node) {
  const kind = node.kind;
  const typeMap = {
    Unit: "unit-node",
    Ability: "ability-node",
    Upgrade: "upgrade-node",
  };
  return {
    ...node,
    type: typeMap[kind],
    size: NODE_SIZE[kind],
    label: "",
    displayLabel: node.label,
    style: {
      fill: nodeColor(kind, node.payload),
    },
    labelCfg: {
      style: {
        fill: "#CBD5E1",
        fontSize: 10,
      },
    },
  };
}

function buildEdgeModel(edge) {
  const layerStyle = EDGE_STYLES[edge.layer] || EDGE_STYLES.base;
  return {
    ...edge,
    type: "line",
    style: {
      stroke: layerStyle.stroke,
      lineWidth: layerStyle.lineWidth,
      lineDash: layerStyle.lineDash,
      endArrow: {
        path: G6.Arrow.triangle(8, 10, 0),
        fill: layerStyle.arrowFill,
      },
      cursor: "pointer",
    },
    stateStyles: {
      highlight: {
        stroke: "#FBBF24",
        lineWidth: (layerStyle.lineWidth || 1.5) + 2,
        shadowColor: "#FBBF24",
        shadowBlur: 8,
        opacity: 1,
      },
      dim: {
        opacity: 0.08,
      },
    },
  };
}

function createFilterState() {
  return {
    kinds: { Ability: true, Unit: true, Upgrade: true },
    races: { Terran: true, Protoss: true, Zerg: true },
    layers: { base: true, inferred: true, semantic: true },
  };
}

function getContainerSize(container) {
  const rect = container.getBoundingClientRect();
  const width = Math.floor(rect.width || container.clientWidth || 0);
  const height = Math.floor(rect.height || container.clientHeight || 0);

  if (width > 0 && height > 0) {
    return { width, height };
  }

  const header = document.querySelector(".app-header");
  const headerHeight = header?.getBoundingClientRect().height || 64;
  return {
    width: Math.max(width, window.innerWidth - 580),
    height: Math.max(height, window.innerHeight - headerHeight - 8),
  };
}

export function createGraphApp(container, graphData, detailsPanel, onStatus) {
  registerCustomNodes();

  const filterState = createFilterState();
  let graph = null;
  let selectedItem = null;

  const nodes = graphData.nodes.map(buildNodeModel);
  const edges = graphData.edges.map(buildEdgeModel);

  function isNodeVisible(model) {
    if (!filterState.kinds[model.kind]) {
      return false;
    }
    if (model.kind === "Unit") {
      const race = model.payload?.race;
      if (race && !filterState.races[race]) {
        return false;
      }
    }
    return true;
  }

  function isEdgeVisible(model, visibleNodeIds) {
    if (!filterState.layers[model.layer]) {
      return false;
    }
    return visibleNodeIds.has(model.source) && visibleNodeIds.has(model.target);
  }

  function applyFilters() {
    if (!graph) {
      return;
    }

    const visibleNodeIds = new Set();
    graph.getNodes().forEach((node) => {
      const model = node.getModel();
      if (isNodeVisible(model)) {
        visibleNodeIds.add(model.id);
        graph.showItem(node);
      } else {
        graph.hideItem(node);
      }
    });

    graph.getEdges().forEach((edge) => {
      const model = edge.getModel();
      if (isEdgeVisible(model, visibleNodeIds)) {
        graph.showItem(edge);
      } else {
        graph.hideItem(edge);
      }
    });

    if (selectedItem && (selectedItem.destroyed || !selectedItem.isVisible?.())) {
      detailsPanel.showPlaceholder();
    }
    clearHighlight();
  }

  function clearHighlight() {
    if (!graph) {
      return;
    }
    graph.getNodes().forEach((node) => {
      graph.clearItemStates(node, ["highlight", "dim"]);
    });
    graph.getEdges().forEach((edge) => {
      graph.clearItemStates(edge, ["highlight", "dim"]);
    });
    selectedItem = null;
  }

  function highlightNeighborhood(centerNode) {
    clearHighlight();
    selectedItem = centerNode;

    const centerId = centerNode.getID();
    const neighborIds = new Set([centerId]);

    graph.getEdges().forEach((edge) => {
      const model = edge.getModel();
      if (model.source === centerId || model.target === centerId) {
        neighborIds.add(model.source);
        neighborIds.add(model.target);
        graph.setItemState(edge, "highlight", true);
      } else {
        graph.setItemState(edge, "dim", true);
      }
    });

    graph.getNodes().forEach((node) => {
      if (neighborIds.has(node.getID())) {
        graph.setItemState(node, "highlight", true);
      } else {
        graph.setItemState(node, "dim", true);
      }
    });

    detailsPanel.showNode(centerNode.getModel());
  }

  function highlightEdge(edge) {
    clearHighlight();
    selectedItem = edge;

    const model = edge.getModel();
    graph.setItemState(edge, "highlight", true);

    graph.getNodes().forEach((node) => {
      const nodeId = node.getID();
      if (nodeId === model.source || nodeId === model.target) {
        graph.setItemState(node, "highlight", true);
      } else {
        graph.setItemState(node, "dim", true);
      }
    });

    graph.getEdges().forEach((otherEdge) => {
      if (otherEdge.getID() !== edge.getID()) {
        graph.setItemState(otherEdge, "dim", true);
      }
    });

    detailsPanel.showEdge(model);
  }

  function initGraph() {
    const { width, height } = getContainerSize(container);
    let layoutFinished = false;

    function finishLayout(reason) {
      if (layoutFinished || !graph || graph.get("destroyed")) {
        return;
      }
      layoutFinished = true;
      graph.fitView(40);
      onStatus?.(
        `${reason} · ${graphData.stats.nodeCount} 个节点 · ${graphData.stats.edgeCount} 条边 · 滚轮缩放 / 拖拽平移`,
      );
      container.classList.remove("is-loading");
    }

    graph = new G6.Graph({
      container,
      width,
      height,
      fitView: false,
      animate: false,
      modes: {
        default: ["drag-canvas", "zoom-canvas", "drag-node"],
      },
      layout: {
        type: "forceAtlas2",
        preventOverlap: true,
        kr: 8,
        kg: 1,
        nodeSize: (node) => (node.size || 24) + 8,
        workerEnabled: false,
        onLayoutEnd: () => finishLayout("布局完成"),
      },
      defaultEdge: {
        type: "line",
      },
    });

    graph.node((node) => ({
      labelCfg: {
        position: "bottom",
        style: {
          fill: "#94A3B8",
          fontSize: 10,
        },
      },
    }));

    graph.edge(() => ({
      style: {
        lineAppendWidth: 18,
      },
    }));

    graph.data({ nodes, edges });
    onStatus?.("力导向布局计算中，请稍候...");
    graph.render();

    graph.on("afterlayout", () => finishLayout("布局完成"));

    window.setTimeout(() => {
      if (!layoutFinished) {
        finishLayout("布局超时，已强制显示");
      }
    }, 20000);

    graph.on("node:click", (event) => {
      event.stopPropagation?.();
      highlightNeighborhood(event.item);
    });

    graph.on("edge:click", (event) => {
      event.stopPropagation?.();
      highlightEdge(event.item);
    });

    graph.on("canvas:click", () => {
      clearHighlight();
      detailsPanel.showPlaceholder();
    });

    window.addEventListener("resize", () => {
      if (!graph || graph.get("destroyed")) {
        return;
      }
      const nextSize = getContainerSize(container);
      graph.changeSize(nextSize.width, nextSize.height);
      graph.fitView(40);
    });
  }

  function bindFilters(filterRoot) {
    filterRoot.querySelectorAll("[data-filter-kind]").forEach((input) => {
      input.addEventListener("change", () => {
        filterState.kinds[input.value] = input.checked;
        applyFilters();
      });
    });

    filterRoot.querySelectorAll("[data-filter-race]").forEach((input) => {
      input.addEventListener("change", () => {
        filterState.races[input.value] = input.checked;
        applyFilters();
      });
    });

    filterRoot.querySelectorAll("[data-filter-layer]").forEach((input) => {
      input.addEventListener("change", () => {
        filterState.layers[input.value] = input.checked;
        applyFilters();
      });
    });
  }

  initGraph();

  return {
    graph,
    applyFilters,
    bindFilters,
    clearHighlight,
  };
}
