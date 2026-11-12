# Graph Report - axivel-crm  (2026-11-12)

## Corpus Check
- 36 files · ~10,276 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .css 2, .example 1, (none) 1)

## Summary
- 265 nodes · 470 edges · 17 communities (12 shown, 5 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1880ba44`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.jsx
- online-server.mjs
- server.cjs
- axivel-schema.sql
- company-flow.cjs
- task-flow.test.cjs
- App
- services
- axivel-verificacao.sql
- netlify-runtime.sql
- CompanyRecord
- CompanyProspectTask
- StageTask
- ResearchNotes
- ReturnTask
- ContactDialog
- TaskDeadline

## God Nodes (most connected - your core abstractions)
1. `App()` - 27 edges
2. `createTaskState()` - 17 edges
3. `runtimeStore()` - 12 edges
4. `CompanyProspectTask()` - 11 edges
5. `public.leads` - 11 edges
6. `public.tarefas` - 11 edges
7. `CompanyRecord()` - 10 edges
8. `companyFlow()` - 10 edges
9. `services` - 10 edges
10. `StageTask()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `database()` --calls--> `runtimeStore()`  [EXTRACTED]
  netlify/lib/runtime.test.mjs → netlify/lib/runtime.mjs
- `companyFlow()` --calls--> `createTaskState()`  [EXTRACTED]
  react-app/company-flow.cjs → react-app/task-flow.cjs
- `handler()` --calls--> `runtimeStore()`  [EXTRACTED]
  netlify/functions/prazos.mjs → netlify/lib/runtime.mjs
- `checkTasks()` --calls--> `tickCompanyFlows()`  [EXTRACTED]
  react-app/server.cjs → react-app/company-flow.cjs
- `fixture()` --calls--> `createSyncedTaskFlow()`  [EXTRACTED]
  react-app/synced-task-flow.test.cjs → react-app/synced-task-flow.cjs

## Import Cycles
- None detected.

## Communities (17 total, 5 thin omitted)

### Community 0 - "app.jsx"
Cohesion: 0.16
Nodes (17): ActivityList(), activityStage(), activityTimestamp(), APP_VERSION, Brand(), ClientCard(), Funnel(), History() (+9 more)

### Community 1 - "online-server.mjs"
Cohesion: 0.08
Nodes (24): config, handleCrm(), handler(), inputJson(), json(), config, handler(), runtimeStore() (+16 more)

### Community 2 - "server.cjs"
Cohesion: 0.08
Nodes (25): companyFlow(), tickCompanyFlows(), assert, {test}, checkTasks(), clientRoot, crmRoot, envFile (+17 more)

### Community 3 - "axivel-schema.sql"
Cohesion: 0.15
Nodes (28): analises_avaliador_idx, analises_lead_data_idx, etapas_responsavel_idx, historico_autor_idx, historico_lead_data_idx, leads_cidade_idx, leads_regiao_idx, leads_responsavel_idx (+20 more)

### Community 4 - "company-flow.cjs"
Cohesion: 0.10
Nodes (25): assert, now(), send(), start(), {test}, {createHash}, flowTasks(), initialFlow() (+17 more)

### Community 5 - "task-flow.test.cjs"
Cohesion: 0.11
Nodes (14): createTaskFlow(), assert, fixture(), fs, os, path, {test}, fs (+6 more)

### Community 6 - "App"
Cohesion: 0.18
Nodes (11): App(), addTaskComment(), advance(), applyFlow(), openCompanyTask(), openTask(), passTo(), saveDeadline() (+3 more)

### Community 7 - "services"
Cohesion: 0.14
Nodes (13): key, sync, value, services, branch, buildCommand, envVars, healthCheckPath (+5 more)

### Community 10 - "CompanyRecord"
Cohesion: 0.20
Nodes (5): ApproachCompanyCard(), CompanyAddresses(), CompanyContact(), CompanyEditForm(), CompanyRecord()

### Community 11 - "CompanyProspectTask"
Cohesion: 0.31
Nodes (6): ApproachTask(), CompanyProspectTask(), advance(), apply(), update(), ReturnWaitDialog()

### Community 12 - "StageTask"
Cohesion: 0.33
Nodes (4): activityDateLabel(), ApproachNotes(), ScheduleWaitDialog(), StageTask()

### Community 13 - "ResearchNotes"
Cohesion: 0.38
Nodes (5): OngoingProspect(), ProspectingCenter(), ResearchNotes(), blocks(), clean()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createTaskState()` connect `company-flow.cjs` to `online-server.mjs`, `server.cjs`, `task-flow.test.cjs`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `createTaskState()` (e.g. with `task-flow.cjs` and `tick()`) actually correct?**
  _`createTaskState()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `online-server.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.07897793263646923 - nodes in this community are weakly interconnected._
- **Why does `App()` connect `App` to `app.jsx`, `CompanyRecord`, `CompanyProspectTask`, `StageTask`, `ResearchNotes`, `ReturnTask`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `runtimeStore()` (e.g. with `read()` and `tasks()`) actually correct?**
  _`runtimeStore()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `server.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.07804878048780488 - nodes in this community are weakly interconnected._
- **Why does `runtimeStore()` connect `online-server.mjs` to `company-flow.cjs`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._