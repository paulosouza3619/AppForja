# Forja

Aplicativo de desenvolvimento pessoal com ciclos de 30 dias, prioridades diárias e ferramentas de acompanhamento. A versão de produção é um app Next.js. O monolito antigo saiu deste deploy; o conteúdo dele continua no histórico do Git.

## O que falta para publicar

A landing de venda é outro projeto (Vite) e só manda o visitante para o checkout da Hotmart. Este repositório é o app: login, webhook e liberação da assinatura.

- [ ] Liberar o acesso à Vercel deste repositório.
- [ ] Liberar o acesso ao projeto Supabase.
- [ ] No SQL Editor do Supabase, executar [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
- [ ] Em Authentication → URL Configuration, colocar a URL do site e `https://SEU_DOMINIO/auth/callback` como redirect.
- [ ] Comprar o domínio.
- [ ] Adicionar o domínio na Vercel, no projeto deste app.
- [ ] Na Vercel, preencher `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `HOTMART_HOTTOK`, `HOTMART_PRODUCT_ID`, `HOTMART_CHECKOUT_URL` e `BILLING_ALLOW_OVERDUE`.
- [ ] No painel da Hotmart, criar o webhook versão 2.0.0 para `https://SEU_DOMINIO/api/webhooks/hotmart`, com o header `X-HOTMART-HOTTOK`.
- [ ] Copiar o token para `HOTMART_HOTTOK` e o id numérico do produto para `HOTMART_PRODUCT_ID`. O código `P108444964Q` da URL de pagamento não é esse id.
- [ ] Na landing Vite, definir `VITE_APP_URL` com o domínio deste app. O link “Já assinei” abre `/signup`.
- [ ] Fazer uma compra de teste com o mesmo e-mail da conta e conferir a linha em `entitlements`.
- [ ] Só então ligar `BILLING_ENFORCED=true`. Enquanto estiver `false`, qualquer usuário logado entra.

## O que o visitante vê

- Sem conta: apenas a landing page.
- Com conta e sem assinatura ativa: tela de acesso bloqueado, com o link de compra da Hotmart.
- Com assinatura ativa: o aplicativo completo (ciclo, ferramentas, histórico e sincronização).

O checkout em si continua na Hotmart. Este repositório recebe o webhook, grava o direito de acesso e libera o app. Durante o desenvolvimento, `BILLING_ENFORCED=false` deixa entrar qualquer usuário autenticado.

## Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`.

Preencha pelo menos `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Sem isso, a landing abre, mas login e sincronização não funcionam.

## Supabase

1. No SQL Editor, execute [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
2. Em Authentication → URL Configuration, coloque a URL do site e `https://SEU_DOMINIO/auth/callback` como redirect.
3. A tabela `app_data` guarda o mesmo JSON de antes (`d`, `g`, `forja`, `hc`, `cc`, `off`, `ut`). Quem já tem dados nessa tabela continua compatível. O navegador também usa a chave `disc1`.
4. A tabela `entitlements` guarda a assinatura. O cliente só pode ler a própria linha. Quem grava é o webhook, com a `service_role`.
5. Fotos de perfil vão para o bucket `avatars`. O JSON guarda o caminho, não mais a imagem inteira.

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` nem `HOTMART_HOTTOK` em variável `NEXT_PUBLIC_`.

## Hotmart

Quando o produto estiver no ar:

1. No webhook do produto, aponte para `https://SEU_DOMINIO/api/webhooks/hotmart`.
2. Use a versão 2.0.0 e envie o header `X-HOTMART-HOTTOK`.
3. Copie o token para `HOTMART_HOTTOK` e o id numérico do produto para `HOTMART_PRODUCT_ID`. O código `P108444964Q` da URL de pagamento não é esse id.
4. `HOTMART_CHECKOUT_URL` já aponta para `https://pay.hotmart.com/P108444964Q?bid=1794408607041`. A landing Vite usa o mesmo endereço.
5. Ligue `BILLING_ENFORCED=true` só depois que uma compra de teste gravar a assinatura. O passo a passo está em “O que falta para publicar”.

Eventos tratados:

- `PURCHASE_APPROVED` e `PURCHASE_COMPLETE` liberam o acesso.
- `PURCHASE_REFUNDED` e `PURCHASE_CHARGEBACK` revogam.
- `SUBSCRIPTION_CANCELLATION` e status `EXPIRED` / `CANCELED_*` bloqueiam.
- `OVERDUE` continua liberado, com aviso, enquanto `BILLING_ALLOW_OVERDUE` não for `false`.

O e-mail da compra precisa ser o mesmo e-mail da conta. O acesso não fica dentro dos dados do usuário, para ninguém alterar a própria assinatura no navegador.

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm test` — regras de domínio, backup e mapeamento do webhook
- `npm run lint` — ESLint

## Backup

O arquivo exportado continua no formato `{ "app": "forja", "v": 1, "exp": "...", "data": { ... } }`. Dá para restaurar um backup gerado pela versão anterior.
