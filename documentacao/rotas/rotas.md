# Documentação de Endpoints – IFRO EVENTS

## Endpoints com Foco em Casos de Uso

---

## 1. Cadastro e Login de Usuário

### 1.1 POST /auth/register

#### Caso de Uso
Criar um novo usuário no sistema.

#### Regras de Negócio Envolvidas
- **Validação de dados:**
  - Nome: mínimo 3 caracteres.
  - Matrícula: somente números, idêntica à matrícula vinculada ao SUAP.
  - Senha: mínimo 8 caracteres, contendo letras maiúsculas, minúsculas, números e caracteres especiais.
  - Confirmação de senha: deve ser idêntica à senha original.
- **Segurança:** Criptografar a senha antes do armazenamento.
- **Contexto:** O cadastro de usuários é restrito ao painel administrativo. O Totem não possui login ou cadastro de usuários.

#### Resultado Esperado
- Usuário criado com sucesso.
- Retorno do objeto de usuário com identificador único.
- Em caso de falha, retornar mensagem de erro apropriada.

---

### 1.2 POST /auth/login

#### Caso de Uso
Login de usuário administrativo no sistema (painel).

#### Regras de Negócio Envolvidas
- Verificação de credenciais: matrícula e senha válidas.

#### Resultado Esperado
- Token JWT de autenticação.
- Retorno do objeto de usuário autenticado.
- Em caso de falha, retornar mensagem de erro.

---

## 2. Eventos

### 2.1 POST /eventos

#### Caso de Uso
Cadastrar um novo evento pelo painel administrativo.

#### Regras de Negócio
- **Campos obrigatórios:** título, descrição, local, data, forma de inscrição, mídias.
- **Vinculação ao usuário:** evento é associado ao usuário autenticado.
- **QR Code:** pode ser gerado a partir do link de inscrição.

#### Resultado
- Evento criado com ID único.
- Retorno do objeto completo.
- Mensagem de erro em caso de falha de validação ou persistência.

---

### 2.2 GET /eventos

#### Caso de Uso
Listar todos os eventos.

#### Regras de Negócio
- **Totem:** lista eventos passados, atuais e futuros com dados visuais apenas.
- **Painel:** lista todos os eventos com detalhes administrativos.

#### Parâmetros de Query Opcionais
- `titulo`: Filtrar por título (busca parcial)
- `local`: Filtrar por local (busca parcial)
- `categoria`: Filtrar por categoria (busca parcial)
- `tags`: Filtrar por tags (busca parcial)
- `status`: Filtrar por status (0 = inativo, 1 = ativo)
- `tipo`: Filtrar por tipo (historico, futuro, ativo)
- `dataInicio`: Filtrar eventos a partir de uma data
- `dataFim`: Filtrar eventos até uma data
- `page`: Número da página (padrão: 1)
- `limite`: Quantidade de resultados por página (padrão: 10, máximo: 100)
- `ordenarPor`: Ordenação dos resultados
  - `createdAt`: Mais antigos primeiro
  - `-createdAt`: Mais recentes primeiro (padrão)
  - `dataInicio`: Por data de início (crescente)
  - `-dataInicio`: Por data de início (decrescente)

#### Resultado
- Array de eventos com dados filtrados por origem (painel ou totem).
- Em caso de falha, retornar mensagem de erro.

---

### 2.3 GET /eventos/:id

#### Caso de Uso
Obter os detalhes de um evento específico.

#### Regras de Negócio
- **Totem:** exibe apenas dados públicos do evento.
- **Painel:** exibe todos os campos administrativos.

#### Resultado
- Objeto do evento retornado com base no ID.
- Se ID for inválido, retorna erro de validação (400).
- Se não encontrado, retorna erro 404.

---

### 2.4 PATCH /eventos/:id

#### Caso de Uso
Editar os dados de um evento.

#### Regras de Negócio
- **Acesso restrito:** somente o usuário criador pode editar.
- **Permissão compartilhada (futuro):** permitir edição colaborativa.
- **Validação parcial:** apenas campos alterados são validados.

#### Resultado
- Evento atualizado e retornado.
- Em caso de erro de permissão ou ID inválido, retorna erro.

---

### 2.5 PATCH /eventos/:id/status

#### Caso de Uso
Alterar o status de um evento entre `ativo` e `inativo`.

#### Regras de Negócio
- **Acesso restrito:** apenas o criador do evento pode alterar o status.
- **Valores aceitos:** `ativo` ou `inativo` (validação via Zod).
- **Impacto:** eventos inativos não aparecem em rotas públicas como as do Totem.

#### Resultado
- Status do evento alterado com sucesso.
- Retorno do evento com o novo status atualizado.
- Em caso de valor inválido ou ID inexistente, retornar mensagem de erro apropriada.

