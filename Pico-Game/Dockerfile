FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (mejor cache de capas)
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el resto del código y assets del juego
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
