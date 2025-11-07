const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config(); 

const uri = process.env.MONGO_URI; 
const DB_NAME = 'ChefExpressDB';
const COLLECTION_NAME = 'recetas';

let cachedDb = null;

async function connectToDatabase() {
    if (!uri) {
        throw new Error('MONGO_URI no está definida.');
    }
    if (cachedDb) {
        return cachedDb;
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(DB_NAME);
    cachedDb = db;
    return db;
}

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false; 

    if (event.httpMethod !== "GET") {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ message: "Método no permitido. Usa GET." }) 
        };
    }

    // El ID de la receta vendrá como query parameter (ej: /obtenerReceta?id=123)
    const recetaId = event.queryStringParameters.id;

    if (!recetaId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Se requiere un ID de receta." })
        };
    }

    try {
        const db = await connectToDatabase();
        
        // Usamos ObjectId para buscar por _id en MongoDB
        const receta = await db.collection(COLLECTION_NAME).findOne({ 
            _id: new ObjectId(recetaId) 
        });

        if (!receta) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Receta no encontrada." })
            };
        }

        // Devolvemos el documento completo de la receta
        return {
            statusCode: 200,
            body: JSON.stringify(receta)
        };

    } catch (error) {
        console.error("Error al obtener receta:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: "Error interno del servidor.", 
                error: error.message 
            })
        };
    }
};