// frontend/src/components/JefeInventario/GestionProductos.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Importa las funciones API para Productos
import {
    getProductos, createProducto, updateProducto, deleteProducto
} from '../../services/bodegaje'; // <-- APUNTA AL NUEVO ARCHIVO
// --- Importa el CSS Module ---
import styles from '../../styles/JefeInventario/GestionProductos.module.css'; // Ajusta la ruta



// --- INICIO Interfaces Definidas LOCALMENTE ---
interface ProductoDataInput {
    nombre: string;
    descripcion?: string;
    sku: string; // Requerido y único
}
interface ProductoDataOutput extends ProductoDataInput {
    id: number;
}
// --- FIN Interfaces Locales ---

const GestionProductos: React.FC = () => {
    // --- Estados ---
    const [productos, setProductos] = useState<ProductoDataOutput[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingProducto, setEditingProducto] = useState<ProductoDataOutput | null>(null);

    // Estado del formulario
    const [id, setId] = useState<number | null>(null);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [sku, setSku] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // --- Carga de Datos ---
    const fetchProductos = useCallback(async () => {
        console.log("[GestionProductos] Fetching productos...");
        setIsLoading(true); setError(null); setFormSuccess(null);
        try {
            const data = await getProductos();
            setProductos(data);
            console.log("[GestionProductos] Productos cargados:", data.length);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || "Error al cargar productos");
            console.error("Error fetching productos:", err.response || err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProductos();
    }, [fetchProductos]);

    // --- Handlers ---
    const resetForm = () => {
        setEditingProducto(null); setId(null);
        setNombre(''); setDescripcion(''); setSku('');
        setShowForm(false); setFormError(null); setFormSuccess(null); setIsSubmitting(false);
    };

    const handleEditClick = (producto: ProductoDataOutput) => {
        if (showForm && editingProducto?.id === producto.id) { resetForm(); return; }
        console.log(`[GestionProductos] Preparando edición ID: ${producto.id}`);
        setEditingProducto(producto);
        setId(producto.id);
        setNombre(producto.nombre);
        setDescripcion(producto.descripcion || '');
        setSku(producto.sku);
        setShowForm(true); setFormError(null); setFormSuccess(null);
        window.scrollTo(0, 0);
    };

    const handleDeleteClick = async (productoId: number, productoNombre: string) => {
        console.log(`[GestionProductos] handleDeleteClick ID: ${productoId}`);
        if (window.confirm(`¿Seguro eliminar producto "${productoNombre}" (ID: ${productoId})? Esto podría afectar el inventario.`)) {
            setError(null); setFormSuccess(null); setIsLoading(true); // Podrías usar isDeleting state
            try {
                await deleteProducto(productoId);
                setFormSuccess(`Producto "${productoNombre}" eliminado.`);
                fetchProductos(); // Recarga la lista
            } catch (err: any) {
                const errorMsg = err.response?.data?.detail || err.message || `Error eliminando producto`;
                setError(errorMsg); console.error("Delete error:", err.response || err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);
        if (!nombre || !sku) { setFormError("Nombre y SKU son obligatorios."); setIsSubmitting(false); return; }

        // Prepara datos (Parcial para update)
        const productoData: Partial<ProductoDataInput> = {
            nombre,
            descripcion: descripcion || undefined, // Envía undefined si está vacío para que no se actualice si no es necesario
            sku
        };

        try {
            let mensajeExito = '';
            if (editingProducto && id) { // --- Actualizar ---
                // Evita enviar si no hay cambios reales
                if (nombre === editingProducto.nombre && (descripcion || '') === (editingProducto.descripcion || '') && sku === editingProducto.sku) {
                     setFormError("No se realizaron cambios."); setIsSubmitting(false); return;
                }
                // Crea objeto solo con campos modificados para PATCH
                 const updateData: Partial<ProductoDataInput> = {};
                 if (nombre !== editingProducto.nombre) updateData.nombre = nombre;
                 if (sku !== editingProducto.sku) updateData.sku = sku;
                 if ((descripcion || '') !== (editingProducto.descripcion || '')) updateData.descripcion = descripcion || undefined; // Envía undefined si se borra

                 if (Object.keys(updateData).length === 0) { // Doble chequeo
                     setFormError("No se realizaron cambios detectables."); setIsSubmitting(false); return;
                 }

                console.log("[GestionProductos] Llamando updateProducto", id, updateData);
                const prodActualizado = await updateProducto(id, updateData);
                mensajeExito = `Producto "${prodActualizado.nombre}" actualizado.`;
            } else { // --- Crear ---
                console.log("[GestionProductos] Llamando createProducto", productoData);
                const nuevoProd = await createProducto(productoData as ProductoDataInput); // Afirma el tipo
                mensajeExito = `Producto "${nuevoProd.nombre}" creado.`;
            }
            setFormSuccess(mensajeExito);
            resetForm(); fetchProductos();
        } catch (err: any) {
            const backendErrors = err.response?.data; let errorMsg = err.message || "Error al guardar producto.";
            if (typeof backendErrors === 'object' && backendErrors !== null) { errorMsg = Object.entries(backendErrors).map(([k, v])=>`${k}: ${Array.isArray(v)?v.join(','):v}`).join('; ')||"Error validación"; }
            setFormError(errorMsg); console.error("Submit error:", err);
        } finally { setIsSubmitting(false); }
    };

    // --- Renderizado del Componente (con classNames) ---
    return (
        <div className={styles.gestionContainer}> {/* Clase principal */}
            <h3>Gestionar Productos</h3>

             {/* Botón Crear */}
             <div className={styles.actionBar}> {/* Contenedor opcional */}
                {!editingProducto && (
                    <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                            className={`${styles.commonButton} ${showForm ? styles.cancelButton : styles.createButton}`}>
                        {showForm ? 'Cancelar Creación' : '+ Crear Nuevo Producto'}
                    </button>
                )}
             </div>

            {/* Formulario Crear/Editar */}
            {showForm && (
                <form onSubmit={handleSubmit} className={styles.productoForm}> {/* Clase form */}
                    <h4 className={styles.formTitle}>{editingProducto ? `Editando Producto: ${editingProducto.nombre}` : 'Nuevo Producto'}</h4>
                    <div className={styles.inputGroup}>
                        <label htmlFor="prod-nombre" className={styles.label}>Nombre:*</label>
                        <input id="prod-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className={styles.input} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="prod-sku" className={styles.label}>SKU:*</label>
                        <input id="prod-sku" type="text" value={sku} onChange={e => setSku(e.target.value)} required className={styles.input} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="prod-desc" className={styles.label}>Descripción:</label>
                        <textarea id="prod-desc" value={descripcion} onChange={e => setDescripcion(e.target.value)} className={styles.textarea} rows={3} />
                    </div>

                    {/* Mensajes y Botones */}
                    {formError && <p className={styles.formError}>{formError}</p>}
                    {formSuccess && !isSubmitting && <p className={styles.formSuccess}>{formSuccess}</p>}
                    <div className={styles.buttonGroup}>
                        <button type="submit" disabled={isSubmitting} className={`${styles.commonButton} ${styles.submitButton}`}>{isSubmitting ? 'Guardando...' : (editingProducto ? 'Actualizar Producto' : 'Crear Producto')}</button>
                        {editingProducto && <button type="button" onClick={resetForm} className={`${styles.commonButton} ${styles.cancelButton}`}>Cancelar Edición</button>}
                    </div>
                </form>
            )}

            {/* Lista de Productos */}
            <h4 className={styles.listTitle}>Productos Registrados</h4>
             {/* Mensajes generales */}
            {formSuccess && !showForm && <p className={styles.generalSuccess}>{formSuccess}</p>}
            {error && <p className={styles.generalError}>Error: {error}</p>}

            {isLoading ? ( <p>Cargando productos...</p> )
             : !error && productos.length === 0 ? ( <p>No hay productos creados.</p> )
             : !error ? (
                 <ul className={styles.productoList}> {/* Clase lista ul */}
                    {productos.map(prod => (
                        <li key={prod.id} className={styles.productoItem}> {/* Clase item li */}
                            <div className={styles.itemInfo}> {/* Info */}
                                <strong>{prod.nombre}</strong> <span className={styles.sku}>(SKU: {prod.sku})</span> (ID: {prod.id})<br />
                                <small>{prod.descripcion || '-'}</small>
                            </div>
                            <div className={styles.itemActions}> {/* Botones */}
                                <button onClick={() => handleEditClick(prod)} className={`${styles.listButton} ${styles.editButton}`} title="Editar">✏️</button>
                                <button onClick={() => handleDeleteClick(prod.id, prod.nombre)} className={`${styles.listButton} ${styles.deleteButton}`} title="Eliminar">🗑️</button>
                            </div>
                        </li>
                    ))}
                 </ul>
                ) : null }
        </div>
    );
};

export default GestionProductos;