# Entity Ontology and Relations in `data_base_add_graph.json`

`data_base_add_graph.json` defines a StarCraft II knowledge graph with **three entity types** and **fifteen directed relations** between them (**3,023** edges in total). Each relation edge carries a `description` explaining what that link means.

Relations are directed: **Subject → Object**.

---

## Entity Types

### Unit

Combat units, workers, structures, and their morph variants (e.g. `Colossus`, `CommandCenter`, `BarracksTechLab`).

### Ability

In-game actions and commands (e.g. `MOVE_MOVE`, `MORPH_LIBERATORAGMODE`, `NEXUSTRAINMOTHERSHIP_MOTHERSHIP`).

### Upgrade

Researchable technologies and passive unlocks (e.g. `Stimpack`, `TunnelingClaws`, `ChitinousPlating`).

---

## Relations

| Relation | Subject → Object | Count | Description |
|----------|------------------|------:|-------------|
| `has_ability` | Unit → Ability | 1,078 | Unit A has Ability B in its available ability list. |
| `action_result` | Ability → Unit / Upgrade | 326 | Ability A produces, transforms into, or researches Unit/Upgrade B when executed. |
| `ability_requires_unit` | Ability → Unit | 126 | Ability A requires Unit B as a prerequisite or attached production context. |
| `ability_requires_upgrade` | Ability → Upgrade | 60 | Ability A requires Upgrade B as a prerequisite. |
| `produces` | Unit → Unit | 108 | Unit A directly creates Unit B through a Train/Build style Ability. |
| `morphs_into` | Unit → Unit | 123 | Unit A transforms, morphs, lands/lifts, burrows, or switches mode into Unit B. |
| `spawns` | Unit → Unit | 47 | Unit A creates temporary or summoned Unit B. |
| `researches` | Unit → Upgrade | 105 | Unit A can research Upgrade B through a Research Ability. |
| `unlocks_unit_ability` | Upgrade → Unit | 61 | Upgrade A unlocks a new available Ability for Unit B. |
| `grants_stat_bonus` | Upgrade → Unit | 207 | Upgrade A permanently improves stats of Unit B. |
| `enables_morph` | Upgrade → Unit | 15 | Upgrade A enables Unit B to transform or change functional form. |
| `hard_counters` | Unit → Unit | 205 | Unit A has explicit bonus damage or a decisive direct counter against Unit B. |
| `soft_counters` | Unit → Unit | 311 | Unit A pressures Unit B through range, mobility, AoE, or tactical profile. |
| `synergizes_with` | Unit → Unit | 223 | Unit A and Unit B work especially well together. |
| `garrisons_in` | Unit → Unit | 28 | Unit A can enter or be sheltered inside Unit B. |

---

## Entity-Type Connection Matrix

Row = subject type, column = object type.

|  | → Unit | → Ability | → Upgrade |
|--|--------|-----------|-----------|
| **Unit →** | `produces`, `morphs_into`, `spawns`, `hard_counters`, `soft_counters`, `synergizes_with`, `garrisons_in` | `has_ability` | `researches` |
| **Ability →** | `action_result`, `ability_requires_unit` | — | `action_result`, `ability_requires_upgrade` |
| **Upgrade →** | `grants_stat_bonus`, `enables_morph`, `unlocks_unit_ability` | — | — |
