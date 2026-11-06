FROM node:20-alpine

WORKDIR /app

# Copia os arquivos de dependências e instala (incluindo devDependencies para o build)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copia o código-fonte e roda o build do projeto
COPY . .
RUN npm run build

# Instala o servidor leve 'serve' caso o projeto gere pasta estática (Vite/React)
RUN npm install -g serve

ENV PORT=8080
EXPOSE 8080

# Se for Vite (pasta dist), serve a pasta dist; se for Create React App (pasta build), serve build; se for Next.js/Node, roda npm start
CMD ["sh", "-c", "if [ -d dist ]; then serve -s dist -l 8080; elif [ -d build ]; then serve -s build -l 8080; else npm start -- -p 8080; fi"]
