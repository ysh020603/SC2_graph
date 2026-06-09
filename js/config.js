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

/** Fill colors per entity kind (light theme). */
export const COLORS = {
  Ability: "#5AD8A6",
  Upgrade: "#F6BD16",
  Unit: "#5B8FF9",
};

/** Combo ids and labels for ontology separation. */
export const COMBO_CONFIG = {
  Unit: { id: "combo-unit", label: "单 位 (Units)" },
  Ability: { id: "combo-skill", label: "技 能 (Skills)" },
  Upgrade: { id: "combo-tech", label: "科 技 (Tech)" },
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

/** Lazy-load entry nodes: one base structure per race. */
export const LAZY_ROOT_IDS = ["Unit::CommandCenter", "Unit::Nexus", "Unit::Hatchery"];

/** Hide node labels when zoom is below this threshold. */
export const PERFORMANCE_ZOOM_THRESHOLD = 0.45;

export const FIT_VIEW_PADDING = 40;

/** Preset layout: combo sector centers for grid placement. */
export const COMBO_LAYOUT_CENTERS = {
  "combo-unit": { cx: 0, cy: -420 },
  "combo-skill": { cx: -460, cy: 320 },
  "combo-tech": { cx: 460, cy: 320 },
};

export const GRID_NODE_SPACING = 72;
