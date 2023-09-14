const dotenv = require('dotenv');
dotenv.config();
const { MongoClient } = require('mongodb');
const URI = process.env.MONGODB_URLSTRING;
const client = new MongoClient(URI);


async function connectToMongodb(){
    try {
        await client.connect();
        console.log('Conectado');
        return client;
    } catch (error) {
        console.log('Error al conectarse a MongoDB', error);
        return null;
    }
}

async function disconnectFromMongodb(){
    try {
        await client.close();
        console.log('Desconectado');
    } catch (error) {
        console.log('Error al desconectarse de MongoDB', error);
    }
}

module.exports = { connectToMongodb, disconnectFromMongodb};
