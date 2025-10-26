# Usando a imagem base do Node.js 22 (Precisa ser a 22, pois a 22-alpine não suporta a execução mongodb-memory-server)
FROM node:22

# Expõe a porta 5015 para a plataforma de divulgação de eventos
EXPOSE 5015

# Cria a pasta de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos de dependências para dentro do contêiner
COPY package.json package-lock.json ./

# Instala as dependências da aplicação
RUN npm ci

# Copia todo o código da aplicação para o contêiner
COPY . .

# Comando para rodar a aplicação dentro do container
CMD [ "npm", "run", "start:local" ]
