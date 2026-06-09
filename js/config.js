/** Relation type → visualization layer mapping (from ontology source_layer). */
export const RELATION_LAYERS = {
  ability_requires_unit: "base",
  ability_requires_upgrade: "base",
  action_result: "base",
  has_ability: "base",
  researches: "inferred",
  unlocks_unit_ability: "inferred",
  morphs_into: "inferred",
  produces: "inferred",
  spawns: "inferred",
  grants_stat_bonus: "semantic",
  enables_morph: "semantic",
  hard_counters: "semantic",
  soft_counters: "semantic",
  synergizes_with: "semantic",
  garrisons_in: "semantic",
};

export const LAYER_LABELS = {
  base: "基础层 (Base)",
  inferred: "推理层 (Inferred)",
  semantic: "语义层 (Semantic)",
};

export const KIND_LABELS = {
  Ability: "技能 (Ability)",
  Unit: "单位 (Unit)",
  Upgrade: "科技 (Upgrade)",
};

export const RACE_LABELS = {
  Terran: "人族 (Terran)",
  Protoss: "神族 (Protoss)",
  Zerg: "虫族 (Zerg)",
};

/** Node size by entity kind. */
export const NODE_SIZE = {
  Unit: 44,
  Upgrade: 30,
  Ability: 20,
};

/** Fill colors per blueprint. */
export const COLORS = {
  Ability: "#F59E0B",
  Upgrade: "#9333EA",
  Unit: {
    Terran: "#1E40AF",
    Protoss: "#38BDF8",
    Zerg: "#312E81",
  },
};

/** Edge styles per layer. */
export const EDGE_STYLES = {
  base: {
    stroke: "#9CA3AF",
    lineWidth: 1.5,
    lineDash: null,
    arrowFill: "#9CA3AF",
  },
  inferred: {
    stroke: "#22C55E",
    lineWidth: 3,
    lineDash: [10, 6],
    arrowFill: "#22C55E",
  },
  semantic: {
    stroke: "#EF4444",
    lineWidth: 1.5,
    lineDash: [3, 5],
    arrowFill: "#EF4444",
  },
};

export const DATA_URL = "./data_base_add_graph.json";
