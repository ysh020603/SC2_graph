import { parseGraphData, validateAndSanitizeGraphData, assignPresetLayout } from "./parser.js";

self.onmessage = (event) => {
  try {
    const raw = event.data;
    const graphData = parseGraphData(raw);
    const validation = validateAndSanitizeGraphData(raw, graphData);

    if (!validation.valid) {
      self.postMessage({
        type: "error",
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return;
    }

    assignPresetLayout(graphData);

    self.postMessage({
      type: "success",
      graphData,
      warnings: validation.warnings,
      stats: graphData.stats,
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      errors: [error?.message || "数据处理失败"],
      warnings: [],
    });
  }
};
