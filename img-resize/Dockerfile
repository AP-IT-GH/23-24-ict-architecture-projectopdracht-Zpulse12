# Gebruik een Node.js image als basis
FROM node:20-bullseye as build

# Stel de werkdirectory in
WORKDIR /img-resize

# Kopieer package.json en package-lock.json naar de container
COPY package.json package-lock.json ./

# Installeer de afhankelijkheden
RUN npm install --frozen-lockfile

# Kopieer de rest van de applicatiecode
COPY . .

# Start de applicatie
CMD ["node", "./index.js"]
