# Central de Conhecimento TJES

Painel de consulta e administração documental baseado na identidade visual do **TJES Contingência Offline**. A biblioteca central é `biblioteca-tjes.json`, com manifest `versao.json`.

## Abrir o painel

- GitHub Pages: https://suaneden.github.io/tjes-base-conhecimento/ (consulta e rascunhos locais)
- A interface contém pesquisa, filtro de categoria, leitura, criação, edição, remoção, exportação, importação e restauração de rascunhos.
- **Rascunhos não são publicados automaticamente.** Cada navegador guarda a sua cópia no `localStorage`. Use **Exportar backup** antes de trocar navegador ou limpar dados.

## Base única e consumidores

- **Site offline** [tjes-contingencia-demo](https://github.com/SuanEden/tjes-contingencia-demo): `kb-local-import.js` consulta o manifesto remoto, valida os registros e grava a versão aceita no IndexedDB. Sem internet, usa o cache ou a cópia embarcada `biblioteca-tjes.json`. Os modelos SATE preexistentes são preservados.
- **Extensão** [assistente-tjes-assyst](https://github.com/SuanEden/assistente-tjes-assyst): `background.js` busca e guarda a biblioteca no `chrome.storage.local`; `content.js` mostra o documento atualizado junto aos procedimentos operacionais. O suplemento SATE0375 e regras de requisitos permanecem separados. Para usar as mudanças, reinstale/atualize a extensão a partir do código atualizado.
- A sincronização acontece **na abertura/atualização da interface**, com conectividade. Não é push em tempo real. Cache pode exibir uma versão antiga até reabrir a ferramenta.

## Publicação oficial segura (preparada, não ativada)

O repositório fornece `api/auth.js`, `api/publish.js` e `api/_shared.js` para execução como **Vercel Functions** junto com o painel no mesmo domínio HTTPS. GitHub Pages continua funcionando apenas para consulta/rascunhos, pois não executa APIs.

1. Conecte este repositório a um projeto Vercel (framework **Other**, pasta raiz), e obtenha o domínio HTTPS fixo, como `https://SEU-PROJETO.vercel.app`.
2. Crie um **GitHub OAuth App**, com Homepage URL apontando para o domínio Vercel e **Authorization callback URL** `https://SEU-PROJETO.vercel.app/api/auth?action=callback`.
3. Configure no Vercel (Production; opcionalmente Preview) as **variáveis secretas**:
   - `GITHUB_CLIENT_ID`: ID público da OAuth App;
   - `GITHUB_CLIENT_SECRET`: segredo da OAuth App (**secret**);
   - `SESSION_SECRET`: valor aleatório com pelo menos 32 caracteres (**secret**);
   - `GITHUB_ALLOWED_USERS`: logins GitHub autorizados separados por vírgula;
   - `PUBLIC_BASE_URL`: `https://SEU-PROJETO.vercel.app`, sem barra final.
4. Faça redeploy com as variáveis. Entre com o GitHub no painel hospedado no Vercel, edite um artigo, **Salve rascunho**, confirme **Publicar alterações**. O backend valida autenticação, domínio, CSRF, esquema, versão e atualiza biblioteca e manifesto no **mesmo commit**. Se a versão mudou, a publicação é rejeitada para evitar sobrescrita silenciosa.

**Importante:** nunca cole tokens/segredos neste repositório, no HTML ou no chat. Configure-os diretamente nas plataformas. O GitHub OAuth App solicita o escopo `public_repo`, que também permite acesso a outros repositórios públicos do usuário; apenas responsáveis cientes dessa permissão devem autorizar. Para permissões mais restritas, planeje migração futura para **GitHub App** com acesso somente a este repositório. Antes da produção, configure revisão e proteção da branch se houver mais de um editor.

## Integridade e segurança

- `biblioteca-tjes.json`: `version=1`, `records` com códigos `SATE0000` (quatro números), IDs únicos e campo `text` obrigatório.
- `versao.json`: `schemaVersion=1`, `contentVersion` inteiro positivo, `recordCount` igual ao número de registros e `dataFile=biblioteca-tjes.json`.
- Teste local: `node --test tests/validate.mjs`.
- O painel não transmite os rascunhos à API até a ação explícita de publicação. Exportação gera backup JSON.
- O sistema offline é para contingência; dados estruturados do Assyst e os scripts locais não devem ser confundidos com a biblioteca documental.
- **Atenção:** não há teste ponta a ponta comprovado no navegador, nem deploy de publicação autenticada configurado. A ativação depende do titular das credenciais e da validação de permissões.
