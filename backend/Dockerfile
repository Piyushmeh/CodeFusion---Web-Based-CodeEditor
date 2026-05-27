FROM node:20

RUN apt-get update && apt-get install -y default-jdk python3 gcc g++ && apt-get clean

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 5000
CMD ["npm", "start"]