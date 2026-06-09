import { DATA_URL } from "./config.js";
import { parseGraphData } from "./parser.js";
import { createDetailsPanel } from "./details.js";
import { createGraphApp } from "./graph.js";

async function bootstrap() {
  const statusEl = document.querySelector("#status-bar");
  const canvasEl = document.querySelector("#graph-canvas");
  const filterRoot = document.querySelector("#filter-panel");
  const detailsRoot = document.querySelector("#details-panel");

  statusEl.textContent = "正在加载 data_base_add_graph.json ...";

  if (typeof G6 === "undefined") {
    statusEl.textContent = "加载失败：G6 库未就绪，请刷新页面或检查 graph_viewer/vendor/g6.min.js";
    return;
  }

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const raw = await response.json();
    const graphData = parseGraphData(raw);
    const detailsPanel = createDetailsPanel(detailsRoot);
    canvasEl.classList.add("is-loading");
    const app = createGraphApp(canvasEl, graphData, detailsPanel, (message) => {
      statusEl.textContent = message;
    });
    app.bindFilters(filterRoot);
  } catch (error) {
    statusEl.textContent = `加载失败：${error.message}。请在 graph_viewer 目录运行 python3 serve.py 后访问`;
    console.error(error);
  }
}

bootstrap();
