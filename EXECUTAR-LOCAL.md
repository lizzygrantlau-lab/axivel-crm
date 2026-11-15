# Executar o CRM no computador

1. Instalar Node.js 24 e baixar este repositório.
2. Na raiz do projeto, criar `.env.local` com `SUPABASE_URL` e `SUPABASE_SECRET_KEY`, fornecidos pelo responsável pelo banco. Não enviar esse arquivo ao GitHub.
3. No terminal, a partir da raiz do projeto, executar `node react-app/server.cjs`.
4. Abrir `http://127.0.0.1:4173/` e manter o terminal aberto enquanto usar o CRM.

Os dois computadores precisam usar o mesmo projeto Supabase. A etapa atual, os responsáveis, prazos, espera pelo retorno, qualificação, comentários e tipo de prospecção das tarefas são compartilhados. A tela consulta as mudanças a cada dois segundos.

O estado compartilhado da F4 está na tabela privada `crm_runtime`, incluindo ficha, tarefas, notas e pós-venda. Se a conexão falhar, a tela informa o erro e não salva uma cópia divergente localmente.

Os acontecimentos e comentários das tarefas ficam no estado compartilhado e aparecem no histórico. No pós-venda, use “Salvar acompanhamento” depois de alterar o estado ou as observações.

Os prazos são processados enquanto pelo menos um servidor estiver rodando. Se ambos estiverem desligados, os vencimentos serão processados ao iniciar novamente. Na hospedagem Netlify, a função agendada pode fazer essa verificação sem os computadores ligados.

## Acesso da equipe

O CRM exige uma conta individual, guardada no Supabase nas tabelas `crm_usuarios` e `crm_sessoes`.
As senhas são verificadas no servidor por hash scrypt; o navegador recebe apenas um cookie de sessão HttpOnly.
As tabelas de acesso e a função de limitação de tentativas são criadas por `database/axivel-usuarios.sql`.
Nenhuma senha inicial ou chave do banco deve ser incluída no repositório.

“Minhas tarefas” mostra as tarefas do usuário conectado. Somente o responsável atual pode alterar a etapa.
Novas ações e comentários guardam o identificador e o nome do autor autenticado; ações automáticas continuam sem autor humano.
O login Samantha corresponde à responsável Samanta já existente no fluxo.
Use “Sair” ao terminar. A sessão expira no servidor em até 12 horas e o cookie não é persistente.
