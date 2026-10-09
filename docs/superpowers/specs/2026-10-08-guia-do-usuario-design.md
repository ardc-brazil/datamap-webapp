# Guia do usuário do DataMap — design

Data: 2026-10-08
Estado: aprovado em conversa, aguardando revisão da spec

## Objetivo

Substituir o manual do Google Docs, que sumiu e ainda é o destino do link em
`pages/project/support.tsx`, por um guia do usuário que mora no próprio
webapp, em `/manual`, e que também é baixado como PDF. O guia explica como as
ferramentas funcionam, como interagir com elas e quais são os limites.

As capturas de tela e o PDF são gerados por script. Ninguém tira print à mão.

## Decisões

| Tema | Decisão |
|---|---|
| Formato | Guia web em `/manual` + PDF gerado da mesma fonte |
| Idioma | Texto em pt-BR. Capturas na interface atual (inglês) até a RFC 006 entrar; depois basta regenerar |
| Público | Pesquisadores, mais um capítulo curto para administradores. Grafana, CI e deploy ficam nos runbooks |
| Construção | MDX no `datamap-webapp`, capturas com Playwright contra a stack de integração, imagens e PDF versionados |
| Fora do escopo | Versão em inglês, vídeos e GIFs, Notebooks (entram quando lançados), o botão **Data files** e o Zipper |

## Conteúdo

### Capítulos

Um arquivo MDX por capítulo, em `content/manual/NN-<slug>.mdx`:

1. **Primeiros passos** — o que é o DataMap; criar conta com e-mail e senha ou com ORCID; confirmar o e-mail; entrar e sair.
2. **Sua conta** — perfil, trocar ou definir senha, conectar o ORCID, recuperar o acesso.
3. **Workspaces** — o workspace Público, pedir acesso, trocar de workspace, aceitar convites, página de Membros.
4. **Encontrar datasets** — busca por texto completo, filtros, paginação, aba **Shared with me**.
5. **Criar um dataset e publicar versões** — criação, metadados, versões.
6. **Envio e download de arquivos** — ver a seção própria abaixo.
7. **Citação e DOI** — DOI automático e manual, estados, página pública.
8. **Embargo** — quem acessa o quê, definir, estender, encerrar, lembretes, fim do embargo.
9. **Compartilhamento** — convidar pessoas, níveis de acesso, o que os membros podem fazer, histórico de acesso.
10. **Links anônimos para revisores** — criar, o que o revisor vê, contagem de visualizações, revogar.
11. **Para administradores** — fila de pedidos, aprovar e recusar, workspaces, membros e convites.
12. **Limites e referência rápida** — tabela com todos os limites e glossário.

Cada capítulo segue o mesmo molde: uma frase com o que dá para fazer, passos
numerados com captura e, quando houver, uma caixa `<Limites>`. O capítulo 12
reúne todas essas caixas numa tabela.

### Capítulo 6: envio e download de arquivos

**Como funciona o envio**, com o diagrama `<FluxoEnvio />`:
navegador → servidor de envio (tusd) → área temporária → dataset → armazenamento
definitivo (Archivist). Uma frase por etapa, dita do ponto de vista do usuário.

- O envio usa o protocolo TUS: se a conexão cair, ele retoma de onde parou.
- O token de envio vale 24 h; um envio que passa disso continua sendo processado.
- O arquivo só pode ser baixado depois de chegar ao armazenamento definitivo.
  Enquanto está na área temporária, não aparece para download.
- Se um arquivo falhar, a versão não é publicada e a tela mostra o motivo.
- Envios acontecem na criação do dataset e no painel de nova versão.

**Como baixar**: pela lista de arquivos da versão, um arquivo por vez, com um
link temporário. Exige login, mesmo em dataset público. Durante o embargo,
membros do workspace veem o botão bloqueado.

**Limites**: sem limite de tamanho nem de tipo de arquivo; download de um
arquivo por vez; arquivo enviado não pode ser removido; link de download válido
por 1 h durante o embargo e 7 dias fora dele.

O botão **Data files** no topo do dataset (comando `scp` de exemplo, aba S3
indisponível) e o Zipper não entram no guia.

### Limites

Valores levantados nas PRs. Cada um é conferido no código antes de entrar no
texto, e o guia cita o código, não a PR.

| Limite | Valor | Origem |
|---|---|---|
| Duração do embargo, na criação e em cada extensão | até 90 dias | gatekeeper #132 |
| Lembretes do fim do embargo | 15, 10, 5 e 1 dia antes | gatekeeper #135 |
| Link anônimo | só durante o embargo | gatekeeper #135 |
| Convite | uso único | gatekeeper #135 |
| Link de download | 1 h no embargo, 7 dias fora | gatekeeper #132 |
| Login | bloqueio de 15 min após 10 tentativas erradas | gatekeeper #142 |
| Reenvio de código | a cada 90 s, até 5 e-mails por hora por endereço | gatekeeper #142 |
| Link de redefinição de senha | 1 h, uso único | gatekeeper #142 |
| Pedido de acesso a workspace | 1 pendente por vez, até 3 a cada 24 h | gatekeeper #145 |
| Token de envio | 24 h; o processamento continua depois disso | confirmado pelo mantenedor |
| Tamanho e tipo de arquivo | sem limite | confirmado pelo mantenedor |
| Download | um arquivo por vez | confirmado pelo mantenedor |

