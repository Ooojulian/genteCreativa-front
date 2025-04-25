// frontend/src/components/Inventario/GestionInventario.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    getInventarioJefe, createInventario, updateInventario, deleteInventario,
    getProductos, getUbicaciones, getEmpresas
} from '../../services/api'; // Ajusta la ruta si es necesario
// --- Importa los estilos ---
import styles from '../../styles/Inventario/GestionInventario.module.css'; // <-- Ajusta la ruta a tu archivo CSS

// --- Interfaces ---
interface EmpresaData { id: number; nombre: string; /* ...otros? */ }
interface ProductoDataOutput { id: number; nombre: string; sku: string; }
interface UbicacionDataOutput { id: number; nombre: string; }

// --- INTERFAZ LOCAL ACTUALIZADA ---
// Refleja los datos que SÍ vienen de la API
interface InventarioItem { // O el nombre que uses para el useState
    id: number;
    producto_nombre: string;    // <-- ¿Está así?
    ubicacion_nombre: string;   // <-- ¿Está así?
    producto_id_read?: number;
    cantidad: number;
    fecha_actualizacion: string;
    empresa: { id: number; nombre: string; } | null; // Asume EmpresaData definida o importada
    // Los siguientes son opcionales si no los usas aquí
    // producto_id?: number;
    // ubicacion_id?: number;
}
// ---------------------------------

// Interfaces para Crear/Actualizar (no cambian)
interface InventarioCreateInput { producto_id: number; ubicacion_id: number; cantidad: number; empresa_id: number; }
interface InventarioUpdateInput { cantidad: number; }

// Función formateo fecha
const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return '--';
    try { const date = new Date(isoString); return date.toLocaleString('es-ES'); }
    catch (e) { console.error("Error date format:", e); return isoString; }
};

