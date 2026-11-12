# Graph Report - axivel.crm  (2026-11-12)

## Corpus Check
- 36 files · ~10,866 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .css 2, .example 1, (none) 1)

## Summary
- 285 nodes · 501 edges · 22 communities (13 shown, 9 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7492f65b`
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
- ApproachNotes
- CompanyProspectTask
- ResearchNotes
- ContactEditor
- CompanyEditForm
- ReturnWaitDialog
- ClientQualification
- ContactDialog
- TaskDeadline
- AGENTS.md
- DEPLOY-NETLIFY.md
- EXECUTAR-LOCAL.md

## God Nodes (most connected - your core abstractions)
1. `App()` - 28 edges
2. `createTaskState()` - 17 edges
3. `runtimeStore()` - 12 edges
4. `public.leads` - 11 edges
5. `public.tarefas` - 11 edges
6. `CompanyProspectTask()` - 11 edges
7. `companyFlow()` - 10 edges
8. `services` - 10 edges
9. `ApproachNotes()` - 9 edges
10. `CompanyRecord()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Publicação do Axivel CRM` --references--> `main()`  [INFERRED]
  DEPLOY-RENDER.md → scripts/seed-online.cjs
- `handler()` --calls--> `runtimeStore()`  [EXTRACTED]
  netlify/functions/prazos.mjs → netlify/lib/runtime.mjs
- `database()` --calls--> `runtimeStore()`  [EXTRACTED]
  netlify/lib/runtime.test.mjs → netlify/lib/runtime.mjs
- `companyFlow()` --calls--> `createTaskState()`  [EXTRACTED]
  react-app/company-flow.cjs → react-app/task-flow.cjs
- `checkTasks()` --calls--> `tickCompanyFlows()`  [EXTRACTED]
  react-app/server.cjs → react-app/company-flow.cjs

## Import Cycles
- None detected.

## Communities (22 total, 9 thin omitted)

### Community 0 - "app.jsx"
Cohesion: 0.14
Nodes (20): ActivityList(), activityStage(), activityTimestamp(), APP_VERSION, Brand(), ClientCard(), CompanyAddresses(), CompanyContact() (+12 more)

### Community 1 - "online-server.mjs"
Cohesion: 0.06
Nodes (29): config, handleCrm(), handler(), inputJson(), json(), config, handler(), runtimeStore() (+21 more)

### Community 2 - "server.cjs"
Cohesion: 0.10
Nodes (21): companyFlow(), tickCompanyFlows(), assert, {test}, checkTasks(), envFile, fs, http (+13 more)

### Community 3 - "axivel-schema.sql"
Cohesion: 0.15
Nodes (28): analises_avaliador_idx, analises_lead_data_idx, etapas_responsavel_idx, historico_autor_idx, historico_lead_data_idx, leads_cidade_idx, leads_regiao_idx, leads_responsavel_idx (+20 more)

### Community 4 - "company-flow.cjs"
Cohesion: 0.12
Nodes (22): assert, now(), send(), start(), {test}, {createHash}, flowTasks(), initialFlow() (+14 more)

### Community 5 - "task-flow.test.cjs"
Cohesion: 0.10
Nodes (17): Publicação do Axivel CRM, createTaskFlow(), fs, assert, fixture(), fs, os, path (+9 more)

### Community 6 - "App"
Cohesion: 0.21
Nodes (12): App(), addTaskComment(), advance(), applyFlow(), createPostSale(), openCompanyTask(), openTask(), passTo() (+4 more)

### Community 7 - "services"
Cohesion: 0.14
Nodes (13): key, sync, value, services, branch, buildCommand, envVars, healthCheckPath (+5 more)

### Community 10 - "ApproachNotes"
Cohesion: 0.16
Nodes (8): activityDateLabel(), ApproachCompanyCard(), ApproachMessage(), ApproachNotes(), ApproachTask(), ExtendReturnDialog(), ReturnTask(), StageTask()

### Community 11 - "CompanyProspectTask"
Cohesion: 0.32
Nodes (5): CompanyProspectTask(), advance(), apply(), update(), CompanyRecord()

### Community 12 - "ResearchNotes"
Cohesion: 0.38
Nodes (5): OngoingProspect(), ProspectingCenter(), ResearchNotes(), blocks(), clean()

### Community 13 - "ContactEditor"
Cohesion: 0.40
Nodes (4): ContactEditor(), cancel(), save(), ReopenPreviousButton()

### Community 15 - "ReturnWaitDialog"
Cohesion: 0.60
Nodes (5): ReturnWaitDialog(), submit(), ScheduleWaitDialog(), submit(), suggestedBusinessDate()

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `App()` connect `App` to `app.jsx`, `ApproachNotes`, `CompanyProspectTask`, `ResearchNotes`, `ReturnWaitDialog`, `ClientQualification`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `createTaskState()` (e.g. with `task-flow.cjs` and `tick()`) actually correct?**
  _`createTaskState()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `app.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `createTaskState()` connect `company-flow.cjs` to `online-server.mjs`, `server.cjs`, `task-flow.test.cjs`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `runtimeStore()` (e.g. with `read()` and `tasks()`) actually correct?**
  _`runtimeStore()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `online-server.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.06095791001451379 - nodes in this community are weakly interconnected._
- **Why does `runtimeStore()` connect `online-server.mjs` to `company-flow.cjs`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._