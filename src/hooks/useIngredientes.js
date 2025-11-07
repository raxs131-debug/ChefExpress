import { useState, useEffect } from 'react';
import localForage from 'localforage';

// Clave única para guardar la lista en el almacenamiento local
const STORAGE_KEY = 'chefExpress_ingredientes';

/**
 * Hook personalizado para manejar y persistir la lista de ingredientes del usuario.
 * @returns {[Array, Function, Boolean]} [listaIngredientes, setListaIngredientes, estaCargando]
 */
        export function useIngredientes() {
        const [listaIngredientes, setListaIngredientes] = useState([]);
        const [estaCargando, setEstaCargando] = useState(true);

        // 1. Efecto para Cargar la lista al montar el componente
        useEffect(() => {
            localForage.getItem(STORAGE_KEY)
            .then((data) => {
                // Si hay datos, los carga. Si no, inicializa con un array vacío.
                if (data) {
                setListaIngredientes(data);
                }
            })
            .catch((err) => {
                console.error("Error al cargar ingredientes desde localForage:", err);
            })
            .finally(() => {
                // Marca la carga como completada, independientemente del éxito o fracaso
                setEstaCargando(false);
            });
        }, []); // Se ejecuta solo una vez al inicio

        // 2. Efecto para Guardar la lista al cambiar el estado
        useEffect(() => {
            // Solo guarda si no está en el proceso inicial de carga
            if (!estaCargando) {
            localForage.setItem(STORAGE_KEY, listaIngredientes)
                .catch((err) => {
                console.error("Error al guardar ingredientes en localForage:", err);
                });
            }
        }, [listaIngredientes, estaCargando]); // Se ejecuta cada vez que la lista o el estado de carga cambia

        return [listaIngredientes, setListaIngredientes, estaCargando];
        }