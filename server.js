const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT
const bodyParser = require('body-parser');
const app = express();
const { connectToMongodb, disconnectFromMongodb } = require('./src/mongodb');
app.use(bodyParser.json()); //ver para que son estas configuraciones
app.use(bodyParser.urlencoded({ extended: true })); //idem


//ver estas configuraciones
app.use((req, res, next) => {
    res.header("Content-Type", "application/json; charset=utf-8");
    next();
});

//endpoints
//endpoint que devuelve todos los documentos
app.get('/prendas', async (req, res) => {
    const client = await connectToMongodb();
    if (!client) {
        res.status(500).send('Error al conectarse a MongoDB');
    };
    const db = client.db('prendas');
    const prendas = await db.collection('prendas').find().toArray();
    await disconnectFromMongodb();
    res.json(prendas);
});


//busqueda por codigo
app.get('/prendas/codigo/:codigo', async (req, res) => {
    const codPrenda = parseInt(req.params.codigo) || 0;
    const client = await connectToMongodb();
    if (!client) {
        res.status(500).send('Error al conectarse a MongoDB');
    };
    const db = client.db('prendas');
    const prenda = await db.collection('prendas').findOne({ codigo: codPrenda }); //si no pongo el await, cierra la conexion antes de completar la operacion y falla, OJO
    await disconnectFromMongodb();
    prenda != null ? res.json(prenda) : res.status(404).json('No se encontro un elemento con el codigo: ' + codPrenda);
});


//busqueda por nombre //busca por nombre exacto, case sensitive
app.get('/prendas/nombre/:nombre', async (req, res) => { //PODRIA HACERLO CON INCLUDES
    const nombrePrenda = req.params.nombre;
    const client = await connectToMongodb();
    if (!client) {
        res.status(500).send('Error al conectarse a MongoDB');
    };
    const db = client.db('prendas');
    const patron = new RegExp(nombrePrenda, 'i');
    const prenda = await db.collection('prendas').find({ nombre: patron }).toArray(); //si no pongo el await, cierra la conexion antes de completar la operacion y falla, OJO
    await disconnectFromMongodb();
    prenda.length > 0 ? res.json(prenda) : res.status(404).json('No se encontro un elemento con el nombre: ' + nombrePrenda);
});


//inserta nueva prenda
app.post('/prendas', async (req, res) => {
    const nuevaPrenda = req.body;
    if (Object.keys(nuevaPrenda).length === 0) {
        res.status(400).send('No se enviaron datos válidos en el cuerpo de la solicitud');
        return;
    };
    const client = await connectToMongodb();
    if (!client) {
        res.status(500).send('Error al conectrse a MongoDB');
    };
    const db = client.db('prendas');
    const coleccion = db.collection('prendas').insertOne(nuevaPrenda)
        .then(() => {
            console.log('Nueva prenda creada');
            res.status(201).send(nuevaPrenda);
        }).catch(error => {
            console.log(error);
        }).finally(() => {
            client.close();
        });
});


//modifica una prenda enviada por id
app.put('/prendas/:codigo', async (req, res) => {
    const codigoParam = parseInt(req.params.codigo);
    const nuevosDatos = req.body;
    if (Object.keys(nuevosDatos).length === 0) { //chequea que no sea un objeto vacio, si chequeo con vacio o con undefined, no va a funcionar, con !nuevosdatos va a dar true porque va a haber un objeto vacio y con === undefined va a dar true por lo mismo
        res.status(400).send('No se enviaron datos válidos en el cuerpo de la solicitud');
        return;
    };

    const client = await connectToMongodb();
    if (!client) {
        res.status(500).send('Error al conectrse a MongoDB');
    };

    const db = client.db('prendas');
    const coleccion = db.collection('prendas').updateOne({ codigo: codigoParam }, { $set: nuevosDatos })
        .then(() => {
            let mensaje = 'Prenda actualizada, CODIGO: ' + codigoParam;
            res.status(200).json({ descripcion: mensaje, objeto: nuevosDatos });
        }).catch(err => {
            let mensaje = 'Error al actualizar ID: ' + id
            console.error(err);
            res.status(500).json({ descripcion: mensaje, objeto: nuevosDatos });
        }).finally(() => {
            client.close()
        });
});


//elimina una prenda
app.delete('/prendas/:codigo', async (req, res) => {
    const codigoParam = parseInt(req.params.codigo);

    client = await connectToMongodb();
    if (!client) {
        res.status(500).send('Error al conectarse a MongoBD');
        return;
    };

    const coleccion = client.db('prendas').collection('prendas')
    return coleccion.deleteOne({ codigo: codigoParam })
        .then((resultado) => {
            if (resultado.deletedCount === 0) {
                res.status(404).send('NO se pudo encontrar la prenda con codigo: ' + codigoParam);
            } else {
                res.status(204).send('prenda eliminada'); //no me muestra la respuesta
                console.log('prenda eliminada');
            }
        }).catch((err) => {
            res.status(500).send('Error al eliminar la prenda,' + err);
        }).finally(() => {
            client.close();
        })
});




app.get("*", (req, res) => {
    res.json({ error: "404", message: "No se encontro la ruta solicitada" });
});

app.listen(PORT, () => console.log(`API de prendas escuchando en http://localhost:${PORT}`));