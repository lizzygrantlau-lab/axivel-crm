# Publicação no Netlify

Importar o repositório `lizzygrantlau-lab/axivel-crm`, branch `main`, na conta Netlify escolhida pelo responsável (a decisão atual é usar a conta do Gustavo). A configuração é lida de `netlify.toml`:

- Diretório base: raiz do repositório.
- Build: `node scripts/build-netlify.cjs` (executa os testes antes de preparar a interface).
- Diretório de publicação: `netlify-public`.
- Functions: `netlify/functions`.
- Node: `24`.

Antes de cadastrar os segredos e liberar o CRM, configurar **Project configuration → General → Visitor access → Project visibility → Private → Production and previews**. A Laura acessará com o login Netlify da equipe proprietária. Essa proteção abrange a interface e as rotas das Functions. Conferir também a proteção na URL da publicação.

Cadastrar `SUPABASE_SECRET_KEY` como segredo no contexto de produção. No plano atual, os escopos Builds, Functions e Runtime são obrigatórios em conjunto; essa configuração foi autorizada pelo responsável. `SUPABASE_URL` contém somente o endereço público do projeto e pode ser uma variável comum de produção. A chave fica fora do GitHub e do JavaScript publicado. Não usar prefixos de variáveis públicas para a chave nem desativar a verificação de segredos.

As rotas `/api/crm/*` são atendidas pela Function `crm`; a função agendada `prazos` verifica os prazos a cada minuto na publicação de produção. Os cadastros e o estado das tarefas ficam no Supabase. A tabela privada `crm_runtime` já foi criada e inicializada com o estado do CRM; novas publicações não devem reinicializar esses dados.

Após publicar, conferir: acesso bloqueado sem login; Central de Prospecção com 37 empresas ativas; cadastro individual; estado de espera preservado; função agendada habilitada; e commit publicado igual ao commit da branch `main`. Confirmar que uma atualização posterior da branch gera nova publicação automática.

O projeto `axivel-crm` criado na equipe Luckmann Advocacia pode ser usado na conta do Gustavo. Antes de publicar, conferir a equipe proprietária e as pessoas com acesso; a Laura precisará ter acesso à equipe ou ao projeto protegido.

Endereço publicado: `https://axivel-crm.netlify.app/`. A publicação automática está vinculada à branch `main` do repositório da Laura. O acesso permanece privado pelo Netlify.
