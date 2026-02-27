# Deploy — Docker Hub + Servidor (VM)

Guia completo para construir as imagens Docker do frontend e backend, publicar no Docker Hub e subir no servidor via SSH.

---

## Pré-requisitos

- Docker instalado na máquina local e no servidor
- Conta no Docker Hub (usuário: `ruanlopes1350`)
- Acesso SSH ao servidor

---

## 1. Build das imagens (máquina local)

### Backend

```bash
cd /home/ruanlopes/Documents/ifroevents/backend
docker build -t ruanlopes1350/ifroevents-api:latest .
```

### Frontend

> **Importante:** O Next.js embute as variáveis `NEXT_PUBLIC_*` durante o build.
> Por isso é obrigatório passar os `--build-arg` com os valores de produção.

```bash
cd /home/ruanlopes/Documents/ifroevents/frontend
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.mural.fslab.dev \
  --build-arg NEXT_PUBLIC_AMBIENTE=production \
  -t ruanlopes1350/ifroevents-front:latest .
```

---

## 2. Push para o Docker Hub

```bash
# Login (só precisa uma vez)
docker login -u ruanlopes1350

# Enviar as imagens
docker push ruanlopes1350/ifroevents-api:latest
docker push ruanlopes1350/ifroevents-front:latest
```

Para verificar se as imagens subiram:
```bash
docker search ruanlopes1350
```

---

## 3. Preparar arquivos para o servidor

No servidor, você vai precisar de **3 arquivos** em uma pasta (ex: `/opt/ifroevents/`):

| Arquivo                   | Origem                                    | Descrição                           |
| ------------------------- | ----------------------------------------- | ----------------------------------- |
| `docker-compose.prod.yml` | `backend/docker-compose.prod.yml`         | Compose de produção (puxa do Hub)   |
| `.env`                    | `backend/.env` (com valores de produção)  | Variáveis de ambiente do backend    |
| `.env.local`              | `frontend/.env.local` (com valores de produção) | Variáveis de ambiente do frontend |

### Valores que devem ser alterados nos .env para produção

**No `.env` (backend):**
```dotenv
DB_URL="mongodb://eventos-mongodb:27017/ifro_eventos"
NODE_ENV=production
URL_FRONTEND=https://mural.fslab.dev/
SWAGGER_PROD_URL=https://api.mural.fslab.dev
```

> Os demais valores (JWT secrets, MinIO, e-mail, admin) podem ser mantidos como estão, desde que sejam os secrets corretos de produção.

**No `.env.local` (frontend):**
```dotenv
AUTH_SECRET="<seu-secret>"
NEXTAUTH_SECRET="<seu-secret>"
NEXT_PUBLIC_API_URL=https://api.mural.fslab.dev
NEXTAUTH_URL=https://mural.fslab.dev
API_URL_SERVER_SIDED=http://eventos-api:3001
NEXT_PUBLIC_AMBIENTE=production
```

> O `API_URL_SERVER_SIDED` usa o nome do container (`eventos-api`) porque a comunicação server-side do Next.js acontece dentro da rede Docker.

---

## 4. Copiar arquivos para o servidor via SCP (SSH)

Substitua `usuario@ip-do-servidor` pelo seu acesso SSH real.

### Criar pasta no servidor

```bash
ssh usuario@ip-do-servidor "mkdir -p /opt/ifroevents"
```

### Copiar docker-compose.prod.yml

```bash
scp /home/ruanlopes/Documents/ifroevents/backend/docker-compose.prod.yml \
  usuario@ip-do-servidor:/opt/ifroevents/docker-compose.prod.yml
```

### Copiar .env do backend (já editado para produção)

```bash
scp /home/ruanlopes/Documents/ifroevents/backend/.env \
  usuario@ip-do-servidor:/opt/ifroevents/.env
```

### Copiar .env.local do frontend (já editado para produção)

```bash
scp /home/ruanlopes/Documents/ifroevents/frontend/.env.local \
  usuario@ip-do-servidor:/opt/ifroevents/.env.local
```

### Ou copiar tudo de uma vez

```bash
scp \
  /home/ruanlopes/Documents/ifroevents/backend/docker-compose.prod.yml \
  /home/ruanlopes/Documents/ifroevents/backend/.env \
  /home/ruanlopes/Documents/ifroevents/frontend/.env.local \
  usuario@ip-do-servidor:/opt/ifroevents/
```

> **Dica:** Se o servidor usar porta SSH diferente de 22, use `scp -P <porta>`.

---

## 5. Subir no servidor

```bash
ssh usuario@ip-do-servidor

cd /opt/ifroevents

# Baixar as imagens e subir os containers
docker compose -f docker-compose.prod.yml up -d
```

### Verificar se está tudo rodando

```bash
docker ps

# Logs em tempo real
docker compose -f docker-compose.prod.yml logs -f

# Logs de um serviço específico
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f frontend
```

---

## 6. Atualizações futuras (re-deploy)

### Na máquina local: rebuild + push

```bash
# Backend
cd /home/ruanlopes/Documents/ifroevents/backend
docker build -t ruanlopes1350/ifroevents-api:latest .
docker push ruanlopes1350/ifroevents-api:latest

# Frontend
cd /home/ruanlopes/Documents/ifroevents/frontend
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.mural.fslab.dev \
  --build-arg NEXT_PUBLIC_AMBIENTE=production \
  -t ruanlopes1350/ifroevents-front:latest .
docker push ruanlopes1350/ifroevents-front:latest
```

### No servidor: pull + restart

```bash
cd /opt/ifroevents
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 7. Comandos úteis no servidor

```bash
# Parar tudo
docker compose -f docker-compose.prod.yml down

# Parar e remover volumes (APAGA O BANCO!)
docker compose -f docker-compose.prod.yml down -v

# Reiniciar apenas um serviço
docker compose -f docker-compose.prod.yml restart api

# Rodar seed no backend
docker exec -it eventos-api node src/seeds/seeds.js

# Acessar shell de um container
docker exec -it eventos-api sh
docker exec -it eventos-front sh
```

---

## Estrutura final no servidor

```
/opt/ifroevents/
├── docker-compose.prod.yml   ← compose de produção
├── .env                      ← variáveis do backend
└── .env.local                ← variáveis do frontend
```

## Portas

| Serviço    | Porta | URL pública              |
| ---------- | ----- | ------------------------ |
| Frontend   | 3000  | https://mural.fslab.dev  |
| API        | 3001  | https://api.mural.fslab.dev |
| MongoDB    | —     | Sem acesso externo       |

> O MongoDB **não expõe porta** para fora da rede Docker no compose de produção, por segurança.
