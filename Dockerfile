# Základní obraz Node.js
FROM node:14

# Vytvoření adresáře aplikace
WORKDIR /usr/src/app

# Instalace závislostí aplikace
# Symbol * je použit pro kopírování jak package.json, tak package-lock.json
COPY package*.json ./

RUN npm install
# Pokud vytváříte produkční build, použijte:
# RUN npm ci --only=production

# Kopírování zdrojových souborů aplikace do obrazu
COPY . .

# Vaše aplikace bude běžet na portu 3000
EXPOSE 3000

# Příkaz pro spuštění aplikace
CMD [ "node", "server.js" ]