const GestionInventario: React.FC = () => {
    // --- Estados ---
    const [inventario, setInventario] = useState<InventarioItem[]>([]); // Usa la interfaz actualizada
    const [productos, setProductos] = useState<ProductoDataOutput[]>([]);
    const [ubicaciones, setUbicaciones] = useState<UbicacionDataOutput[]>([]);
    const [empresasCliente, setEmpresasCliente] = useState<EmpresaData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOptionsLoading, setIsOptionsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingInventario, setEditingInventario] = useState<InventarioItem | null>(null); // Usa la interfaz actualizada
    // Estados del formulario
    const [id, setId] = useState<number | null>(null);
    const [productoId, setProductoId] = useState<number | string>('');
    const [ubicacionId, setUbicacionId] = useState<number | string>('');
    const [cantidad, setCantidad] = useState<number | string>('');
    const [empresaId, setEmpresaId] = useState<number | string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // --- Lógica (Fetch, Handlers) ---
    const fetchSelectOptions = useCallback(async () => {
        setIsOptionsLoading(true); setError(null); // Limpia error general al cargar opciones
        try {
            const [prodsData, ubiData, empData] = await Promise.all([getProductos(), getUbicaciones(), getEmpresas()]);
            setProductos(prodsData); setUbicaciones(ubiData); setEmpresasCliente(empData);
        } catch (e: any) { setError(e.message || "Error al cargar opciones de filtro."); console.error("Error filtros:", e); }
        finally { setIsOptionsLoading(false); }
    }, []);

    const fetchInventario = useCallback(async () => {
        setIsLoading(true); setError(null); setFormSuccess(null);
        try {
            const data = await getInventarioJefe(); // Usa la función API que devuelve InventarioDataOutput[]
            console.log("[GestionInventario] RAW DATA RECIBIDA:", data);
            setInventario(data as any[]);
            // TypeScript debería permitirlo si InventarioDataOutput en api.ts es compatible
            console.log("[GestionInventario] RAW DATA RECIBIDA:", data);
            //setInventario(data);
        } catch (err: any) { setError(err.message || "Error al cargar inventario"); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => {
        fetchSelectOptions();
        fetchInventario();
    }, [fetchInventario, fetchSelectOptions]);

    const resetForm = () => { setEditingInventario(null); setId(null); setProductoId(''); setUbicacionId(''); setCantidad(''); setEmpresaId(''); setShowForm(false); setFormError(null); setFormSuccess(null); setIsSubmitting(false); };

    const handleEditClick = (item: InventarioItem) => { // Usa tipo actualizado
        if (showForm && editingInventario?.id === item.id) { resetForm(); return; }
        setShowForm(true);
        setEditingInventario(item);
        setId(item.id);
        setCantidad(item.cantidad);
        setProductoId(''); setUbicacionId(''); setEmpresaId('');
        setFormError(null); setFormSuccess(null);
        window.scrollTo(0, 0);
    };
    const handleCreateClick = () => { if (showForm && !editingInventario) { resetForm(); } else { resetForm(); setShowForm(true); window.scrollTo(0, 0); } };

    const handleDeleteClick = async (inventarioId: number, itemInfo: string) => {
        setError(null); setFormSuccess(null);
        if (window.confirm(`¿Seguro eliminar inventario: "${itemInfo}" (ID: ${inventarioId})?`)) {
            setIsLoading(true);
            try {
                await deleteInventario(inventarioId);
                setFormSuccess(`Inventario ID: ${inventarioId} eliminado.`);
                fetchInventario();
            } catch (err: any) { const errorMsg = err.response?.data?.detail || err.message || `Error al eliminar inventario ID: ${inventarioId}`; setError(errorMsg); console.error(`Error delete API ID: ${inventarioId}:`, errorMsg, err.response || err); }
            finally { setIsLoading(false); }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);

        if (editingInventario && id) { // Actualizar Cantidad
            const numCantidad = Number(cantidad);
            if (cantidad === '' || isNaN(numCantidad) || numCantidad < 0) { setFormError("La cantidad debe ser un número positivo."); setIsSubmitting(false); return; }
            if (numCantidad === editingInventario.cantidad) { setFormError("La cantidad no ha cambiado."); setIsSubmitting(false); return; }
            const updateData: InventarioUpdateInput = { cantidad: numCantidad };
            try {
                const invActualizado = await updateInventario(id, updateData);
                setFormSuccess(`Inventario ID: ${invActualizado.id} actualizado.`);
                resetForm(); fetchInventario();
            } catch (err: any) { setFormError(err.message || "Error al actualizar."); console.error("Update error:", err); }
            finally { setIsSubmitting(false); }
        } else { // Crear Nuevo
            if (!productoId || !ubicacionId || cantidad === '' || !empresaId) { setFormError("Producto, Ubicación, Cantidad y Empresa Cliente son requeridos."); setIsSubmitting(false); return; }
            const numCantidad = Number(cantidad);
            if (isNaN(numCantidad) || numCantidad < 0) { setFormError("Cantidad debe ser número positivo."); setIsSubmitting(false); return; }
            const createData: InventarioCreateInput = { producto_id: Number(productoId), ubicacion_id: Number(ubicacionId), cantidad: numCantidad, empresa_id: Number(empresaId) };
            try {
                const nuevoInv = await createInventario(createData);
                setFormSuccess(`Inventario ID: ${nuevoInv.id} creado.`);
                resetForm(); fetchInventario();
            } catch (err: any) {
                const backendErrors = err.response?.data; let errorMsg = err.message || "Error al crear.";
                if (typeof backendErrors === 'object' && backendErrors !== null) { errorMsg = Object.entries(backendErrors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(',') : v}`).join('; ') || "Error validación"; }
                setFormError(errorMsg); console.error("Create error:", err);
            } finally { setIsSubmitting(false); }
        }
    };

    // --- Renderizado ---
    return (
        <div className={styles.gestionContainer}> {/* Clase principal */}
            <h3>Gestionar Inventario</h3>
            {/* Botón Crear */}
            {!editingInventario && (
                <button onClick={handleCreateClick} className={`${styles.commonButton} ${showForm ? styles.cancelButton : styles.createButton}`}>
                    {showForm ? 'Cancelar Registro' : '+ Registrar Nuevo Inventario'}
                </button>
            )}

            {/* Formulario unificado */}
            {showForm && (
                isOptionsLoading && !editingInventario ? <p>Cargando opciones...</p> :
                    <form onSubmit={handleSubmit} className={styles.inventoryForm}> {/* Clase form */}
                        <h4>{editingInventario ? `Editando Cantidad Inventario ID: ${id}` : 'Registrar Nuevo Inventario'}</h4>

                        {/* Producto */}
                        <div className={styles.inputGroup}>
                            <label htmlFor="inv-prod" className={styles.label}>Producto:*</label>
                            {editingInventario ? (
                                // Muestra nombre correcto en edición
                                <div className={styles.infoText}>{editingInventario.producto_nombre} <small>(No editable)</small></div>
                            ) : (
                                <select id="inv-prod" value={productoId} onChange={e => setProductoId(e.target.value)} required className={styles.select} disabled={productos.length === 0}> <option value="" disabled>-- Selecciona --</option> {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>)} </select>
                            )}
                            {productos.length === 0 && !editingInventario && <small style={{ color: 'orange' }}> No hay productos.</small>}
                        </div>

                        {/* Ubicación */}
                        <div className={styles.inputGroup}>
                            <label htmlFor="inv-ubi" className={styles.label}>Ubicación:*</label>
                            {editingInventario ? (
                                // Muestra nombre correcto en edición
                                <div className={styles.infoText}>{editingInventario.ubicacion_nombre} <small>(No editable)</small></div>
                            ) : (
                                <select id="inv-ubi" value={ubicacionId} onChange={e => setUbicacionId(e.target.value)} required className={styles.select} disabled={ubicaciones.length === 0}> <option value="" disabled>-- Selecciona --</option> {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)} </select>
                            )}
                            {ubicaciones.length === 0 && !editingInventario && <small style={{ color: 'orange' }}> No hay ubicaciones.</small>}
                        </div>

                        {/* Cantidad */}
                        <div className={styles.inputGroup}>
                            <label htmlFor="inv-cant" className={styles.label}>Cantidad:*</label>
                            <input id="inv-cant" type="number" min="0" step="1" value={cantidad} onChange={e => setCantidad(e.target.value)} required className={styles.input} />
                        </div>

                        {/* Empresa Cliente */}
                        <div className={styles.inputGroup}>
                            <label htmlFor="inv-emp" className={styles.label}>Empresa Cliente (Dueña):*</label>
                            {editingInventario ? (
                                <div className={styles.infoText}>{editingInventario.empresa?.nombre || '[Sin Empresa]'} <small>(No editable)</small></div>
                            ) : (
                                <select id="inv-emp" value={empresaId} onChange={e => setEmpresaId(e.target.value)} required className={styles.select} disabled={empresasCliente.length === 0}> <option value="" disabled>-- Selecciona --</option> {empresasCliente.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)} </select>
                            )}
                            {empresasCliente.length === 0 && !editingInventario && <small style={{ color: 'orange' }}> No hay empresas cliente.</small>}
                        </div>

                        {/* Mensajes y Botones */}
                        {formError && <p className={styles.formError}>{formError}</p>}
                        {formSuccess && !isSubmitting && <p className={styles.formSuccess}>{formSuccess}</p>}
                        <button type="submit" disabled={isSubmitting || (isOptionsLoading && !editingInventario)} className={`${styles.commonButton} ${styles.submitButton}`}>{isSubmitting ? 'Guardando...' : (editingInventario ? 'Actualizar Cantidad' : 'Registrar Inventario')}</button>
                        <button type="button" onClick={resetForm} className={`${styles.commonButton} ${styles.cancelButton}`}>Cancelar</button>
                    </form>
            )}

            {/* Lista de Inventario */}
            <h4>Inventario Registrado</h4>
            {formSuccess && !showForm && <p className={styles.formSuccess}>{formSuccess}</p>}
            {error && <p className={styles.formError}>{error}</p>}
            {isLoading ? (<p>Cargando inventario...</p>)
                : !error && inventario.length === 0
                    ? (<p>No hay inventario registrado.</p>)
                    : !error ? (
                        <div className={styles.listContainer}>
                            <table className={styles.inventoryTable}>
                                <thead>
                                    <tr><th>ID</th><th>Producto</th><th>Ubicación</th><th>Cantidad</th><th>Empresa Dueña</th><th>Actualizado</th><th className={styles.actionsCell}>Acciones</th></tr>
                                </thead>
                                <tbody>
                                    {inventario.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.id}</td>

                                            <td>{item.producto_nombre}</td>
                                            <td>{item.ubicacion_nombre}</td>
                                            <td style={{ textAlign: 'right' }}>{item.cantidad}</td>
                                            <td>{item.empresa?.nombre || '[Sin Empresa]'}</td>
                                            <td>{formatDateTime(item.fecha_actualizacion)}</td>
                                            <td className={styles.actionsCell}>
                                                <button onClick={() => handleEditClick(item)} className={`${styles.listButton} ${styles.editButton}`} title="Editar Cantidad">✏️</button>
                                                <button onClick={() => handleDeleteClick(item.id, `${item.producto_nombre} @ ${item.ubicacion_nombre}`)} className={`${styles.listButton} ${styles.deleteButton}`} title="Eliminar">🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
        </div>
    );
};
export default GestionInventario;