# iCantina Web

Painel web (somente leitura) de relatórios e histórico de refeições, alimentado
pelos mesmos dados do iCantina Desktop via Supabase.

## Telas

- `/login` — autenticação contra a tabela `users` do Supabase.
- `/dashboard` — cards de resumo + gráficos (tendência, distribuição por tipo, por cantina), com filtro de período.
- `/refeicoes` — lista de refeições em tempo (quase) real, atualizada a cada 4s via SSE.
- `/colaboradores` — lista com busca por nome; clique para ver o histórico individual com filtro de datas.
- `/relatorios` — filtro de data início/fim + cantina, com exportação para CSV.

## ⚠️ Segurança — leia antes de publicar

1. **Nunca exponha a `SUPABASE_SERVICE_ROLE_KEY` no navegador.** Ela só deve
   existir em variáveis de ambiente do servidor (Vercel → Project Settings →
   Environment Variables), sem o prefixo `NEXT_PUBLIC_`. Todo o acesso a dados
   neste projeto passa por Server Components / Route Handlers — o navegador
   nunca fala diretamente com o Supabase.
2. **Senhas já em bcrypt.** O app desktop grava a senha com
   `BCrypt.Net.BCrypt.HashPassword(...)`, que gera hashes bcrypt padrão
   (`$2a$`/`$2b$`), totalmente compatíveis com a biblioteca `bcryptjs`
   usada em `app/login/actions.ts`. Não é necessário nenhum passo extra de
   migração — o login web já compara a senha digitada contra o hash
   existente com `bcrypt.compare`.
3. **Ative o RLS nas tabelas do Supabase** (mesmo usando a service role key
   aqui) como camada extra de proteção, caso a `anon key` seja usada em outro
   lugar no futuro. Isso não afeta este projeto, que sempre usa a service role
   key e filtra `client_id` manualmente em cada query (veja `lib/queries.ts`).
4. Gere um `SESSION_SECRET` forte: `openssl rand -base64 32`.

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local
# edite .env.local com a Service Role Key e o SESSION_SECRET
npm run dev
```

Abra http://localhost:3000

## Deploy gratuito na Vercel (via GitHub)

1. Crie um repositório novo no GitHub e suba este projeto:
   ```bash
   git init
   git add .
   git commit -m "iCantina web inicial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/icantina-web.git
   git push -u origin main
   ```
2. Em https://vercel.com, clique em **Add New → Project**, importe o
   repositório do GitHub.
3. Em **Environment Variables**, adicione:
   - `SUPABASE_URL` = `https://uglbkfmjhyrvktkxjsiv.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (pegue em Supabase → Project Settings → API → `service_role`)
   - `SESSION_SECRET` = (string aleatória gerada com `openssl rand -base64 32`)
4. Clique em **Deploy**. A cada `git push` na branch `main`, a Vercel publica
   automaticamente uma nova versão.
5. O domínio gratuito será algo como `icantina-web.vercel.app` — você pode
   trocar o nome no painel da Vercel.

## Onde ajustar mapeamentos de dados

Toda a lógica de consulta está centralizada em `lib/queries.ts` — se o schema
do Supabase mudar (novos campos, novas tabelas), é o único arquivo que
normalmente precisa de ajuste.
