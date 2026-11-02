# Publicação do Axivel CRM

Criar um Web Service no Render conectado a `lizzygrantlau-lab/axivel-crm`, branch `main`. O arquivo `render.yaml` contém a configuração para o plano gratuito.

- Node: `24.14.1`.
- Build: `node --test react-app/*.test.cjs react-app/*.test.mjs netlify/lib/*.test.mjs netlify/tests/*.test.mjs`.
- Start: `node react-app/online-server.mjs`.
- Health check: `/healthz`.
- Segredos: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` e `CRM_PASSWORD` (pelo menos 12 caracteres, definida pelo responsável no painel).
- Login no CRM: usuário `laura` e a senha definida em `CRM_PASSWORD`.

O Render fornece `PORT` e `RENDER_EXTERNAL_URL`. Para testar o servidor online fora do Render, informar `CRM_PUBLIC_URL` e as demais variáveis no ambiente. O servidor local habitual continua sendo `node react-app/server.cjs`.

Os cadastros e o estado das tarefas ficam no Supabase. A tabela `crm_runtime` é privada, com acesso somente pelo servidor. `scripts/seed-online.cjs` inicializa o estado a partir dos arquivos locais sem sobrescrever documentos já existentes. Essa inicialização já foi executada no projeto Axivel.

O plano gratuito do Render pode dormir após 15 minutos sem acesso. Os prazos são verificados ao iniciar, durante o funcionamento e ao consultar as tarefas. Se o serviço estiver dormindo, prazos vencidos serão processados ao retornar. Para execução contínua, é necessário escolher um plano sem suspensão por inatividade.

Nunca publicar `.env.local`, chaves do Supabase ou arquivos de dados como recursos estáticos. O servidor online entrega somente os arquivos permitidos da interface e exige senha tanto para a interface quanto para as rotas de dados. A chave do Supabase não é enviada ao navegador.
