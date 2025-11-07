// netlify/functions/buscarRecetas.js

const { MongoClient } = require('mongodb');
// Carga las variables de entorno para desarrollo local (ignorado en Netlify deploy)
require('dotenv').config(); 

// Variables de Conexión Segura
const uri = process.env.MONGO_URI; 
const DB_NAME = 'ChefExpressDB'; 
const COLLECTION_NAME = 'recetas';

// Caché de la conexión a la base de datos (Optimización Serverless)
let cachedDb = null;

/**
 * Conecta o reutiliza la conexión a MongoDB Atlas.
 */
async function connectToDatabase() {
  if (!uri) {
      throw new Error('MONGO_URI no está definida. Verifica tu archivo .env o Netlify CLI.');
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

// Lista de palabras clave a IGNORAR para el cálculo de coincidencia (etiquetas de categoría)
const EXCLUSIONES = [
    'desayuno', 'rápido', 'lento', 'vegetariano', 'vegano', 'italiano', 
    'mexicano', 'postre', 'sopa', 'invierno', 'verano', 'guarnición', 'bebida'
];

/**
 * Calcula el porcentaje de coincidencia para una receta dada la lista de ingredientes del usuario.
 * @param {Object} receta - Objeto receta de la BBDD.
 * @param {Array<string>} nombresIngredientesUsuario - Nombres simples de ingredientes del usuario.
 * @returns {Object} Objeto con porcentaje y lista de faltantes.
 */
function calcularMatching(receta, nombresIngredientesUsuario) {
    
    // 1. Filtrar solo los ingredientes reales de la receta
    const ingredientesReceta = receta.tags_busqueda.filter(tag => {
        const tagLower = tag.toLowerCase();
        // Incluye el tag si es lo suficientemente largo y NO está en la lista de exclusiones
        return tag.length > 2 && !EXCLUSIONES.some(exc => exc === tagLower);
    }); 
    
    const totalNecesarios = ingredientesReceta.length;
    let disponibles = 0;
    const faltantes = [];

    // Normaliza los nombres de los ingredientes del usuario a minúsculas
    const nombresUsuarioLower = nombresIngredientesUsuario.map(n => n.toLowerCase());

    // 2. Ejecutar la lógica de coincidencia
    for (const ingredienteNecesario of ingredientesReceta) {
        const necesarioLower = ingredienteNecesario.toLowerCase();
        
        // Comprobación de coincidencia (Busca si el ingrediente de la receta está en la lista del usuario)
        const encontrado = nombresUsuarioLower.some(nombreUsuario => 
            necesarioLower.includes(nombreUsuario) || 
            nombreUsuario.includes(necesarioLower)
        );

        if (encontrado) {
            disponibles++;
        } else {
            faltantes.push(ingredienteNecesario);
        }
    }

    const porcentaje = totalNecesarios > 0 
        ? Math.round((disponibles / totalNecesarios) * 100) 
        : 0;

    return { porcentaje, faltantes, totalNecesarios };
}

// --- HANDLER PRINCIPAL ---
exports.handler = async (event, context) => {
    // Evita que Netlify cierre la conexión a la DB prematuramente
    context.callbackWaitsForEmptyEventLoop = false; 

    if (event.httpMethod !== "POST") {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ message: "Método no permitido. Usa POST." }) 
        };
    }

    try {
        const db = await connectToDatabase(); 
        const ingredientesUsuario = JSON.parse(event.body);

        // 1. Preprocesar Ingredientes del Usuario: Obtenemos solo los nombres
        const nombresIngredientes = ingredientesUsuario.map(ing => ing.nombre); 

        // 2. Consulta Inicial a MongoDB
        const recetasCursor = db.collection(COLLECTION_NAME).find({
            tags_busqueda: { $in: nombresIngredientes }
        });
        
        const recetasEncontradas = await recetasCursor.toArray();

        // 3. Procesamiento y Matching
        const resultadosFinales = recetasEncontradas
            .map(receta => {
                const matching = calcularMatching(receta, nombresIngredientes);
                
                return {
                    id: receta._id,
                    titulo: receta.titulo,
                    tiempo_total: receta.tiempo_total || 'N/A',
                    coincidencia: `${matching.porcentaje}%`,
                    porcentajeValor: matching.porcentaje,
                    faltantes: matching.faltantes,
                };
            })
            // FILTRO MVP: Solo mostrar recetas con 50% o más de coincidencia
            .filter(receta => receta.porcentajeValor >= 50) 
            // Ordenar de mayor a menor coincidencia
            .sort((a, b) => b.porcentajeValor - a.porcentajeValor); 

        // 4. Devolver el resultado a React
        return {
            statusCode: 200,
            body: JSON.stringify(resultadosFinales)
        };

    } catch (error) {
        // Captura cualquier error, incluyendo fallas de conexión a MongoDB
        console.error("Error en la función buscarRecetas:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: "Error interno del servidor.", 
                error: error.message 
            })
        };
    }
};