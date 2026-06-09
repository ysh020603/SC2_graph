import { COLORS, EDGE_STYLES, FIT_VIEW_PADDING, LAZY_ROOT_IDS, NODE_SIZE, PERFORMANCE_ZOOM_THRESHOLD } from "./config.js";

function nodeColor(kind) {
  return COLORS[kind] || "#5B8FF9";
}

function nodeStroke(item, fallback) {
  return item.getModel().style?.stroke || fallback;
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

  const registerNodeType = (type, drawShape) => {
    G6.registerNode(
      type,
      {
        draw(cfg, group) {
          const size = cfg.size || 24;
          const keyShape = drawShape(cfg, group, size);
          const labelShape = group.addShape("text", {
            attrs: {
              text: cfg.displayLabel || cfg.name,
              x: 0,
              y: size / 2 + 14,
              textAlign: "center",
              textBaseline: "top",
              fill: "#333333",
              fontSize: 10,
            },
            name: "label-shape",
          });
          labelShape.set("visible", cfg.showLabel !== false);
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
            shape.attr("lineWidth", value ? 4 : 2);
            shape.attr("stroke", value ? "#FBBF24" : nodeStroke(item, "#5B8FF9"));
            shape.attr("shadowColor", value ? "#FBBF24" : null);
            shape.attr("shadowBlur", value ? 16 : 0);
          }
          if (name === "dim") {
            const opacity = value ? 0.12 : 1;
            shape.attr("opacity", opacity);
            if (label) {
              label.attr("opacity", value ? opacity : label.get("visible") === false ? 0 : 1);
            }
          }
        },
      },
      "single-node",
    );
  };

  registerNodeType("unit-node", (cfg, group, size) =>
    group.addShape("circle", {
      attrs: {
        x: 0,
        y: 0,
        r: size / 2,
        fill: cfg.style?.fill || "#5B8FF9",
        stroke: cfg.style?.stroke || "#5B8FF9",
        lineWidth: 2,
        cursor: "pointer",
      },
      name: "key-shape",
    }),
  );

  registerNodeType("ability-node", (cfg, group, size) =>
    group.addShape("rect", {
      attrs: {
        x: -size / 2,
        y: -size / 2,
        width: size,
        height: size,
        radius: 4,
        fill: cfg.style?.fill || COLORS.Ability,
        stroke: cfg.style?.stroke || COLORS.Ability,
        lineWidth: 2,
        cursor: "pointer",
      },
      name: "key-shape",
    }),
  );

  registerNodeType("upgrade-node", (cfg, group, size) => {
    const radius = (cfg.size || NODE_SIZE.Upgrade) / 2;
    return group.addShape("polygon", {
      attrs: {
        points: hexPoints(radius),
        fill: cfg.style?.fill || COLORS.Upgrade,
        stroke: cfg.style?.stroke || COLORS.Upgrade,
        lineWidth: 2,
        cursor: "pointer",
      },
      name: "key-shape",
    });
  });
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
    showLabel: true,
    style: {
      fill: node.style?.fill || nodeColor(kind),
      stroke: node.style?.stroke || nodeColor(kind),
    },
    labelCfg: {
      style: {
        fill: "#333333",
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
    relationTypes: new Set(),
    manuallyHiddenIds: new Set(),
    lazyMode: true,
    revealedIds: new Set(LAZY_ROOT_IDS),
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

function hasPresetLayout(nodes) {
  return nodes.length > 0 && nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y));
}

