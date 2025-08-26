# 🎉 IFRO Events - Plataforma de Eventos

Back-end da plataforma **IFRO Events**, desenvolvida para gerenciamento e divulgação de eventos institucionais, com autenticação, permissões de edição, upload de mídias, exibição por totem, geração de QR Code e muito mais.

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Endpoints](#-api-endpoints)
- [Testes](#-testes)
- [Docker](#-docker)
- [Documentação](#-documentação)

## 🚀 Funcionalidades

- **Autenticação JWT** com tokens de acesso e refresh
- **Fluxo de usuários completo** e com recuperação de senha
- **Cadastro e manutenção de eventos**
- **Upload de mídias** por tipo: capa, carrossel e vídeo
- **Exibição pública de eventos no totem**
- **Listagem de eventos por status** (atuais, futuros, anteriores)
- **Geração de QR Code** para inscrição externa
- **Compartilhamento de permissões** de edição por tempo limitado
- **Filtros e ordenações** por query params
- **Testes automatizados** com Jest e MongoDB Memory Server
- **Documentação Swagger** integrada

## 🛠 Tecnologias Utilizadas

### Backend
- **Node.js** – Ambiente de execução
- **Express.js** – Framework Web
- **MongoDB** – Banco de dados NoSQL
- **Mongoose** – ODM para MongoDB
- **Zod** – Validação de dados
- **JWT** – Autenticação e autorização
- **Multer + Sharp** – Upload e processamento de imagens
- **QRCode** – Geração de QR Codes
- **Swagger UI** – Documentação da API

### Desenvolvimento
- **Jest** – Testes unitários
- **Mockingoose** – Mocks de models Mongoose
- **MongoDB Memory Server** – Banco de dados em memória para testes
- **Nodemon** – Reload automático
- **Docker + Docker Compose** – Containerização

## 📦 Instalação

### Pré-requisitos

- Node.js (v22)
- MongoDB (local ou Atlas)
- Git

### Clonando o Repositório

```bash
git clone https://gitlab.fslab.dev/f-brica-de-software-ii-2025-1/plataforma-de-divulgacao-de-eventos.git
cd plataforma-de-divulgacao-de-eventos
```

### Instalando Dependências

```bash
npm install
```

## ⚙️ Configuração

### Arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com base no exemplo abaixo ou no .env.example do projeto:

```env
PORT=5015
DB_URL=mongodb://localhost:27017/ifro-events
DB_URL_TEST=mongodb://localhost:27017/ifro-events-test

JWT_SECRET_ACCESS_TOKEN=sua-chave-access
JWT_SECRET_REFRESH_TOKEN=sua-chave-refresh
JWT_SECRET_PASSWORD_RECOVERY=sua-chave-recuperacao

JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

NODE_ENV=development
```

## 🏃‍♂️ Executando o Projeto

### Ambiente de Desenvolvimento

```bash
npm run dev
```

### Ambiente de Produção

```bash
npm start
```

### Executar Seeds (Opcional)

```bash
npm run seed
```

## 🐳 Docker

### Subindo com Docker Compose

```bash
docker compose up --build --force-recreate -d
```

### Rodando Seeds com Docker

```bash
docker exec -it plataforma-eventos-api npm run seed
```

### Rodando Testes com Docker

```bash
docker exec -it plataforma-eventos-api npm run test
```

### Parando os containers

```bash
docker compose down
```

## 📁 Estrutura do Projeto

```
ifro-events-api/
├── src/
│   ├── app.js
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   └── validators/
├── uploads
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── README.md
└── package.json
```

## 🌐 API Endpoints

### Autenticação
- `POST /login`
- `POST /logout`
- `POST /refresh`
- `POST /signup`
- `POST /recover`
- `PATCH /password/reset/token`

### Usuários
- `POST /usuarios` – Criar usuário
- `GET /usuarios/` – Dados do usuário logado
- `GET /usuarios/:id` – Dados específicos do usuário
- `PATCH /usuarios/:id` – Alterar dados do usuário
- `PATCH /usuarios/:id/status` – Inativa um usuário ao "excluir", não deleta do banco

### Eventos
- `POST /eventos` – Criar evento
- `GET /eventos` – Listar eventos com filtros
- `GET /eventos/:id` – Detalhar evento
- `PATCH /eventos/:id` – Atualizar evento
- `PATCH /eventos/:id/status` – Inativa um evento e para a exibição para o totem
- `DELETE /eventos/:id` – Excluir evento
- `PATCH /eventos/:id/compartilhar` – Compartilhar permissão de edição
- `GET /eventos/:id/qrcode` – Gerar QR Code
- `GET /eventos/(requisição com query)` – Listar eventos passados para pegar informações para exibição slideshow

### Upload de Mídias
- `POST /eventos/:id/midia/:tipo` – Upload de mídia por tipo (capa, video carrossel)
- `GET /eventos/:id/midias` – Listagem das mídias de um eventos (Resposta - Json)
- `GET /eventos/:id/midia/capa` – Listagem da capa de um evento (Resposta - Imagem)
- `GET /eventos/:id/midia/video` – Listagem de video de um evento (Resposta - Video)
- `GET /eventos/:id/midia/carrossel/:index` - Listagem de carrossel de um evento, por index (Posição)
- `DELETE /eventos/:eventoId/midia/:tipo/:midiaId` – Exclusão de mídia de um eventos

## 🧪 Testes

### Executar todos os testes com coverage

```bash
npm run test
```

### Estrutura de Testes

```
src/tests/
├── routes/
├── unit/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   └── utils/
```

## 📑 Documentação

Acesse `/docs` no navegador enquanto o servidor estiver em execução:

```bash
http://localhost:5015/docs
```
---

> Projeto desenvolvido como parte da disciplina **Fábrica de Software** no curso de **Análise e Desenvolvimento de Sistemas** – IFRO Campus Vilhena.
