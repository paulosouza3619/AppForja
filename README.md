# Forja

Aplicativo web de desenvolvimento pessoal com planejamento por ciclos, prioridades diárias, ferramentas de organização e acompanhamento da evolução.

> Repositório privado. Este projeto é uma aplicação estática: o arquivo principal é `index.html`.

## Estrutura

```text
forja/
├── index.html              # Aplicação completa
├── README.md               # Este guia
├── .gitignore              # Arquivos locais ignorados pelo Git
├── .nojekyll               # Evita processamento Jekyll no GitHub Pages
├── LICENSE                 # Não incluída: repositório privado e direitos reservados
├── docs/
│   └── PUBLICACAO.md       # Orientações de publicação
└── supabase/
    └── schema.sql          # Tabela e políticas de segurança da sincronização
```

## Executar localmente

1. Baixe ou clone o repositório.
2. Abra `index.html` no navegador.
3. Os dados locais são armazenados no `localStorage` do navegador.

**Atenção:** a sincronização/conta na nuvem depende de a aplicação estar hospedada em HTTP/HTTPS e da configuração do Supabase. Abrir o arquivo diretamente (`file://`) desativa a conexão com a nuvem no código atual.

## Supabase (sincronização na nuvem)

O código contém a URL do projeto Supabase e uma chave publicável (`sb_publishable_...`). Chaves publicáveis podem ficar no frontend, desde que as tabelas estejam protegidas por Row Level Security (RLS). Nunca coloque `service_role`, segredo de backend ou senha neste repositório/frontend.

1. Abra o projeto Supabase associado ao Forja.
2. Entre no **SQL Editor**.
3. Execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
4. Em **Authentication → URL Configuration**, configure a URL pública do site e as URLs de redirecionamento de recuperação de senha.
5. Publique o site em HTTPS.
6. Teste criar conta, confirmar e-mail, entrar, sincronizar, sair e recuperar senha.

A aplicação espera uma tabela `public.app_data` com `user_id`, `data` e `updated_at`. As políticas RLS devem permitir que cada usuário leia e altere somente a própria linha.

## Publicar com GitHub Pages

Veja [`docs/PUBLICACAO.md`](docs/PUBLICACAO.md). Como a aplicação é estática, não precisa de `npm install`, build ou servidor Node.

## Dados e privacidade

- Sem login/nuvem, os dados ficam no armazenamento local do navegador e não são automaticamente compartilhados entre dispositivos ou navegadores.
- Com login e Supabase configurados, os dados podem ser sincronizados com a conta.
- Antes de alterações importantes, mantenha backup dos dados. A sincronização atual compara o campo `ut` e pode solicitar escolha quando detectar versões diferentes.
- Mantenha o repositório como **Private** no GitHub. Repositório privado não substitui controles de segurança do Supabase nem torna segura a publicação de segredos no código.

## Estado do projeto

Versão organizada a partir do HTML fornecido. O projeto ainda deve passar por testes funcionais em desktop e celular antes de ser considerado pronto para produção.
