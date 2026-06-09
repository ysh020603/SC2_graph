const KIND_INPUTS = [
  { kind: "Unit", inputId: "entityUnitInput", listId: "entityUnitList" },
  { kind: "Ability", inputId: "entityAbilityInput", listId: "entityAbilityList" },
  { kind: "Upgrade", inputId: "entityUpgradeInput", listId: "entityUpgradeList" },
];

function buildKindLookups(nodes) {
  const byKind = {
    Unit: { byId: new Map(), byLabel: new Map(), sorted: [] },
    Ability: { byId: new Map(), byLabel: new Map(), sorted: [] },
    Upgrade: { byId: new Map(), byLabel: new Map(), sorted: [] },
  };

  nodes.forEach((node) => {
    const bucket = byKind[node.kind];
    if (!bucket) {
      return;
    }
    bucket.byId.set(node.id, node);
    bucket.byLabel.set(node.label, node.id);
    if (node.name && node.name !== node.label) {
      bucket.byLabel.set(node.name, node.id);
    }
    bucket.sorted.push(node);
  });

  Object.values(byKind).forEach((bucket) => {
    bucket.sorted.sort((a, b) => a.label.localeCompare(b.label, "zh-CN"));
  });

  return byKind;
}

function populateDatalist(listEl, nodes) {
  if (!listEl) {
    return;
  }
  listEl.innerHTML = "";
  nodes.forEach((node) => {
    const option = document.createElement("option");
    option.value = node.label;
    option.label = node.id;
    listEl.appendChild(option);
  });
}

function resolveNodeId(value, kind, lookups) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return null;
  }

  const bucket = lookups[kind];
  if (!bucket) {
    return null;
  }

  if (bucket.byId.has(trimmed)) {
    return trimmed;
  }

  const canonicalId = `${kind}::${trimmed}`;
  if (bucket.byId.has(canonicalId)) {
    return canonicalId;
  }

  if (bucket.byLabel.has(trimmed)) {
    return bucket.byLabel.get(trimmed);
  }

  const lower = trimmed.toLowerCase();
  const fuzzy = bucket.sorted.find(
    (node) =>
      node.label.toLowerCase() === lower ||
      node.name?.toLowerCase() === lower ||
      node.id.toLowerCase() === lower,
  );
  return fuzzy?.id || null;
}

function collectSelectedNodeIds(lookups) {
  const nodeIds = [];
  const unresolved = [];

  KIND_INPUTS.forEach(({ kind, inputId }) => {
    const input = document.getElementById(inputId);
    const value = input?.value.trim();
    if (!value) {
      return;
    }
    const nodeId = resolveNodeId(value, kind, lookups);
    if (nodeId) {
      nodeIds.push(nodeId);
    } else {
      unresolved.push(value);
    }
  });

  return { nodeIds, unresolved };
}

function clearEntityInputs() {
  KIND_INPUTS.forEach(({ inputId }) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.value = "";
    }
  });
}

export function initQueryControls(graphData, app) {
  const lookups = buildKindLookups(graphData.nodes);

  KIND_INPUTS.forEach(({ kind, listId }) => {
    populateDatalist(document.getElementById(listId), lookups[kind].sorted);
  });

  const focusBtn = document.getElementById("entityFocusBtn");
  const resetBtn = document.getElementById("entityResetBtn");

  focusBtn?.addEventListener("click", () => {
    const { nodeIds, unresolved } = collectSelectedNodeIds(lookups);

    if (unresolved.length > 0) {
      window.alert(`未找到以下实体：${unresolved.join("、")}`);
      return;
    }

    if (nodeIds.length === 0) {
      window.alert("请至少在一个下拉框中选择或输入实体");
      return;
    }

    const result = app.highlightEntities(nodeIds);
    if (!result.ok) {
      window.alert(result.message || "定位失败");
    }
  });

  resetBtn?.addEventListener("click", () => {
    clearEntityInputs();
    app.resetEntityFocus();
  });

  KIND_INPUTS.forEach(({ inputId }) => {
    const input = document.getElementById(inputId);
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        focusBtn?.click();
      }
    });
  });
}
