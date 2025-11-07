import React, { useState } from 'react'; 
import { useIngredientes } from './hooks/useIngredientes'; 
import InputIngrediente from './components/InputIngrediente'; 
import RecetaDetalle from './components/RecetaDetalle'; // Importación necesaria
import './App.css'; 

function App() {
  // 1. Estados principales
  const [ingredientes, setIngredientes, estaCargando] = useIngredientes();
  const [recetas, setRecetas] = useState([]); 
  const [estaBuscando, setEstaBuscando] = useState(false); 
  // NUEVO ESTADO: Guarda la receta completa cuando el usuario la selecciona
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null); 
  
  // 2. Manejadores de Ingredientes
  const handleAgregarIngrediente = (nuevoIngrediente) => {
    // Evita duplicados por nombre
    if (ingredientes.some(ing => ing.nombre.toLowerCase() === nuevoIngrediente.nombre.toLowerCase())) {
        console.log(`El ingrediente ${nuevoIngrediente.nombre} ya existe.`);
        return;
    }
    setIngredientes([...ingredientes, nuevoIngrediente]);
  };
  
  const eliminarIngrediente = (id) => {
    const nuevosIngredientes = ingredientes.filter(ing => ing.id !== id);
    setIngredientes(nuevosIngredientes);
    if (nuevosIngredientes.length === 0) {
        setRecetas([]);
    }
  };
  
  // NUEVA FUNCIÓN: Limpia todos los ingredientes y resultados
  const limpiarListaCompleta = () => {
    // Usamos el hook para resetear el estado y el Firestore (incluye la lógica de borrado en el hook)
    setIngredientes([]); 
    // Limpiamos los resultados y el modal
    setRecetas([]);
    setRecetaSeleccionada(null); 
  };


  // 3. FUNCIÓN: Obtiene la receta completa del back-end
  const verDetalle = async (recetaId) => {
    setRecetaSeleccionada(null); // Limpiar cualquier modal anterior
    
    try {
        // Llama a la nueva Netlify Function: obtenerReceta
        const response = await fetch(`/.netlify/functions/obtenerReceta?id=${recetaId}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error HTTP al obtener detalle: ${response.status} - ${errorText}`);
        }

        const recetaCompleta = await response.json();
        // Muestra el modal
        setRecetaSeleccionada(recetaCompleta); 

    } catch (error) {
        console.error("Error al obtener detalle de receta:", error);
        // Opcional: mostrar un mensaje de error al usuario
    }
  };
  
  // 4. FUNCIÓN: Buscar recetas (se mantiene igual)
  const buscarRecetas = async () => {
    if (ingredientes.length === 0) {
      console.error("¡Agrega al menos un ingrediente para buscar!");
      return;
    }
    setEstaBuscando(true); 
    setRecetas([]); 
    setRecetaSeleccionada(null); // Asegurar que no hay modal abierto

    try {
      // Nota: Esta llamada va a la función Netlify que interactúa con MongoDB
      const response = await fetch('/.netlify/functions/buscarRecetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredientes), 
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setRecetas(data);
      console.log("Recetas recibidas:", data);

    } catch (error) {
      console.error("Error al buscar recetas:", error);
    } finally {
      setEstaBuscando(false);
    }
  };

  // 5. Renderizado
  if (estaCargando) {
    return <div className="app-container"><p>Cargando tus ingredientes...</p></div>;
  }

  return (
    <div className="app-container">
      <h1>🍽️ Chef Express</h1>
      <p><i>¡PWA Lista para funcionar offline y conectarse al backend!</i></p>

      {/* FORMULARIO DE INGREDIENTE */}
      <InputIngrediente onAdd={handleAgregarIngrediente} />

      {/* SECCIÓN DE INGREDIENTES */}
      <div className="ingredient-header">
        <h2>Mi Refrigerador ({ingredientes.length} items)</h2>
        {ingredientes.length > 0 && (
            <button 
                onClick={limpiarListaCompleta}
                className="clear-all-button"
                aria-label="Limpiar todos los ingredientes"
            >
                🧹 Limpiar Todo
            </button>
        )}
      </div>

      {ingredientes.length === 0 ? (
        <p>¡Tu lista está vacía! Agrega algo para empezar.</p>
      ) : (
        <ul className="ingredient-list">
          {ingredientes.map((ing) => (
            <li key={ing.id}>
              <span>
                **{ing.nombre}** - Tienes: {ing.cantidad_relativa}
              </span>
              <button 
                onClick={() => eliminarIngrediente(ing.id)}
                className="delete-button"
                aria-label={`Eliminar ${ing.nombre}`}
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* BOTÓN DE BÚSQUEDA */}
      <div className="search-button-container">
        <button 
          onClick={buscarRecetas} 
          disabled={ingredientes.length === 0 || estaBuscando}
        >
          {estaBuscando ? 'Buscando...' : '🔍 ¡Encuentra mi Receta!'}
        </button>
      </div>
      
      {/* SECCIÓN DE RESULTADOS DE RECETAS */}
      {recetas.length > 0 && (
        <div className="results-section">
          <h3>Sugerencias Encontradas ({recetas.length})</h3>
          <ul className="recipe-list">
            {recetas.map((r) => (
              // Contenedor clicable para mostrar el detalle
              <li 
                key={r.id} 
                className="recipe-item" 
                onClick={() => verDetalle(r.id)} // Llama a verDetalle con el ID de MongoDB
              > 
                <span className="recipe-title clickable-title">
                    **{r.titulo}**
                </span> 
                <span className="recipe-match"> - Coincidencia: {r.coincidencia}</span> 
                {r.faltantes && r.faltantes.length > 0 && (
                  <span className="recipe-missing"> (Falta: {r.faltantes.join(', ')})</span>
                )}
                <span className="view-details">Ver más →</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {recetas.length === 0 && !estaBuscando && ingredientes.length > 0 && (
        <p className="no-results-message">No se encontraron recetas con 50% o más de coincidencia.</p>
      )}

      {/* MODAL DE DETALLE DE RECETA */}
      {recetaSeleccionada && (
        <RecetaDetalle 
          receta={recetaSeleccionada} 
          onClose={() => setRecetaSeleccionada(null)} // Función para cerrar el modal
        />
      )}
    </div>
  );
}

export default App;