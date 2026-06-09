import { KIND_LABELS, LAYER_LABELS } from "./config.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "—";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "—";
    }
    if (typeof value[0] === "object") {
      return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
    }
    return escapeHtml(value.join(", "));
  }
  if (typeof value === "object") {
    return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
  }
  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }
  return escapeHtml(value);
}

function row(label, value) {
  return `<tr><th>${escapeHtml(label)}</th><td>${formatValue(value)}</td></tr>`;
}

function renderTable(title, rows) {
  return `
    <div class="panel-section">
      <h3>${escapeHtml(title)}</h3>
      <table class="detail-table">${rows.join("")}</table>
    </div>
  `;
}

function renderUnit(payload) {
  const weapons = payload.weapons || [];
  const weaponSummary = weapons.length
    ? weapons
        .map((weapon) => {
          const parts = [weapon.name || "Weapon"];
          if (weapon.damage_per_hit != null) {
            parts.push(`damage=${weapon.damage_per_hit}`);
          }
          if (weapon.range != null) {
            parts.push(`range=${weapon.range}`);
          }
          return parts.join(", ");
        })
        .join(" | ")
    : "—";

  return renderTable("单位详情", [
    row("名称", payload.name),
    row("类型", KIND_LABELS.Unit),
    row("种族", payload.race),
    row("生命值 (max_health)", payload.max_health),
    row("护盾 (max_shield)", payload.max_shield),
    row("护甲 (armor)", payload.armor),
    row("矿物 (minerals)", payload.minerals),
    row("瓦斯 (gas)", payload.gas),
    row("人口 (supply)", payload.supply),
    row("视野 (sight)", payload.sight),
    row("速度 (speed)", payload.speed),
    row("武器 (weapons)", weaponSummary),
    row("属性 (attributes)", payload.attributes),
    row("是否建筑", payload.is_structure),
    row("是否飞行", payload.is_flying),
  ]);
}

function renderAbility(payload) {
  return renderTable("技能详情", [
    row("名称", payload.name),
    row("类型", KIND_LABELS.Ability),
    row("施法距离 (cast_range)", payload.cast_range),
    row("能量消耗 (energy_cost)", payload.energy_cost),
    row("冷却 (cooldown)", payload.cooldown),
    row("目标 (target)", payload.target),
    row("允许小地图", payload.allow_minimap),
    row("允许自动施法", payload.allow_autocast),
    row("效果 (effect)", payload.effect),
    row("Buff", payload.buff),
    row("描述 (description)", payload.description),
  ]);
}

function renderUpgrade(payload) {
  const cost = payload.cost || {};
  return renderTable("科技详情", [
    row("名称", payload.name),
    row("类型", KIND_LABELS.Upgrade),
    row("矿物 (minerals)", cost.minerals),
    row("瓦斯 (gas)", cost.gas),
    row("耗时 (time)", cost.time),
    row("描述 (description)", payload.description),
  ]);
}

function renderNode(model) {
  const payload = model.payload || {};
  const kind = model.kind || payload._kind;
  if (kind === "Unit") {
    return renderUnit(payload);
  }
  if (kind === "Ability") {
    return renderAbility(payload);
  }
  if (kind === "Upgrade") {
    return renderUpgrade(payload);
  }
  return renderTable("节点详情", [row("名称", model.label)]);
}

function renderEdge(model) {
  const payload = model.payload || {};
  const layerLabel = LAYER_LABELS[payload.layer] || payload.layer;
  const relationLine = `${payload.subject_name} → (${payload.relation}) → ${payload.object_name}`;

  return `
    ${renderTable("关系详情", [
      row("关系动作", relationLine),
      row("关系类型", payload.relation),
      row("关系层级", layerLabel),
      row("起点", payload.subject_name),
      row("终点", payload.object_name),
    ])}
    <div class="panel-section">
      <h3>详细描述</h3>
      <p class="edge-description">${escapeHtml(payload.description || "暂无描述")}</p>
    </div>
  `;
}

export function createDetailsPanel(root) {
  const titleEl = root.querySelector("#details-title");
  const contentEl = root.querySelector("#details-content");

  function showPlaceholder() {
    titleEl.textContent = "详情面板";
    contentEl.innerHTML =
      '<p class="placeholder">点击节点查看实体属性，或点击连线查看关系描述。</p>';
  }

  function showNode(model) {
    titleEl.textContent = model.label || model.name;
    contentEl.innerHTML = renderNode(model);
  }

  function showEdge(model) {
    titleEl.textContent = model.relation || "关系";
    contentEl.innerHTML = renderEdge(model);
  }

  showPlaceholder();

  return { showPlaceholder, showNode, showEdge };
}
