# Graph Report - axivel-crm  (2026-11-13)

## Corpus Check
- 32 files · ~12,650 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .css 2, .example 1, (none) 1)

## Summary
- 309 nodes · 549 edges · 23 communities (14 shown, 9 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5dd18342`
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
- ResearchNotes
- ApproachMessage
- ContactEditor
- ContactDialog
- CompanyRecord
- CompanyProspectTask
- taskStateClass
- ReturnWaitDialog
- AGENTS.md
- DEPLOY-NETLIFY.md
- EXECUTAR-LOCAL.md
- TaskDeadline

## God Nodes (most connected - your core abstractions)
1. `App()` - 31 edges
2. `createTaskState()` - 17 edges
3. `runtimeStore()` - 12 edges
4. `public.leads` - 12 edges
5. `CompanyProspectTask()` - 11 edges
6. `public.tarefas` - 11 edges
7. `companyFlow()` - 10 edges
8. `services` - 10 edges
9. `StageTask()` - 9 edges
10. `ApproachNotes()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Publicação do Axivel CRM` --references--> `main()`  [INFERRED]
  DEPLOY-RENDER.md → scripts/seed-online.cjs
- `companyFlow()` --calls--> `createTaskState()`  [EXTRACTED]
  react-app/company-flow.cjs → react-app/task-flow.cjs
- `handler()` --calls--> `runtimeStore()`  [EXTRACTED]
  netlify/functions/prazos.mjs → netlify/lib/runtime.mjs
- `database()` --calls--> `runtimeStore()`  [EXTRACTED]
  netlify/lib/runtime.test.mjs → netlify/lib/runtime.mjs
- `checkTasks()` --calls--> `tickCompanyFlows()`  [EXTRACTED]
  react-app/server.cjs → react-app/company-flow.cjs

## Import Cycles
- None detected.

## Communities (23 total, 9 thin omitted)

### Community 0 - "app.jsx"
Cohesion: 0.17
Nodes (14): ActivityList(), activityStage(), activityTimestamp(), APP_VERSION, commercialSituationLabel(), CompanyAddresses(), CompanyContact(), CompanyReadonlyFields() (+6 more)

### Community 1 - "online-server.mjs"
Cohesion: 0.07
Nodes (27): config, handleCrm(), handler(), inputJson(), json(), config, handler(), runtimeStore() (+19 more)

### Community 2 - "server.cjs"
Cohesion: 0.12
Nodes (22): companyFlow(), tickCompanyFlows(), checkTasks(), envFile, fs, http, mime, onlineCrm (+14 more)

### Community 3 - "axivel-schema.sql"
Cohesion: 0.14
Nodes (30): analises_avaliador_idx, analises_lead_data_idx, etapas_responsavel_idx, historico_autor_idx, historico_lead_data_idx, leads_cidade_idx, leads_perfil_comercial_historico, leads_regiao_idx (+22 more)

### Community 4 - "company-flow.cjs"
Cohesion: 0.09
Nodes (27): assert, now(), send(), start(), {test}, {createHash}, flowTasks(), initialFlow() (+19 more)

### Community 5 - "task-flow.test.cjs"
Cohesion: 0.10
Nodes (16): Publicação do Axivel CRM, createTaskFlow(), assert, fixture(), fs, os, path, {test} (+8 more)

### Community 6 - "App"
Cohesion: 0.14
Nodes (16): App(), addTaskComment(), advance(), applyFlow(), createPostSale(), keepCompanyInFocus(), openCompanyTask(), openFocusedTask() (+8 more)

### Community 7 - "services"
Cohesion: 0.14
Nodes (13): key, sync, value, services, branch, buildCommand, envVars, healthCheckPath (+5 more)

### Community 10 - "ApproachNotes"
Cohesion: 0.20
Nodes (5): activityDateLabel(), ApproachCompanyCard(), ApproachNotes(), ApproachTask(), StageTask()

### Community 11 - "ResearchNotes"
Cohesion: 0.21
Nodes (10): NewCompanyForm(), payload(), submit(), OngoingProspect(), ProspectingCenter(), resetCompany(), selectCategory(), ResearchNotes() (+2 more)

### Community 13 - "ContactEditor"
Cohesion: 0.40
Nodes (4): ContactEditor(), cancel(), save(), ReopenPreviousButton()

### Community 16 - "CompanyProspectTask"
Cohesion: 0.28
Nodes (6): CompanyProspectTask(), advance(), apply(), update(), ExtendReturnDialog(), ReturnTask()

### Community 17 - "taskStateClass"
Cohesion: 0.25
Nodes (7): ApproachMessagePreview(), ClientCard(), Funnel(), Overview(), PostSale(), Tasks(), taskStateClass()

### Community 18 - "ReturnWaitDialog"
Cohesion: 0.60
Nodes (5): ReturnWaitDialog(), submit(), ScheduleWaitDialog(), submit(), suggestedBusinessDate()

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `App()` connect `App` to `app.jsx`, `ApproachNotes`, `ResearchNotes`, `CompanyRecord`, `CompanyProspectTask`, `taskStateClass`, `ReturnWaitDialog`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `createTaskState()` (e.g. with `task-flow.cjs` and `tick()`) actually correct?**
  _`createTaskState()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `online-server.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.06717687074829932 - nodes in this community are weakly interconnected._
- **Why does `createTaskState()` connect `company-flow.cjs` to `server.cjs`, `task-flow.test.cjs`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `runtimeStore()` (e.g. with `read()` and `tasks()`) actually correct?**
  _`runtimeStore()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `server.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._
- **Why does `runtimeStore()` connect `online-server.mjs` to `company-flow.cjs`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._