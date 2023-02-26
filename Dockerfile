FROM node:latest
WORKDIR /app
COPY package*.json /app
RUN npm install
ADD . /app
ENV mongo_address="MONGO_ADDRESS=mongodb+srv://2000shim:IzzuGRpkYGjVjcRd@cluster0.xkrv3vz.mongodb.net/todoapp?retryWrites=true&w=majority"
CMD [ "npm", "start" ]
EXPOSE 3000