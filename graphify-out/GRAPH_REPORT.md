# Graph Report - axivel-crm  (2026-11-15)

## Corpus Check
- 48 files · ~142,021 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .css 2, .example 1, (none) 1)

## Summary
- 378 nodes · 682 edges · 24 communities (16 shown, 8 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9b6d874f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.jsx
- online-server.mjs
- server.cjs
- axivel-schema.sql
- company-flow.cjs
- import-company-contacts.cjs
- App
- services
- axivel-verificacao.sql
- import-branch-notes.cjs
- ApproachNotes
- ApproachCompanyCard
- ContactEditor
- ContactDialog
- auth.cjs
- CompanyProspectTask
- CompanyProspectTask
- ApproachMessage
- AGENTS.md
- DEPLOY-NETLIFY.md
- EXECUTAR-LOCAL.md
- TaskDeadline
- AuthGate

## God Nodes (most connected - your core abstractions)
1. `App()` - 33 edges
2. `createTaskState()` - 17 edges
3. `crmFetch()` - 16 edges
4. `runtimeStore()` - 13 edges
5. `public.leads` - 12 edges
6. `CompanyProspectTask()` - 11 edges
7. `public.tarefas` - 11 edges
8. `companyFlow()` - 10 edges
9. `ApproachTask()` - 10 edges
10. `CompanyRecord()` - 10 edges

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

## Communities (24 total, 8 thin omitted)

### Community 0 - "app.jsx"
Cohesion: 0.12
Nodes (24): ActivityList(), activityStage(), activityTimestamp(), APP_VERSION, ApproachMessagePreview(), AuthContext, ClientCard(), commercialSituationLabel() (+16 more)

### Community 1 - "online-server.mjs"
Cohesion: 0.07
Nodes (28): config, handleAuthenticatedCrm(), handleCrm(), handler(), inputJson(), json(), config, handler() (+20 more)

### Community 2 - "server.cjs"
Cohesion: 0.10
Nodes (25): companyFlow(), tickCompanyFlows(), checkTasks(), envFile, fs, http, mime, onlineCrm (+17 more)

### Community 3 - "axivel-schema.sql"
Cohesion: 0.14
Nodes (30): analises_avaliador_idx, analises_lead_data_idx, etapas_responsavel_idx, historico_autor_idx, historico_lead_data_idx, leads_cidade_idx, leads_perfil_comercial_historico, leads_regiao_idx (+22 more)

### Community 4 - "company-flow.cjs"
Cohesion: 0.08
Nodes (28): assert, now(), send(), start(), {test}, authorizeTask(), {createHash}, flowTasks() (+20 more)

### Community 5 - "import-company-contacts.cjs"
Cohesion: 0.06
Nodes (31): addresses(), api(), contacts(), crypto, fs, headers, {isDeepStrictEqual}, main() (+23 more)

### Community 6 - "App"
Cohesion: 0.09
Nodes (27): App(), addActivity(), addTaskComment(), advance(), applyFlow(), createPostSale(), keepCompanyInFocus(), openCompanyTask() (+19 more)

### Community 7 - "services"
Cohesion: 0.14
Nodes (13): key, sync, value, services, branch, buildCommand, envVars, healthCheckPath (+5 more)

### Community 9 - "import-branch-notes.cjs"
Cohesion: 0.16
Nodes (13): api(), clean(), crypto, fs, headers, main(), original, path (+5 more)

### Community 10 - "ApproachNotes"
Cohesion: 0.40
Nodes (3): activityDateLabel(), ApproachNotes(), StageTask()

### Community 11 - "ApproachCompanyCard"
Cohesion: 0.40
Nodes (4): ApproachCompanyCard(), ResearchNotes(), blocks(), clean()

### Community 13 - "ContactEditor"
Cohesion: 0.40
Nodes (4): ContactEditor(), cancel(), save(), ReopenPreviousButton()

### Community 15 - "auth.cjs"
Cohesion: 0.20
Nodes (15): authStore(), call(), login(), logout(), user(), digest(), fail(), normalizeLogin() (+7 more)

### Community 16 - "CompanyProspectTask"
Cohesion: 0.28
Nodes (6): ApproachTask(), ReturnWaitDialog(), submit(), ScheduleWaitDialog(), submit(), suggestedBusinessDate()

### Community 17 - "CompanyProspectTask"
Cohesion: 0.28
Nodes (7): CompanyProspectTask(), advance(), apply(), sync(), update(), ExtendReturnDialog(), ReturnTask()

### Community 23 - "AuthGate"
Cohesion: 0.40
Nodes (3): AuthGate(), Brand(), LoginScreen()

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `App()` connect `App` to `app.jsx`, `ApproachNotes`, `CompanyProspectTask`, `CompanyProspectTask`, `AuthGate`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `createTaskState()` (e.g. with `task-flow.cjs` and `tick()`) actually correct?**
  _`createTaskState()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `app.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1164021164021164 - nodes in this community are weakly interconnected._
- **Why does `createTaskState()` connect `company-flow.cjs` to `server.cjs`, `import-company-contacts.cjs`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `online-server.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.07397959183673469 - nodes in this community are weakly interconnected._
- **Why does `runtimeStore()` connect `online-server.mjs` to `company-flow.cjs`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `server.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.09957325746799431 - nodes in this community are weakly interconnected._