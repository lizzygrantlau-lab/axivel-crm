# Graph Report - axivel-crm  (2026-11-19)

## Corpus Check
- 45 files · ~15,672 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .css 2, .example 1, (none) 1)

## Summary
- 421 nodes · 763 edges · 31 communities (21 shown, 10 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `88181d7a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.jsx
- online-server.mjs
- server.cjs
- axivel-schema.sql
- company-flow.cjs
- axivel-usuarios.sql
- App
- services
- axivel-verificacao.sql
- contact-view-model.cjs
- ContactEditor
- company-flow.cjs
- ApproachCompanyCard
- ApproachMessage
- AuthGate
- auth.cjs
- ApproachTask
- ReturnWaitDialog
- ContactDialog
- AGENTS.md
- DEPLOY-NETLIFY.md
- EXECUTAR-LOCAL.md
- crmFetch
- contact-view-model.js
- CompanyEditForm
- approach-stage-navigation.js
- ClientQualification
- netlify-runtime.sql
- TaskDeadline

## God Nodes (most connected - your core abstractions)
1. `App()` - 34 edges
2. `createTaskState()` - 17 edges
3. `crmFetch()` - 16 edges
4. `ApproachTask()` - 14 edges
5. `runtimeStore()` - 13 edges
6. `public.leads` - 12 edges
7. `CompanyProspectTask()` - 11 edges
8. `public.tarefas` - 11 edges
9. `CompanyEditForm()` - 10 edges
10. `CompanyRecord()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Publicação do Axivel CRM` --references--> `main()`  [INFERRED]
  DEPLOY-RENDER.md → scripts/seed-online.cjs
- `handler()` --calls--> `handleCrm()`  [EXTRACTED]
  netlify/tests/crm.test.mjs → netlify/functions/crm.mjs
- `handler()` --calls--> `runtimeStore()`  [EXTRACTED]
  netlify/functions/prazos.mjs → netlify/lib/runtime.mjs
- `database()` --calls--> `runtimeStore()`  [EXTRACTED]
  netlify/lib/runtime.test.mjs → netlify/lib/runtime.mjs
- `companyFlow()` --calls--> `createTaskState()`  [EXTRACTED]
  react-app/company-flow.cjs → react-app/task-flow.cjs

## Import Cycles
- None detected.

## Communities (31 total, 10 thin omitted)

### Community 0 - "app.jsx"
Cohesion: 0.11
Nodes (25): ActivityList(), activityStage(), activityTimestamp(), APP_VERSION, ApproachMessagePreview(), AuthContext, ClientCard(), commercialSituationLabel() (+17 more)

### Community 1 - "online-server.mjs"
Cohesion: 0.05
Nodes (39): config, handleAuthenticatedCrm(), handleCrm(), handler(), inputJson(), json(), config, handler() (+31 more)

### Community 2 - "server.cjs"
Cohesion: 0.08
Nodes (26): companyFlow(), tickCompanyFlows(), checkTasks(), envFile, fs, http, mime, onlineCrm (+18 more)

### Community 3 - "axivel-schema.sql"
Cohesion: 0.14
Nodes (30): analises_avaliador_idx, analises_lead_data_idx, etapas_responsavel_idx, historico_autor_idx, historico_lead_data_idx, leads_cidade_idx, leads_perfil_comercial_historico, leads_regiao_idx (+22 more)

### Community 4 - "company-flow.cjs"
Cohesion: 0.07
Nodes (23): Publicação do Axivel CRM, assert, end, fs, helpers, source, start, test (+15 more)

### Community 5 - "axivel-usuarios.sql"
Cohesion: 0.43
Nodes (5): crm_sessoes_expira_idx, crm_sessoes_usuario_idx, public.crm_login_limites, public.crm_sessoes, public.crm_usuarios

### Community 6 - "App"
Cohesion: 0.18
Nodes (15): App(), addTaskComment(), advance(), applyFlow(), createPostSale(), keepCompanyInFocus(), openCompanyTask(), openFocusedTask() (+7 more)

### Community 7 - "services"
Cohesion: 0.14
Nodes (13): key, sync, value, services, branch, buildCommand, envVars, healthCheckPath (+5 more)

### Community 9 - "contact-view-model.cjs"
Cohesion: 0.25
Nodes (12): buyerView(), flowContactView(), groupCommercialContacts(), normalizeCommercialContacts(), normalizePhone(), snapshot(), assert, {test} (+4 more)

### Community 10 - "ContactEditor"
Cohesion: 0.40
Nodes (4): ContactEditor(), cancel(), save(), ReopenPreviousButton()

### Community 11 - "company-flow.cjs"
Cohesion: 0.09
Nodes (26): assert, now(), send(), start(), {test}, authorizeTask(), {createHash}, flowTasks() (+18 more)

### Community 12 - "ApproachCompanyCard"
Cohesion: 0.20
Nodes (6): activityDateLabel(), ApproachCompanyCard(), ApproachNotes(), ExtendReturnDialog(), ReturnTask(), StageTask()

### Community 13 - "ApproachMessage"
Cohesion: 0.22
Nodes (8): ApproachMessage(), ApproachSend(), catalog(), confirm(), openWhatsApp(), buildApproachMessageV2(), commercialContactsForApproach(), shouldUpdateGeneratedMessage()

### Community 14 - "AuthGate"
Cohesion: 0.40
Nodes (3): AuthGate(), Brand(), LoginScreen()

### Community 15 - "auth.cjs"
Cohesion: 0.20
Nodes (15): authStore(), call(), login(), logout(), user(), digest(), fail(), normalizeLogin() (+7 more)

### Community 16 - "ApproachTask"
Cohesion: 0.33
Nodes (3): ApproachTask(), confirmedBuyerId(), confirmedBuyerSelection()

### Community 17 - "ReturnWaitDialog"
Cohesion: 0.60
Nodes (5): ReturnWaitDialog(), submit(), ScheduleWaitDialog(), submit(), suggestedBusinessDate()

### Community 23 - "crmFetch"
Cohesion: 0.18
Nodes (15): addActivity(), CompanyProspectTask(), advance(), apply(), sync(), update(), CompanyRecord(), start() (+7 more)

### Community 24 - "contact-view-model.js"
Cohesion: 0.54
Nodes (7): buyerView(), flowContactView(), groupCommercialContacts(), normalizeCommercialContacts(), normalizePhone(), snapshot(), text()

### Community 25 - "CompanyEditForm"
Cohesion: 0.17
Nodes (7): CompanyEditForm(), submit(), createBuyer(), NewCompanyForm(), payload(), submit(), OriginPicker()

### Community 26 - "approach-stage-navigation.js"
Cohesion: 0.52
Nodes (5): currentView(), select(), stages(), stateFor(), sync()

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `App()` connect `App` to `app.jsx`, `ApproachCompanyCard`, `AuthGate`, `ApproachTask`, `ReturnWaitDialog`, `crmFetch`, `ClientQualification`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `createTaskState()` (e.g. with `task-flow.cjs` and `tick()`) actually correct?**
  _`createTaskState()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `app.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10804597701149425 - nodes in this community are weakly interconnected._
- **Why does `createTaskState()` connect `company-flow.cjs` to `online-server.mjs`, `server.cjs`, `company-flow.cjs`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Should `online-server.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.052083333333333336 - nodes in this community are weakly interconnected._
- **Why does `runtimeStore()` connect `online-server.mjs` to `company-flow.cjs`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `server.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08080808080808081 - nodes in this community are weakly interconnected._