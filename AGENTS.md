## graphify

On Windows in this project, invoke Graphify as `.\.graphify-venv\Scripts\graphify.exe` in place of `graphify` in the commands below.

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

## Segurança e preservação do CRM

- Nunca remover, desfazer ou modificar funcionalidades existentes sem autorização explícita.
- Solicitações de análise, investigação ou testes não autorizam alterações no código.
- “Não modificar código” significa preservar o estado atual; nunca restaurar versões anteriores.
- Antes de implementar mudanças, identificar os arquivos e funcionalidades afetados.
- Fazer somente a alteração solicitada, sem refatorações ou melhorias adicionais.
- Não restaurar arquivos inteiros ou versões antigas sem autorização.
- Preservar todas as funcionalidades aprovadas, incluindo os quatro indicadores da Central de Prospecção.
- Preservar os dados e históricos do Supabase. Nunca executar exclusões, migrações ou alterações nos dados reais sem autorização específica.
- Executar testes de regressão após cada implementação.
- Verificar o diff do Git antes e depois das alterações, garantindo que nenhuma mudança anterior seja perdida.
- Caso exista conflito entre uma nova solicitação e funcionalidades anteriores, interromper e pedir orientação.
- Trabalhar em etapas pequenas, aguardando autorização para avançar.
