import {
  COLORS,
  COMBO_CONFIG,
  COMBO_LAYOUT_CENTERS,
  GRID_NODE_SPACING,
  RELATION_LAYERS,
} from "./config.js";

const KINDS = ["Unit", "Ability", "Upgrade"];

function nodeId(kind, name) {
  return `${kind}::${name}`;
}

function resolveLayer(relationType) {
  return RELATION_LAYERS[relationType] || "inferred";
}

/**
 * Build G6 graph data directly from Unit / Ability / Upgrade arrays.
 * Every entity becomes a node; relations become directed edges.
 */
export function parseGraphData(raw) {
  const nodeIndex = new Map();
  const nodes = [];
  const edges = [];
  const edgeKeys = new Set();

  for (const kind of KINDS) {
    const items = raw[kind] || [];
    for (const item of items) {
      const id = nodeId(kind, item.name);
      if (nodeIndex.has(id)) {
        continue;
      }
      nodeIndex.set(id, { kind, name: item.name });
      nodes.push({
        id,
        kind,
        label: item.name,
        name: item.name,
        payload: { ...item, _kind: kind },
      });
    }
  }

  for (const kind of KINDS) {
    const items = raw[kind] || [];
    for (const item of items) {
      const source = nodeId(kind, item.name);
      for (const rel of item.relations || []) {
        const targetName = rel.object_name;
        let targetKind = null;
        for (const candidateKind of KINDS) {
          const exists = (raw[candidateKind] || []).some((entry) => entry.name === targetName);
          if (exists) {
            targetKind = candidateKind;
            break;
          }
        }
        if (!targetKind) {
          continue;
        }

        const target = nodeId(targetKind, targetName);
        const layer = resolveLayer(rel.relation);
        const edgeKey = `${source}|${rel.relation}|${target}`;
        if (edgeKeys.has(edgeKey)) {
          continue;
        }
        edgeKeys.add(edgeKey);

        edges.push({
          id: edgeKey,
          source,
          target,
          relation: rel.relation,
          layer,
          label: rel.relation,
          payload: { ...rel, layer, sourceKind: kind, targetKind },
        });
      }
    }
  }

  const graphData = {
    nodes,
    edges,
    stats: { nodeCount: nodes.length, edgeCount: edges.length },
  };

  assignCombos(graphData);
  return graphData;
}

/**
 * Validate raw input and sanitize graph data before feeding G6.
 * Removes dead edges and invalid coordinates to prevent white-screen crashes.
 */
export function validateAndSanitizeGraphData(raw, graphData) {
  const errors = [];
  const warnings = [];

  for (const kind of KINDS) {
    if (raw[kind] !== undefined && !Array.isArray(raw[kind])) {
      errors.push(`顶层字段 ${kind} 必须是数组`);
    }
  }

  if (!graphData.nodes.length) {
    errors.push("解析后节点数为 0，无法渲染图谱");
  }

  const nodeIds = new Set(graphData.nodes.map((node) => node.id));
  const validEdges = [];

  graphData.edges.forEach((edge) => {
    if (!edge.source || !edge.target) {
      warnings.push(`边 ${edge.id || "(未知)"} 缺少 source 或 target`);
      return;
    }
    if (!nodeIds.has(edge.source)) {
      warnings.push(`死边已剔除：源节点不存在 ${edge.source}`);
      return;
    }
    if (!nodeIds.has(edge.target)) {
      warnings.push(`死边已剔除：目标节点不存在 ${edge.target}`);
      return;
    }
    if (!edge.relation) {
      warnings.push(`边 ${edge.id} 缺少 relation 字段，已剔除`);
      return;
    }
    validEdges.push(edge);
  });

  graphData.edges = validEdges;
  graphData.stats.edgeCount = validEdges.length;

  graphData.nodes.forEach((node) => {
    if (node.x !== undefined && (!Number.isFinite(node.x) || Number.isNaN(node.x))) {
      delete node.x;
      delete node.y;
      warnings.push(`节点 ${node.id} 坐标无效，已移除`);
    }
    if (node.y !== undefined && (!Number.isFinite(node.y) || Number.isNaN(node.y))) {
      delete node.x;
      delete node.y;
      warnings.push(`节点 ${node.id} 坐标无效，已移除`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    graphData,
  };
}

/**
 * Pre-compute grid coordinates per combo so the frontend can skip force layout.
 */
export function assignPresetLayout(data) {
  const comboGroups = new Map();

  data.nodes.forEach((node) => {
    const comboId = node.comboId || "default";
    if (!comboGroups.has(comboId)) {
      comboGroups.set(comboId, []);
    }
    comboGroups.get(comboId).push(node);
  });

  comboGroups.forEach((nodes, comboId) => {
    const center = COMBO_LAYOUT_CENTERS[comboId] || { cx: 0, cy: 0 };
    const count = nodes.length;
    const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
    const spacing = GRID_NODE_SPACING;

    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      node.x = center.cx + (col - (cols - 1) / 2) * spacing;
      node.y = center.cy + row * spacing;
    });
  });

  return data;
}

/** Assign G6 combos and per-kind colors for ontology separation. */
export function assignCombos(data) {
  data.combos = Object.values(COMBO_CONFIG).map(({ id, label }) => ({ id, label }));

  data.nodes.forEach((node) => {
    const combo = COMBO_CONFIG[node.kind];
    if (combo) {
      node.comboId = combo.id;
    }

    const fill = COLORS[node.kind] || "#FFFFFF";
    node.style = {
      fill,
      stroke: fill,
    };
  });

  return data;
}