export function createGraphApp(container, graphData, detailsPanel, onStatus) {
  registerCustomNodes();

  const filterState = createFilterState();
  let graph = null;
  let selectedItem = null;
  let renderErrorEl = null;

  const nodes = graphData.nodes.map(buildNodeModel);
  const edges = graphData.edges.map(buildEdgeModel);
  const usePresetLayout = hasPresetLayout(nodes);

  const neighborMap = new Map();
  edges.forEach((edge) => {
    if (!neighborMap.has(edge.source)) {
      neighborMap.set(edge.source, new Set());
    }
    if (!neighborMap.has(edge.target)) {
      neighborMap.set(edge.target, new Set());
    }
    neighborMap.get(edge.source).add(edge.target);
    neighborMap.get(edge.target).add(edge.source);
  });

  function showRenderError(message) {
    container.classList.remove("is-loading");
    if (!renderErrorEl) {
      renderErrorEl = document.getElementById("graph-error");
    }
    if (renderErrorEl) {
      renderErrorEl.textContent = message;
      renderErrorEl.classList.remove("hidden");
    }
    onStatus?.(`数据渲染错误：${message}`);
  }

  function isNodeVisible(model) {
    if (filterState.manuallyHiddenIds.has(model.id)) {
      return false;
    }
    if (filterState.lazyMode && !filterState.revealedIds.has(model.id)) {
      return false;
    }
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

  function applyRelationHighlight(visibleNodeIds) {
    if (!graph) {
      return;
    }

    const activeRelations = filterState.relationTypes;
    const hasRelationFilter = activeRelations.size > 0;

    if (!hasRelationFilter) {
      graph.getEdges().forEach((edge) => {
        if (edge.isVisible?.() === false) {
          return;
        }
        graph.clearItemStates(edge, ["highlight", "dim"]);
      });
      graph.getNodes().forEach((node) => {
        if (node.isVisible?.() === false) {
          return;
        }
        graph.clearItemStates(node, ["highlight", "dim"]);
      });
      return;
    }

    const highlightedNodeIds = new Set();

    graph.getEdges().forEach((edge) => {
      if (edge.isVisible?.() === false) {
        return;
      }
      const model = edge.getModel();
      const relation = model.relation || model.label;
      const matches = activeRelations.has(relation);

      graph.clearItemStates(edge, ["highlight", "dim"]);
      if (matches) {
        graph.setItemState(edge, "highlight", true);
        highlightedNodeIds.add(model.source);
        highlightedNodeIds.add(model.target);
      } else {
        graph.setItemState(edge, "dim", true);
      }
    });

    graph.getNodes().forEach((node) => {
      if (node.isVisible?.() === false) {
        return;
      }
      const nodeId = node.getID();
      graph.clearItemStates(node, ["highlight", "dim"]);
      if (highlightedNodeIds.has(nodeId)) {
        graph.setItemState(node, "highlight", true);
      } else if (visibleNodeIds.has(nodeId)) {
        graph.setItemState(node, "dim", true);
      }
    });
  }

  function applyPerformanceMode() {
    if (!graph) {
      return;
    }
    const zoom = graph.getZoom();
    const hideLabels = zoom < PERFORMANCE_ZOOM_THRESHOLD;

    graph.getNodes().forEach((node) => {
      const group = node.getContainer();
      const label = group.find((element) => element.get("name") === "label-shape");
      if (!label) {
        return;
      }
      const isDimmed = node.hasState("dim");
      label.attr("opacity", hideLabels || isDimmed ? (isDimmed ? 0.12 : 0) : 1);
    });
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
      selectedItem = null;
    }

    applyRelationHighlight(visibleNodeIds);
    applyPerformanceMode();
  }

  function clearSelectionHighlight() {
    if (!graph) {
      return;
    }
    selectedItem = null;
    applyFilters();
  }

  function highlightNeighborhood(centerNode) {
    selectedItem = centerNode;

    const centerId = centerNode.getID();
    const neighborIds = new Set([centerId]);

    graph.getEdges().forEach((edge) => {
      if (edge.isVisible?.() === false) {
        return;
      }
      const model = edge.getModel();
      if (model.source === centerId || model.target === centerId) {
        neighborIds.add(model.source);
        neighborIds.add(model.target);
        graph.setItemState(edge, "highlight", true);
        graph.clearItemStates(edge, ["dim"]);
      } else {
        graph.setItemState(edge, "dim", true);
        graph.clearItemStates(edge, ["highlight"]);
      }
    });

    graph.getNodes().forEach((node) => {
      if (node.isVisible?.() === false) {
        return;
      }
      if (neighborIds.has(node.getID())) {
        graph.setItemState(node, "highlight", true);
        graph.clearItemStates(node, ["dim"]);
      } else {
        graph.setItemState(node, "dim", true);
        graph.clearItemStates(node, ["highlight"]);
      }
    });

    applyPerformanceMode();
    detailsPanel.showNode(centerNode.getModel());
  }

  function highlightEdge(edge) {
    selectedItem = edge;

    const model = edge.getModel();
    graph.setItemState(edge, "highlight", true);
    graph.clearItemStates(edge, ["dim"]);

    graph.getNodes().forEach((node) => {
      if (node.isVisible?.() === false) {
        return;
      }
      const nodeId = node.getID();
      if (nodeId === model.source || nodeId === model.target) {
        graph.setItemState(node, "highlight", true);
        graph.clearItemStates(node, ["dim"]);
      } else {
        graph.setItemState(node, "dim", true);
        graph.clearItemStates(node, ["highlight"]);
      }
    });

    graph.getEdges().forEach((otherEdge) => {
      if (otherEdge.isVisible?.() === false) {
        return;
      }
      if (otherEdge.getID() !== edge.getID()) {
        graph.setItemState(otherEdge, "dim", true);
        graph.clearItemStates(otherEdge, ["highlight"]);
      }
    });

    applyPerformanceMode();
    detailsPanel.showEdge(model);
  }

  function expandNode(nodeId) {
    if (!filterState.lazyMode) {
      return;
    }
    filterState.revealedIds.add(nodeId);
    const neighbors = neighborMap.get(nodeId);
    if (neighbors) {
      neighbors.forEach((neighborId) => filterState.revealedIds.add(neighborId));
    }
    applyFilters();
  }

  function revealAllNodes() {
    filterState.lazyMode = false;
    filterState.revealedIds = new Set(nodes.map((node) => node.id));
    applyFilters();
    if (graph) {
      graph.fitView(FIT_VIEW_PADDING);
    }
    onStatus?.(`已展开全部 · ${graphData.stats.nodeCount} 个节点 · ${graphData.stats.edgeCount} 条边`);
  }

  function initGraph() {
    const { width, height } = getContainerSize(container);
    let layoutFinished = false;

    function finishLayout(reason) {
      if (layoutFinished || !graph || graph.get("destroyed")) {
        return;
      }
      layoutFinished = true;
      try {
        graph.fitView(FIT_VIEW_PADDING);
        if (typeof graph.fitCenter === "function") {
          graph.fitCenter();
        }
      } catch (fitError) {
        console.warn("fitView 失败", fitError);
      }
      applyFilters();
      onStatus?.(
        `${reason} · ${graphData.stats.nodeCount} 个节点 · ${graphData.stats.edgeCount} 条边 · 滚轮缩放 / 拖拽平移`,
      );
      container.classList.remove("is-loading");
    }

    const graphConfig = {
      container,
      width,
      height,
      fitView: false,
      animate: false,
      modes: {
        default: ["drag-canvas", "zoom-canvas", "drag-node", "drag-combo"],
      },
      defaultNode: {
        style: {
          fill: "#FFFFFF",
          stroke: "#5B8FF9",
          lineWidth: 2,
        },
        labelCfg: {
          style: {
            fill: "#333333",
            fontSize: 12,
          },
        },
      },
      defaultEdge: {
        type: "line",
        style: {
          stroke: "#A3B1BF",
          lineWidth: 1,
        },
        labelCfg: {
          autoRotate: true,
          style: {
            fill: "#666666",
            stroke: "#FFFFFF",
            lineWidth: 3,
          },
        },
      },
      defaultCombo: {
        type: "rect",
        style: {
          fillOpacity: 0.05,
          stroke: "#ccc",
          lineWidth: 1,
        },
        labelCfg: {
          position: "top",
          refY: 5,
          style: {
            fontSize: 16,
            fontWeight: "bold",
            fill: "#666666",
          },
        },
      },
    };

    if (!usePresetLayout) {
      graphConfig.layout = {
        type: "grid",
        preventOverlap: true,
        nodeSize: 40,
        workerEnabled: true,
        onLayoutEnd: () => finishLayout("网格布局完成"),
      };
    }

    graph = new G6.Graph(graphConfig);

    graph.node((node) => ({
      labelCfg: {
        position: "bottom",
        style: {
          fill: "#333333",
          fontSize: 10,
        },
      },
    }));

    graph.edge(() => ({
      style: {
        lineAppendWidth: 18,
      },
    }));

    graph.data({
      nodes,
      edges,
      combos: graphData.combos || [],
    });

    if (!usePresetLayout) {
      graph.on("afterlayout", () => finishLayout("布局完成"));
    }

    graph.on("node:click", (event) => {
      event.stopPropagation?.();
      const nodeId = event.item.getID();
      expandNode(nodeId);
      highlightNeighborhood(event.item);
    });

    graph.on("edge:click", (event) => {
      event.stopPropagation?.();
      highlightEdge(event.item);
    });

    graph.on("canvas:click", () => {
      clearSelectionHighlight();
      detailsPanel.showPlaceholder();
    });

    graph.on("viewportchange", applyPerformanceMode);
    graph.on("wheelzoom", applyPerformanceMode);

    window.addEventListener("resize", () => {
      if (!graph || graph.get("destroyed")) {
        return;
      }
      const nextSize = getContainerSize(container);
      graph.changeSize(nextSize.width, nextSize.height);
      graph.fitView(FIT_VIEW_PADDING);
    });

    onStatus?.(
      usePresetLayout
        ? "预设布局渲染中（跳过了力导向计算）..."
        : "网格布局计算中，请稍候...",
    );

    if (!usePresetLayout) {
      window.setTimeout(() => {
        if (layoutFinished || !graph || graph.get("destroyed")) {
          return;
        }
        if (typeof graph.stopLayout === "function") {
          graph.stopLayout();
        }
        finishLayout("布局超时，已强制显示");
      }, 10000);
    }

    requestAnimationFrame(() => {
      try {
        graph.render();
        if (usePresetLayout) {
          finishLayout("预设布局渲染完成");
        }
      } catch (error) {
        console.error("图谱渲染失败", error);
        showRenderError(error.message || "未知渲染错误");
      }
    });
  }

  function start() {
    return new Promise((resolve, reject) => {
      requestAnimationFrame(() => {
        try {
          initGraph();
          resolve();
        } catch (error) {
          showRenderError(error.message);
          reject(error);
        }
      });
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

  function bindRelationFilters(relationRoot) {
    if (!relationRoot) {
      return;
    }

    const syncRelationFilter = () => {
      const selected = [
        ...relationRoot.querySelectorAll("[data-filter-relation]:checked"),
      ].map((input) => input.value);
      filterState.relationTypes = new Set(selected);
      applyFilters();
    };

    relationRoot.querySelectorAll("[data-filter-relation]").forEach((input) => {
      input.addEventListener("change", syncRelationFilter);
    });

    relationRoot.querySelector("#relationSelectAll")?.addEventListener("click", () => {
      relationRoot.querySelectorAll("[data-filter-relation]").forEach((input) => {
        input.checked = true;
      });
      syncRelationFilter();
    });

    relationRoot.querySelector("#relationClearAll")?.addEventListener("click", () => {
      relationRoot.querySelectorAll("[data-filter-relation]").forEach((input) => {
        input.checked = false;
      });
      syncRelationFilter();
    });
  }

  function hideSpecificNode(nodeValue) {
    const value = String(nodeValue || "").trim();
    if (!value || !graph) {
      return false;
    }

    let itemToHide = graph.findById(value);
    if (!itemToHide) {
      itemToHide = graph.find("node", (node) => {
        const model = node.getModel();
        return model.label === value || model.displayLabel === value || model.name === value;
      });
    }

    if (!itemToHide) {
      return false;
    }

    filterState.manuallyHiddenIds.add(itemToHide.getID());
    applyFilters();
    return true;
  }

  function filterEdgeTypes(selectedRelations) {
    if (Array.isArray(selectedRelations)) {
      filterState.relationTypes = new Set(selectedRelations);
    } else if (selectedRelations === "all" || !selectedRelations) {
      filterState.relationTypes = new Set();
    } else {
      filterState.relationTypes = new Set([selectedRelations]);
    }
    applyFilters();
  }

  return {
    get graph() {
      return graph;
    },
    start,
    applyFilters,
    bindFilters,
    bindRelationFilters,
    clearHighlight: clearSelectionHighlight,
    hideSpecificNode,
    filterEdgeTypes,
    revealAllNodes,
  };
}