A levantar no código durante a implementação: duração da sessão e tamanho de
página da lista de datasets.

### Regras de escrita

- Frases curtas, sem jargão técnico, sem contar como a funcionalidade foi construída.
- Rótulos de tela exatamente como aparecem, em negrito: "Compartilhar (**Share**)".
- Nada de funcionalidade futura, nem como "em breve".

## Página web

- `/manual`: capa, botão **Baixar PDF** e os capítulos como cartões.
- `/manual/[capitulo]`: gerada no build (`getStaticProps`/`getStaticPaths`) a partir do MDX. Pública, sem login.
- Layout com o design system atual: tinta `#0b0b0c`, papel `#fafaf9`, Inter, Material Symbols (outlined, peso 200, grade -25). Índice dos capítulos à esquerda, seções do capítulo à direita; no celular o índice vira menu.
- Busca em títulos e seções, com um índice JSON gerado no build. Sem biblioteca nova.

### Componentes MDX

Em `components/Manual/`, cada um no seu arquivo:

| Componente | Função |
|---|---|
| `<Captura nome alt legenda?>` | imagem de `public/manual/img/<nome>.png` em `<figure>`, borda leve, legenda; `alt` obrigatório |
| `<Limites>` | caixa com os limites do capítulo |
| `<Nota>` | observação curta |
| `<FluxoEnvio />` | diagrama do envio em SVG, com as cores do tema |

### Links no site

- `USER_MANUAL_URL` em `pages/project/support.tsx` passa a ser `/manual`, e o link deixa de ser externo.
- Link "Guia do usuário" no rodapé e no menu do avatar.

## Capturas

Em `manual-capture/`, fora dos testes:

- `seed.ts` cria os dados pela API do gatekeeper, com credenciais de cliente.
  - Pessoas: "Ana Pesquisadora", "Bruno Revisor" e o admin do seed.
  - Workspace "Clima Amazônia".
  - Datasets: um publicado com DOI, um em embargo, um rascunho.
  - Um compartilhamento, um convite pendente, um link anônimo e um pedido de acesso aberto.
  - Códigos de confirmação lidos da API do Mailpit.
- `scenes/<capitulo>.ts`: uma cena por capítulo, que salva capturas com nomes estáveis (`embargo-definir.png`).
- `fixtures/`: arquivos pequenos de exemplo (um `.nc`, um `.csv`) para a cena de envio.

### Determinismo

- Viewport 1280×800, `deviceScaleFactor` 2.
- Relógio fixo com `page.clock`.
- `prefers-reduced-motion: reduce`, para o mapa de isóbaras sair estático.
- Valores aleatórios (ids, tokens) mascarados com a opção `mask` do Playwright.
- Destaque opcional: contorno e número injetados sobre o elemento citado no texto. Diálogos são capturados recortados no próprio elemento.

### Seletores

As cenas clicam por `data-testid`, não por texto. São cerca de 30 atributos
novos nos componentes usados. Assim, a tradução da RFC 006 não quebra as cenas.

### Cena de envio

- Arquivos adicionados com `setInputFiles` no Uppy.
- Progresso: a resposta do tusd é segurada por interceptação de rede num ponto fixo.
- Falha: erro forçado no aviso ao gatekeeper, para capturar a mensagem de que nada foi publicado.
- Estados capturados: arquivos adicionados, em progresso, falha, concluído, versão publicada com os arquivos.

### Atomicidade

As imagens são escritas num diretório temporário e só substituem as de
`public/manual/img/` quando todas as cenas passam. Uma cena que falha encerra a
execução, aponta a captura e não troca nada.

## PDF

- Rota `/manual/imprimir`: todos os capítulos em sequência, com CSS de impressão.
  - A4.
  - Capa com marca, título, data e commit curto, URL do guia.
  - Índice com links, sem número de página.
  - Cada capítulo começa numa página nova; figuras com `break-inside: avoid`.
- Gerado com `page.pdf()` do Playwright, com número de página no rodapé (`displayHeaderFooter`).
- Saída: `public/manual/guia-datamap.pdf`, versionada.

## Automação

- `make manual`: sobe a stack de integração a partir de `../gatekeeper`, faz o build do webapp e o `next start` contra ela, roda seed, cenas e PDF.
- Workflow `manual` no `datamap-webapp`:
  - Dispara à mão (`workflow_dispatch`) ou num push para `main` que altere `content/manual/**` ou `manual-capture/**`.
  - Faz checkout do gatekeeper, roda `make manual` e abre uma PR com as imagens e o PDF alterados.
  - Não roda em `pull_request`.
- O deploy não muda: publica o que está versionado.

## Verificações

- Teste Jest, no CI existente:
  - toda `<Captura nome>` aponta para uma imagem que existe;
  - todo capítulo tem cabeçalho com título, ordem e resumo;
  - nenhum `alt` vazio.
- As cenas do Playwright servem de teste de ponta a ponta das telas mostradas no guia.

## Dependências novas

Só de desenvolvimento: `@next/mdx` (com `@mdx-js/loader` e `@mdx-js/react`) e
`@playwright/test`. Nada novo em produção.

## Tarefas separadas, fora desta spec

- Esconder o botão **Data files** ou trocá-lo por um aviso: hoje ele mostra um comando `scp` de exemplo que não funciona.