---

### 2.6 DELETE /eventos/:id

#### Caso de Uso
Remover um evento do sistema.

#### Regras de Negócio
- Ação registrada para fins de auditoria (log).
- Apenas o criador do evento pode removê-lo.

#### Resultado
- Evento removido com sucesso.
- Em caso de erro, retorna status e mensagem apropriada.

---

## 3. Endpoints Adicionais

### 3.1 POST /eventos/:id/midia/:tipo

#### Caso de Uso
Adicionar uma mídia ao evento (capa, carrossel ou vídeo).

#### Regras de Negócio
- **Tipos aceitos:** JPG, PNG (imagens), MP4 (vídeo).
- **Tamanho máximo:** 25MB.
- **Padrões visuais obrigatórios:**
  - Imagem de capa: 1280x720px,
  - Vídeo: resolução mínima 1280x720px,
  - Carrossel: 1280x720px.
- **Tipo deve ser informado na URL como `capa`, `carrossel`, ou `video`.**
- Mídias com dimensões inválidas são rejeitadas automaticamente.

#### Resultado
- Mídia armazenada e vinculada ao evento.
- Retorno com dados da mídia.
- Mensagem de erro em caso de falha ou rejeição.

---

### 3.2 GET /eventos/:id/midias

#### Caso de Uso
Listar as mídias associadas a um evento.

#### Regras de Negócio
- **Totem:** acesso visual somente.
- **Painel:** exibe todas as mídias registradas com detalhes.

#### Resultado
- Array com as mídias agrupadas por tipo.
- Em caso de erro, retornar mensagem apropriada.

---

### 3.3 GET /eventos/:id/midia/capa

#### Caso de Uso
Recuperar imagem de capa associada a um evento.

#### Regras de Negócio
- Apenas uma imagem de capa por evento.
- Visualização permitida tanto no painel quanto no totem.

#### Resultado
- Objeto com os dados da imagem de capa.
- Em caso de falha, retornar mensagem de erro.

---

### 3.4 GET /eventos/:id/midia/video

#### Caso de Uso
Recuperar vídeo institucional vinculado ao evento.

#### Regras de Negócio
- Um único vídeo por evento.
- Utilizado para apresentação no totem ou rede social.

#### Resultado
- Objeto com dados do vídeo (URL, tamanho, resolução).
- Mensagem de erro se não houver vídeo.

---

### 3.5 GET /eventos/:id/midia/carrossel

#### Caso de Uso
Listar imagens do carrossel do evento.

#### Regras de Negócio
- Exibidas em slideshow no painel ou no totem.
- Dimensões obrigatórias validadas no upload.

#### Resultado
- Array de imagens do carrossel.
- Em caso de falha, retorna mensagem de erro.

---

### 3.6 DELETE /eventos/:eventoId/midia/:tipo/:midiaId

#### Caso de Uso
Remover uma mídia (vídeo, imagem de capa ou imagem de carrossel) específica de um evento.

#### Regras de Negócio
- Apenas usuários administradores autenticados podem realizar a ação.
- A mídia é removida do banco e do sistema de arquivos.
- Tipo deve ser uma das opções válidas: `capa`, `carrossel`, `video`.

#### Resultado
- Mídia removida com sucesso.
- Mensagem de erro caso ID não exista ou tipo inválido seja informado.

---

### 3.7 GET /eventos/:id/qrcode

#### Caso de Uso
Gerar um QR Code com o link de inscrição do evento.

#### Regras de Negócio
- QR Code gerado a partir do campo `linkInscricao`.
- Formato base64 pronto para ser exibido em tela ou baixado.
- Exclusivo para exibição no totem.

#### Resultado
- Imagem do QR Code (base64).
- Link externo incluso na resposta.
- Em caso de erro, retornar mensagem apropriada.

---

### 3.8 Slideshow para Totem

#### Caso de Uso
Para o slideshow do totem com eventos passados, utilize a rota `GET /eventos` com os seguintes parâmetros:
- `?tipo=historico` (filtra eventos passados automaticamente)
- `&apenasVisiveis=true` (otimizado para totem)
- `&limit=50` (quantidade adequada para slideshow)

#### Resultado
- Lista de eventos passados com mídias de capa incluídas.
- Ideal para exibição contínua no totem.
- Dados otimizados para visualização pública.

---

## Considerações Técnicas e Finais

- **Totem:** acesso público e restrito à visualização.
- **Painel Administrativo:** exige login com JWT.
- **Validações:** feitas com Zod e schemas robustos.
- **Logs:** todas ações importantes são rastreadas.
- **Responsividade:** sistema pronto para ser consumido por painéis administrativos, totens e apps móveis.
