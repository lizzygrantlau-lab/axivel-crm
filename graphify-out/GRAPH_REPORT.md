# Graph Report - axivel.crm  (2026-11-18)

## Corpus Check
- 41 files · ~14,740 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .example 1)

## Summary
- 566 nodes · 872 edges · 65 communities (57 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2bbb7da3`
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
- manifest.json
- ApproachNotes
- company-flow.cjs
- AGENTS.md
- ContactEditor
- AuthGate
- auth.cjs
- ApproachTask
- crmFetch
- ApproachMessage
- AGENTS.md
- DEPLOY-NETLIFY.md
- EXECUTAR-LOCAL.md
- NewCompanyForm
- .codex/hooks.json
- database/axivel-schema.sql
- database/axivel-verificacao.sql
- database/netlify-runtime.sql
- DEPLOY-NETLIFY.md
- DEPLOY-RENDER.md
- netlify/functions/crm.mjs
- netlify/functions/prazos.mjs
- netlify/lib/runtime.mjs
- netlify/lib/runtime.test.mjs
- netlify/tests/crm.test.mjs
- netlify/tests/post-sale.test.mjs
- .openai/hosting.json
- react-app/app.jsx
- react-app/approach-flow.test.cjs
- react-app/assets/axivel-ax-original.png
- react-app/assets/axivel-logo.svg
- react-app/company-flow.cjs
- react-app/company-flow.test.cjs
- react-app/index.html
- react-app/online-server.mjs
- react-app/online-server.test.mjs
- react-app/prospect-type.test.cjs
- react-app/return-options.test.cjs
- react-app/schedule-wait.test.cjs
- react-app/server.cjs
- react-app/stage-follow-up.test.cjs
- react-app/start-prospect.test.cjs
- react-app/supabase-prospects.cjs
- react-app/supabase-prospects.test.cjs
- react-app/synced-task-flow.cjs
- react-app/synced-task-flow.test.cjs
- react-app/task-flow.cjs
- react-app/task-flow.test.cjs
- render.yaml
- scripts/build-netlify.cjs
- scripts/seed-online.cjs
- ClientQualification
- netlify-runtime.sql
- NewCompanyForm
- TaskDeadline

## God Nodes (most connected - your core abstractions)
1. `App()` - 34 edges
2. `createTaskState()` - 17 edges
3. `crmFetch()` - 16 edges
4. `ApproachTask()` - 13 edges
5. `runtimeStore()` - 13 edges
6. `public.leads` - 12 edges
7. `CompanyProspectTask()` - 11 edges
8. `public.tarefas` - 11 edges
9. `CompanyRecord()` - 10 edges
10. `companyFlow()` - 10 edges

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

## Communities (65 total, 8 thin omitted)

### Community 0 - "app.jsx"
Cohesion: 0.10
Nodes (24): ActivityList(), activityStage(), activityTimestamp(), APP_VERSION, ApproachMessagePreview(), AuthContext, ClientCard(), commercialSituationLabel() (+16 more)

### Community 1 - "online-server.mjs"
Cohesion: 0.08
Nodes (26): config, handleAuthenticatedCrm(), handleCrm(), handler(), inputJson(), json(), config, handler() (+18 more)

### Community 2 - "server.cjs"
Cohesion: 0.09
Nodes (28): companyFlow(), tickCompanyFlows(), assert, {test}, checkTasks(), envFile, fs, http (+20 more)

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

### Community 9 - "manifest.json"
Cohesion: 0.40
Nodes (5): EXECUTAR-LOCAL.md, ast_hash, mtime, seen, semantic_hash

### Community 10 - "ApproachNotes"
Cohesion: 0.20
Nodes (6): activityDateLabel(), ApproachCompanyCard(), ApproachNotes(), ExtendReturnDialog(), ReturnTask(), StageTask()

### Community 11 - "company-flow.cjs"
Cohesion: 0.08
Nodes (28): assert, now(), send(), start(), {test}, authorizeTask(), {createHash}, flowTasks() (+20 more)

### Community 12 - "AGENTS.md"
Cohesion: 0.33
Nodes (5): AGENTS.md, ast_hash, mtime, seen, semantic_hash

### Community 13 - "ContactEditor"
Cohesion: 0.40
Nodes (4): ContactEditor(), cancel(), save(), ReopenPreviousButton()

### Community 14 - "AuthGate"
Cohesion: 0.40
Nodes (3): AuthGate(), Brand(), LoginScreen()

### Community 15 - "auth.cjs"
Cohesion: 0.20
Nodes (15): authStore(), call(), login(), logout(), user(), digest(), fail(), normalizeLogin() (+7 more)

### Community 16 - "ApproachTask"
Cohesion: 0.21
Nodes (8): ApproachTask(), confirmedBuyerId(), confirmedBuyerSelection(), ReturnWaitDialog(), submit(), ScheduleWaitDialog(), submit(), suggestedBusinessDate()

### Community 17 - "crmFetch"
Cohesion: 0.16
Nodes (12): addActivity(), CompanyEditForm(), submit(), CompanyProspectTask(), advance(), apply(), sync(), update() (+4 more)

### Community 18 - "ApproachMessage"
Cohesion: 0.24
Nodes (7): ApproachMessage(), ApproachSend(), catalog(), confirm(), openWhatsApp(), buildApproachMessageV2(), shouldUpdateGeneratedMessage()

### Community 22 - "NewCompanyForm"
Cohesion: 0.50
Nodes (3): NewCompanyForm(), payload(), submit()

### Community 23 - ".codex/hooks.json"
Cohesion: 0.40
Nodes (5): .codex/hooks.json, ast_hash, mtime, seen, semantic_hash

### Community 24 - "database/axivel-schema.sql"
Cohesion: 0.40
Nodes (5): database/axivel-schema.sql, ast_hash, mtime, seen, semantic_hash

### Community 25 - "database/axivel-verificacao.sql"
Cohesion: 0.40
Nodes (5): database/axivel-verificacao.sql, ast_hash, mtime, seen, semantic_hash

### Community 26 - "database/netlify-runtime.sql"
Cohesion: 0.40
Nodes (5): database/netlify-runtime.sql, ast_hash, mtime, seen, semantic_hash

### Community 27 - "DEPLOY-NETLIFY.md"
Cohesion: 0.40
Nodes (5): DEPLOY-NETLIFY.md, ast_hash, mtime, seen, semantic_hash

### Community 28 - "DEPLOY-RENDER.md"
Cohesion: 0.40
Nodes (5): DEPLOY-RENDER.md, ast_hash, mtime, seen, semantic_hash

### Community 29 - "netlify/functions/crm.mjs"
Cohesion: 0.40
Nodes (5): netlify/functions/crm.mjs, ast_hash, mtime, seen, semantic_hash

### Community 30 - "netlify/functions/prazos.mjs"
Cohesion: 0.40
Nodes (5): netlify/functions/prazos.mjs, ast_hash, mtime, seen, semantic_hash

### Community 31 - "netlify/lib/runtime.mjs"
Cohesion: 0.40
Nodes (5): netlify/lib/runtime.mjs, ast_hash, mtime, seen, semantic_hash

### Community 32 - "netlify/lib/runtime.test.mjs"
Cohesion: 0.40
Nodes (5): netlify/lib/runtime.test.mjs, ast_hash, mtime, seen, semantic_hash

### Community 33 - "netlify/tests/crm.test.mjs"
Cohesion: 0.40
Nodes (5): netlify/tests/crm.test.mjs, ast_hash, mtime, seen, semantic_hash

### Community 34 - "netlify/tests/post-sale.test.mjs"
Cohesion: 0.40
Nodes (5): netlify/tests/post-sale.test.mjs, ast_hash, mtime, seen, semantic_hash

### Community 35 - ".openai/hosting.json"
Cohesion: 0.40
Nodes (5): .openai/hosting.json, ast_hash, mtime, seen, semantic_hash

### Community 36 - "react-app/app.jsx"
Cohesion: 0.40
Nodes (5): react-app/app.jsx, ast_hash, mtime, seen, semantic_hash

### Community 37 - "react-app/approach-flow.test.cjs"
Cohesion: 0.40
Nodes (5): react-app/approach-flow.test.cjs, ast_hash, mtime, seen, semantic_hash

### Community 38 - "react-app/assets/axivel-ax-original.png"
Cohesion: 0.40
Nodes (5): react-app/assets/axivel-ax-original.png, ast_hash, mtime, seen, semantic_hash

### Community 39 - "react-app/assets/axivel-logo.svg"
Cohesion: 0.40
Nodes (5): react-app/assets/axivel-logo.svg, ast_hash, mtime, seen, semantic_hash

### Community 40 - "react-app/company-flow.cjs"
Cohesion: 0.40
Nodes (5): react-app/company-flow.cjs, ast_hash, mtime, seen, semantic_hash

### Community 41 - "react-app/company-flow.test.cjs"
Cohesion: 0.40
Nodes (5): react-app/company-flow.test.cjs, ast_hash, mtime, seen, semantic_hash

### Community 42 - "react-app/index.html"
Cohesion: 0.40
Nodes (5): react-app/index.html, ast_hash, mtime, seen, semantic_hash

### Community 43 - "react-app/online-server.mjs"
Cohesion: 0.40
Nodes (5): react-app/online-server.mjs, ast_hash, mtime, seen, semantic_hash

### Community 44 - "react-app/online-server.test.mjs"
Cohesion: 0.40
Nodes (5): react-app/online-server.test.mjs, ast_hash, mtime, seen, semantic_hash

### Community 45 - "react-app/prospect-type.test.cjs"
Cohesion: 0.40
Nodes (5): react-app/prospect-type.test.cjs, ast_hash, mtime, seen, semantic_hash

### Community 46 - "react-app/return-options.test.cjs"
Cohesion: 0.40
Nodes (5): react-app/return-options.test.cjs, ast_hash, mtime, seen, semantic_hash

### Community 47 - "react-app/schedule-wait.test.cjs"
Cohesion: 0.40
Nodes (5): react-app/schedule-wait.test.cjs, ast_hash, mtime, seen, semantic_hash

### Community 48 - "react-app/server.cjs"
Cohesion: 0.40
Nodes (5): react-app/server.cjs, ast_hash, mtime, seen, semantic_hash

### Community 49 - "react-app/stage-follow-up.test.cjs"
Cohesion: 0.40
Nodes (5): react-app/stage-follow-up.test.cjs, ast_hash, mtime, seen, semantic_hash

### Community 50 - "react-app/start-prospect.test.cjs"
Cohesion: 0.40
Nodes (5): react-app/start-prospect.test.cjs, ast_hash, mtime, seen, semantic_hash

### Community 51 - "react-app/supabase-prospects.cjs"
Cohesion: 0.40
Nodes (5): react-app/supabase-prospects.cjs, ast_hash, mtime, seen, semantic_hash

### Community 52 - "react-app/supabase-prospects.test.cjs"
Cohesion: 0.40
Nodes (5): react-app/supabase-prospects.test.cjs, ast_hash, mtime, seen, semantic_hash

### Community 53 - "react-app/synced-task-flow.cjs"
Cohesion: 0.40
Nodes (5): react-app/synced-task-flow.cjs, ast_hash, mtime, seen, semantic_hash

### Community 54 - "react-app/synced-task-flow.test.cjs"
Cohesion: 0.40
Nodes (5): react-app/synced-task-flow.test.cjs, ast_hash, mtime, seen, semantic_hash

### Community 55 - "react-app/task-flow.cjs"
Cohesion: 0.40
Nodes (5): react-app/task-flow.cjs, ast_hash, mtime, seen, semantic_hash

### Community 56 - "react-app/task-flow.test.cjs"
Cohesion: 0.40
Nodes (5): react-app/task-flow.test.cjs, ast_hash, mtime, seen, semantic_hash

### Community 57 - "render.yaml"
Cohesion: 0.40
Nodes (5): render.yaml, ast_hash, mtime, seen, semantic_hash

### Community 58 - "scripts/build-netlify.cjs"
Cohesion: 0.40
Nodes (5): scripts/build-netlify.cjs, ast_hash, mtime, seen, semantic_hash

### Community 59 - "scripts/seed-online.cjs"
Cohesion: 0.40
Nodes (5): scripts/seed-online.cjs, ast_hash, mtime, seen, semantic_hash

### Community 62 - "NewCompanyForm"
Cohesion: 0.31
Nodes (8): OngoingProspect(), ProspectingCenter(), resetCompany(), selectCategory(), prospectReturnOverdue(), ResearchNotes(), blocks(), clean()

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `App()` connect `App` to `app.jsx`, `ApproachNotes`, `AuthGate`, `ApproachTask`, `crmFetch`, `ClientQualification`, `NewCompanyForm`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `createTaskState()` (e.g. with `task-flow.cjs` and `tick()`) actually correct?**
  _`createTaskState()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `app.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10114942528735632 - nodes in this community are weakly interconnected._
- **Why does `createTaskState()` connect `company-flow.cjs` to `server.cjs`, `company-flow.cjs`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Should `online-server.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08282828282828283 - nodes in this community are weakly interconnected._
- **Why does `runtimeStore()` connect `online-server.mjs` to `company-flow.cjs`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Should `server.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08748615725359911 - nodes in this community are weakly interconnected._