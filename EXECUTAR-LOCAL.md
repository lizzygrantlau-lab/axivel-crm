# Executar o CRM no computador

1. Instalar Node.js 24 e baixar este repositório.
2. Na raiz do projeto, criar `.env.local` com `SUPABASE_URL` e `SUPABASE_SECRET_KEY`, fornecidos pelo responsável pelo banco. Não enviar esse arquivo ao GitHub.
3. No terminal, a partir da raiz do projeto, executar `node react-app/server.cjs`.
4. Abrir `http://127.0.0.1:4173/` e manter o terminal aberto enquanto usar o CRM.

Os dois computadores precisam usar o mesmo projeto Supabase. A etapa atual, os responsáveis, prazos, espera pelo retorno, qualificação, comentários e tipo de prospecção das tarefas são compartilhados. A tela consulta as mudanças a cada dois segundos.

O estado compartilhado está na tabela privada `crm_runtime`, documento `CLI-0001/tasks`. Os arquivos locais antigos de tarefas são preservados, mas não são mais usados como fonte das tarefas. Não executar importações para sobrescrever o estado já salvo. Se a conexão falhar, a tela informa o erro e não salva uma cópia divergente localmente.

As notas comerciais avulsas e os registros de pós-venda do servidor local continuam nos arquivos locais; esta alteração sincroniza as tarefas. Os acontecimentos e comentários das tarefas ficam no estado compartilhado e aparecem no histórico.

Os prazos são processados enquanto pelo menos um servidor estiver rodando. Se ambos estiverem desligados, os vencimentos serão processados ao iniciar novamente. Na hospedagem Netlify, a função agendada pode fazer essa verificação sem os computadores ligados.
