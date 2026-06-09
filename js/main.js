import { DATA_URL } from "./config.js";
import { createDetailsPanel } from "./details.js";
import { createGraphApp } from "./graph.js";

function flushUI() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function parseGraphDataInWorker(raw) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./js/dataWorker.js", { type: "module" });

    worker.onmessage = (event) => {
      worker.terminate();
      const payload = event.data;
      if (payload.type === "success") {
        resolve(payload);
      } else {
        const message = (payload.errors || ["数据处理失败"]).join("；");
        reject(new Error(message));
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };

    worker.postMessage(raw);
  });
}

function populateEdgeFilter(containerEl, edges) {
  if (!containerEl) {
    return;
  }

  const relationTypes = [...new Set(edges.map((edge) => edge.relation).filter(Boolean))].sort();
  const listEl = containerEl.querySelector("#edgeFilterList");
  if (!listEl) {
    return;
  }

  listEl.innerHTML = "";
  relationTypes.forEach((relation) => {
    const label = document.createElement("label");
    label.className = "relation-filter-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = relation;
    input.dataset.filterRelation = "";

    label.appendChild(input);
    label.appendChild(document.createTextNode(` ${relation}`));
    listEl.appendChild(label);
  });
}

function bindGraphControls(app) {
  const hideNodeInput = document.getElementById("hideNodeInput");
  const hideNodeBtn = document.getElementById("hideNodeBtn");
  const revealAllBtn = document.getElementById("revealAllBtn");

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

  revealAllBtn?.addEventListener("click", () => {
    app.revealAllNodes();
  });

  window.hideSpecificNode = () => {
    hideNodeBtn?.click();
  };

  window.filterEdgeTypes = () => {
    const relationRoot = document.getElementById("edgeFilterGroup");
    if (!relationRoot) {
      return;
    }
    const selected = [
      ...relationRoot.querySelectorAll("[data-filter-relation]:checked"),
    ].map((input) => input.value);
    app.filterEdgeTypes(selected);
  };
}

function showBootstrapError(statusEl, canvasEl, message) {
  canvasEl?.classList.remove("is-loading");
  if (statusEl) {
    statusEl.textContent = message;
  }
  const errorEl = document.getElementById("graph-error");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }
}

async function bootstrap() {
  const statusEl = document.querySelector("#status-bar");
  const canvasEl = document.querySelector("#graph-canvas");
  const filterRoot = document.querySelector("#filter-panel");
  const detailsRoot = document.querySelector("#details-panel");
  const edgeFilterGroup = document.querySelector("#edgeFilterGroup");

  if (window.location.protocol === "file:") {
    showBootstrapError(
      statusEl,
      canvasEl,
      "无法直接打开本地 HTML。请在 graph_viewer 目录运行 python3 serve.py，然后访问 http://127.0.0.1:8765/",
    );
    return;
  }

  if (typeof G6 === "undefined") {
    showBootstrapError(
      statusEl,
      canvasEl,
      "加载失败：G6 库未就绪，请刷新页面或检查 graph_viewer/vendor/g6.min.js",
    );
    return;
  }

  try {
    statusEl.textContent = "正在加载 data_base_add_graph.json ...";
    await flushUI();

    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    statusEl.textContent = "正在后台线程解析图谱数据...";
    await flushUI();

    const raw = await response.json();
    const workerResult = await parseGraphDataInWorker(raw);
    const graphData = workerResult.graphData;

    if (workerResult.warnings?.length) {
      console.warn("数据校验警告：", workerResult.warnings);
    }

    populateEdgeFilter(edgeFilterGroup, graphData.edges);
    const detailsPanel = createDetailsPanel(detailsRoot);
    canvasEl.classList.add("is-loading");

    statusEl.textContent = `数据已加载 · ${graphData.stats.nodeCount} 节点 · ${graphData.stats.edgeCount} 边 · 正在初始化画布...`;
    await flushUI();

    const app = createGraphApp(canvasEl, graphData, detailsPanel, (message) => {
      statusEl.textContent = message;
    });
    app.bindFilters(filterRoot);
    app.bindRelationFilters(edgeFilterGroup);
    bindGraphControls(app);
    await app.start();
  } catch (error) {
    showBootstrapError(
      statusEl,
      canvasEl,
      `加载失败：${error.message}。请在 graph_viewer 目录运行 python3 serve.py 后访问`,
    );
    console.error(error);
  }
}

bootstrap();
