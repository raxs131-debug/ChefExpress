import React from 'react';

// Componente Modal para mostrar los detalles de una receta
function RecetaDetalle({ receta, onClose }) {
    if (!receta) return null; // No renderizar si no hay receta

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{receta.titulo}</h2>
                    <button onClick={onClose} className="close-button">❌</button>
                </div>
                
                <div className="modal-body">
                    <p className="recipe-meta">
                        Tiempo total: **{receta.tiempo_total || 'N/A'}**
                    </p>

                    <h4>Ingredientes 🥕</h4>
                    <ul className="ingredient-detail-list">
                        {receta.ingredientes && receta.ingredientes.map((ing, index) => (
                            <li key={index}>
                                **{ing.cantidad}** de {ing.nombre}
                            </li>
                        ))}
                    </ul>

                    <h4>Instrucciones 📝</h4>
                    <ol className="instructions-list">
                        {receta.instrucciones && receta.instrucciones.map((instr, index) => (
                            <li key={index}>{instr}</li>
                        ))}
                    </ol>

                    <p className="recipe-tags">
                        **Etiquetas:** {receta.tags_busqueda && receta.tags_busqueda.join(', ')}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RecetaDetalle;