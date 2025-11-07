// src/components/InputIngrediente.jsx
import React, { useState } from 'react';

// Estilos básicos para claridad (puedes moverlos a CSS)
const formStyle = { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px', 
    padding: '15px', 
    border: '1px solid #444', 
    borderRadius: '8px',
    margin: '15px 0' 
};
const inputGroupStyle = { display: 'flex', gap: '10px' };

function InputIngrediente({ onAdd }) {
    const [nombre, setNombre] = useState('');
    const [cantidadRelativa, setCantidadRelativa] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!nombre.trim()) {
            alert("El nombre del ingrediente es obligatorio.");
            return;
        }

        // Llamamos a la función onAdd que viene del padre (App.jsx)
        onAdd({
            id: Date.now().toString(),
            nombre: nombre.trim(),
            cantidad_relativa: cantidadRelativa.trim() || "cantidad desconocida",
            cantidad_exacta: null,
            unidad_exacta: null
        });

        // Limpiar el formulario
        setNombre('');
        setCantidadRelativa('');
    };

    return (
        <form onSubmit={handleSubmit} style={formStyle}>
            <h4>Añadir Ingrediente 🛒</h4>
            
            <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre (ej. Pollo, Cebolla)"
                required
            />
            
            <div style={inputGroupStyle}>
                <input
                    type="text"
                    value={cantidadRelativa}
                    onChange={(e) => setCantidadRelativa(e.target.value)}
                    placeholder="Cantidad (ej. 1 pechuga, un puñado)"
                    style={{ flexGrow: 1 }}
                />
            </div>

            <button type="submit" style={{ padding: '10px' }}>
                + Agregar a Mi Refrigerador
            </button>
        </form>
    );
}

export default InputIngrediente;