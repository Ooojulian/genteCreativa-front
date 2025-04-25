// frontend/src/components/Cliente/InventarioCliente.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { getInventarioEmpresa } from '../../services/api';
import styles from '../../styles/Cliente/InventarioCliente.module.css'; // Ajusta la ruta
import { formatDistanceToNowStrict } from 'date-fns'; // <-- Importar date-fns
import { es } from 'date-fns/locale'; 

// Interfaz para el inventario recibido
interface InventarioItem {
    id: number;
    producto_nombre: string;    // <-- Nombre corregido
    //ubicacion_nombre: string;   // <-- Nombre corregido
    producto_id_read?: number;  // <-- ID para lectura (opcional)
    cantidad: number;
    //fecha_actualizacion: string;
    fecha_creacion: string; 
}

const calculateTimeStored = (creationDateString: string | null): string => {
    if (!creationDateString) return 'N/A';
    try {
        const creationDate = new Date(creationDateString);
        // Usa formatDistanceToNowStrict para obtener "X días", "Y meses", etc.
        return formatDistanceToNowStrict(creationDate, { addSuffix: false, locale: es }); // 'addSuffix: false' para quitar "hace", 'locale: es' para español
    } catch (e) {
        console.error("Error calculando tiempo almacenado:", creationDateString, e);
        return "Fecha inválida";
    }
};

// Función para formatear fecha (puedes tenerla en un archivo utils)
const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return 'N/A';
    try { const date = new Date(isoString); return date.toLocaleString(); }
    catch (e) { return isoString; }
}

const InventarioCliente: React.FC = () => {
    const [inventario, setInventario] = useState<InventarioItem[]>([]); // Usa interfaz actualizada
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInventario = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getInventarioEmpresa();
                // Mapea los datos recibidos a la interfaz local InventarioItem
                // TypeScript debería quejarse si data no incluye fecha_creacion ahora
                const processedData: InventarioItem[] = data.map(item => ({
                    id: item.id,
                    producto_nombre: item.producto_nombre,
                    cantidad: item.cantidad,
                    fecha_creacion: item.fecha_creacion, // Asegúrate que este campo venga
                    producto_id_read: item.producto_id_read
                }));
                 setInventario(processedData);
            } catch (err: any) {
                console.error("Error al cargar inventario:", err.response || err);
                setError(err.response?.data?.detail || err.message || "No se pudo cargar el inventario.");
                setInventario([]);
            } finally {
                setLoading(false);
            }
        };
        fetchInventario();
    }, []);

    if (loading) return <div>Cargando inventario...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Inventario de tu Empresa</h3>
            {inventario.length === 0 ? (
                <p className={styles.emptyMessage}>No hay inventario registrado para tu empresa.</p>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.inventoryTable}>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                {/* <th>Ubicación</th> */} {/* <-- ELIMINADO */}
                                <th>   Cantidad   </th>
                                <th>   Tiempo Almacenado   </th> {/* <-- ENCABEZADO CAMBIADO */}
                            </tr>
                        </thead>
                        <tbody>
                            {inventario.map(item => (
                                <tr key={item.id}>
                                    <td>{item.producto_nombre}</td>
                                    {/* <td>{item.ubicacion_nombre}</td> */} {/* <-- ELIMINADO */}
                                    <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                                    {/* --- Celda modificada para mostrar tiempo --- */}
                                    <td style={{ textAlign: 'center', fontSize: '0.9em', color: '#555' }}>
                                        {calculateTimeStored(item.fecha_creacion)}
                                    </td>
                                    {/* ------------------------------------------- */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default InventarioCliente;