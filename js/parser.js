import { RELATION_LAYERS } from "./config.js";

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

  return { nodes, edges, stats: { nodeCount: nodes.length, edgeCount: edges.length } };
}
