import { DATA_URL } from "./config.js";
import { parseGraphData } from "./parser.js";
import { createDetailsPanel } from "./details.js";
import { createGraphApp } from "./graph.js";

function flushUI() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function populateEdgeFilter(selectEl, edges) {
  const relationTypes = [...new Set(edges.map((edge) => edge.relation).filter(Boolean))].sort();
  relationTypes.forEach((relation) => {
    const option = document.createElement("option");
    option.value = relation;
    option.textContent = relation;
    selectEl.appendChild(option);
  });
}

function bindGraphControls(app) {
  const hideNodeInput = document.getElementById("hideNodeInput");
  const hideNodeBtn = document.getElementById("hideNodeBtn");
  const edgeFilter = document.getElementById("edgeFilter");

  hideNodeBtn?.addEventListener("click", () => {
    const nodeValue = hideNodeInput?.value.trim();
    if (!nodeValue) {
      return;
    }

    if (app.hideSpecificNode(nodeValue)) {
      window.alert(`节点 [${nodeValue}] 已隐藏`);
      if (hideNodeInput) {
        hideNodeInput.value = "";
      }
    } else {
      window.alert("未找到该节点");
    }
  });

  hideNodeInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      hideNodeBtn?.click();
    }
  });

  edgeFilter?.addEventListener("change", () => {
    app.filterEdgeTypes(edgeFilter.value);
  });

  window.hideSpecificNode = () => {
    hideNodeBtn?.click();
  };

  window.filterEdgeTypes = () => {
    if (edgeFilter) {
      app.filterEdgeTypes(edgeFilter.value);
    }
  };
}

async function bootstrap() {
  const statusEl = document.querySelector("#status-bar");
  const canvasEl = document.querySelector("#graph-canvas");
  const filterRoot = document.querySelector("#filter-panel");
  const detailsRoot = document.querySelector("#details-panel");
  const edgeFilter = document.querySelector("#edgeFilter");

  if (window.location.protocol === "file:") {
    statusEl.textContent =
      "无法直接打开本地 HTML。请在 graph_viewer 目录运行 python3 serve.py，然后访问 http://127.0.0.1:8765/";
    return;
  }

  if (typeof G6 === "undefined") {
    statusEl.textContent = "加载失败：G6 库未就绪，请刷新页面或检查 graph_viewer/vendor/g6.min.js";
    return;
  }

  try {
    statusEl.textContent = "正在加载 data_base_add_graph.json ...";
    await flushUI();

    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    statusEl.textContent = "正在解析图谱数据...";
    await flushUI();

    const raw = await response.json();
    const graphData = parseGraphData(raw);
    populateEdgeFilter(edgeFilter, graphData.edges);
    const detailsPanel = createDetailsPanel(detailsRoot);
    canvasEl.classList.add("is-loading");

    statusEl.textContent = `数据已加载 · ${graphData.stats.nodeCount} 节点 · ${graphData.stats.edgeCount} 边 · 正在初始化画布...`;
    await flushUI();

    const app = createGraphApp(canvasEl, graphData, detailsPanel, (message) => {
      statusEl.textContent = message;
    });
    app.bindFilters(filterRoot);
    bindGraphControls(app);
    await app.start();
  } catch (error) {
    canvasEl?.classList.remove("is-loading");
    statusEl.textContent = `加载失败：${error.message}。请在 graph_viewer 目录运行 python3 serve.py 后访问`;
    console.error(error);
  }
}

bootstrap();
