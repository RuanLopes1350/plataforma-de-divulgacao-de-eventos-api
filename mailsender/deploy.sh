#!/usr/bin/env bash
set -e

# --- 1) Pede a mensagem de commit ---
echo -n "Digite a mensagem de commit para o git: "
read -r COMMIT_MSG
if [[ -z "$COMMIT_MSG" ]]; then
  echo "✋ Mensagem de commit vazia — abortando."
  exit 1
fi

# --- 2) Faz commit e push no repositório local - Só commitar se houver algo staged, cheque antes se há diferenças no index:---
git add .
if ! git diff --cached --quiet; then
  git commit -m "$COMMIT_MSG"
else
  echo "⚠️ Nada novo para commitar"
fi
git push origin master

# --- 3) Definições dos hosts e caminhos remotos ---
ALIASES=("edurondon" "ifro")
HOSTNAMES=("edurondon.tplinkdns.com" "cloud.fslab.dev")
PORTS=(2281 4155)
USERS=("gilberto" "gilberto")
KEYS=("$HOME/.ssh/id_ed25519" "$HOME/.ssh/id_ed25519")
REMOTE_PATHS=(
  "/media/gilberto/8ec83127-285d-48ea-a16b-431c3e64447a/repositorio/0-0.2-mail_api_service"
  "/home/gilberto/aula/repositorios/@@repositorios_oficial-verificado/0-0.2-mail_api_service"
)

# --- 4) Loop de deploy remoto ---
for i in "${!ALIASES[@]}"; do
  ALIAS=${ALIASES[i]}
  HOST=${HOSTNAMES[i]}
  PORT=${PORTS[i]}
  USER=${USERS[i]}
  KEY=${KEYS[i]}
  REMOTE=${REMOTE_PATHS[i]}

  echo "⏳ Deploy em [$ALIAS] $USER@$HOST:$PORT ..."

 ssh -t -i "$KEY" -p "$PORT" "$USER@$HOST" <<EOF
  cd $REMOTE
  git pull origin master
  docker compose up -d --build --force-recreate
EOF

  echo "✅ Deploy concluído em [$ALIAS]."
done
