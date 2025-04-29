// frontend/src/components/JefeInventario/GestionUbicaciones.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Importa las funciones API para Ubicaciones
import {
    getUbicaciones, createUbicacion, updateUbicacion, deleteUbicacion
} from '../../services/bodegaje'; // <-- APUNTA AL NUEVO ARCHIVO

// --- Importa el CSS Module ---
import styles from '../../styles/JefeInventario/GestionUbicaciones.module.css'; // Ajusta la ruta


// --- INICIO Interfaces Definidas LOCALMENTE ---
interface UbicacionDataInput {
    nombre: string;
    descripcion?: string;
}
interface UbicacionDataOutput extends UbicacionDataInput {
    id: number;
}
// --- FIN Interfaces Locales ---

const GestionUbicaciones: React.FC = () => {
    // --- Estados ---
    const [ubicaciones, setUbicaciones] = useState<UbicacionDataOutput[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingUbicacion, setEditingUbicacion] = useState<UbicacionDataOutput | null>(null);

    // Estado del formulario
    const [id, setId] = useState<number | null>(null);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // --- Carga de Datos ---
    const fetchUbicaciones = useCallback(async () => {
        console.log("[GestionUbicaciones] Fetching ubicaciones...");
        setIsLoading(true); setError(null); setFormSuccess(null);
        try {
            const data = await getUbicaciones();
            setUbicaciones(data);
        } catch (err: any) { setError(err.message || "Error al cargar ubicaciones"); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => {
        fetchUbicaciones();
    }, [fetchUbicaciones]);

    // --- Handlers ---
    const resetForm = () => { setEditingUbicacion(null); setId(null); setNombre(''); setDescripcion(''); setShowForm(false); setFormError(null); setFormSuccess(null); setIsSubmitting(false); };

    const handleEditClick = (ubicacion: UbicacionDataOutput) => {
        if (showForm && editingUbicacion?.id === ubicacion.id) { resetForm(); return; }
        setEditingUbicacion(ubicacion);
        setId(ubicacion.id);
        setNombre(ubicacion.nombre);
        setDescripcion(ubicacion.descripcion || '');
        setShowForm(true); setFormError(null); setFormSuccess(null);
        window.scrollTo(0, 0);
    };

    const handleDeleteClick = async (ubicacionId: number, ubicacionNombre: string) => {
        if (window.confirm(`¿Seguro eliminar ubicación "${ubicacionNombre}" (ID: ${ubicacionId})?`)) {
             setError(null); setFormSuccess(null); setIsLoading(true);
            try { await deleteUbicacion(ubicacionId); setFormSuccess(`Ubicación "${ubicacionNombre}" eliminada.`); fetchUbicaciones(); }
            catch (err: any) { setError(err.message || `Error eliminando ubicación`); console.error("Delete error:", err); }
            finally { setIsLoading(false); }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);
        if (!nombre) { setFormError("El nombre es obligatorio."); setIsSubmitting(false); return; }

        const ubicacionData: UbicacionDataInput = { nombre, descripcion: descripcion || undefined };

        try {
            let mensajeExito = '';
            if (editingUbicacion && id) { // Actualizar
                // Compara si realmente cambió algo (opcional, pero bueno)
                if (nombre === editingUbicacion.nombre && descripcion === (editingUbicacion.descripcion || '')) {
                     setFormError("No se realizaron cambios."); setIsSubmitting(false); return;
                }
                const ubiActualizada = await updateUbicacion(id, ubicacionData);
                mensajeExito = `Ubicación "${ubiActualizada.nombre}" actualizada.`;
            } else { // Crear
                const nuevaUbi = await createUbicacion(ubicacionData);
                mensajeExito = `Ubicación "${nuevaUbi.nombre}" creada.`;
            }
            setFormSuccess(mensajeExito);
            resetForm(); fetchUbicaciones();
        } catch (err: any) {
            const backendErrors = err.response?.data; let errorMsg = err.message || "Error al guardar ubicación.";
            if (typeof backendErrors === 'object' && backendErrors !== null) { errorMsg = Object.entries(backendErrors).map(([k, v])=>`${k}: ${Array.isArray(v)?v.join(','):v}`).join('; ')||"Error validación"; }
            setFormError(errorMsg); console.error("Submit error:", err);
        } finally { setIsSubmitting(false); }
    };

    // --- Renderizado del Componente (con classNames) ---
    return (
        <div className={styles.gestionContainer}> {/* Clase principal */}
            <h3>Gestionar Ubicaciones</h3>

            {/* Botón Crear */}
             <div className={styles.actionBar}> {/* Contenedor opcional para botón */}
                {!editingUbicacion && (
                    <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                            className={`${styles.commonButton} ${showForm ? styles.cancelButton : styles.createButton}`}>
                        {showForm ? 'Cancelar Creación' : '+ Crear Nueva Ubicación'}
                    </button>
                )}
             </div>


            {/* Formulario */}
            {showForm && (
                <form onSubmit={handleSubmit} className={styles.ubicacionForm}> {/* Clase de formulario */}
                    <h4 className={styles.formTitle}>{editingUbicacion ? `Editando Ubicación: ${editingUbicacion.nombre}` : 'Nueva Ubicación'}</h4>
                    <div className={styles.inputGroup}>
                        <label htmlFor="ubi-nombre" className={styles.label}>Nombre:*</label>
                        <input id="ubi-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className={styles.input} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="ubi-desc" className={styles.label}>Descripción:</label>
                        <textarea id="ubi-desc" value={descripcion} onChange={e => setDescripcion(e.target.value)} className={styles.textarea} rows={3} />
                    </div>

                    {/* Mensajes y Botones */}
                    {formError && <p className={styles.formError}>{formError}</p>}
                    {formSuccess && !isSubmitting && <p className={styles.formSuccess}>{formSuccess}</p>}
                    <div className={styles.buttonGroup}>
                        <button type="submit" disabled={isSubmitting} className={`${styles.commonButton} ${styles.submitButton}`}>{isSubmitting ? 'Guardando...' : (editingUbicacion ? 'Actualizar Ubicación' : 'Crear Ubicación')}</button>
                        {editingUbicacion && <button type="button" onClick={resetForm} className={`${styles.commonButton} ${styles.cancelButton}`}>Cancelar Edición</button>}
                    </div>
                </form>
            )}

            {/* Lista de Ubicaciones */}
            <h4 className={styles.listTitle}>Ubicaciones Registradas</h4>
            {/* Mensajes generales */}
            {formSuccess && !showForm && <p className={styles.generalSuccess}>{formSuccess}</p>}
            {error && <p className={styles.generalError}>Error: {error}</p>}


            {isLoading ? ( <p>Cargando ubicaciones...</p> )
             : !error && ubicaciones.length === 0 ? ( <p>No hay ubicaciones creadas.</p> )
             : !error ? (
                 <ul className={styles.ubicacionList}> {/* Clase para la lista ul */}
                    {ubicaciones.map(ubi => (
                        <li key={ubi.id} className={styles.ubicacionItem}> {/* Clase para cada item li */}
                            <div className={styles.itemInfo}> {/* Contenedor para info */}
                                <strong>{ubi.nombre}</strong> (ID: {ubi.id})<br />
                                <small>{ubi.descripcion || '-'}</small>
                            </div>
                            <div className={styles.itemActions}> {/* Contenedor para botones */}
                                <button onClick={() => handleEditClick(ubi)} className={`${styles.listButton} ${styles.editButton}`} title="Editar">✏️</button>
                                <button onClick={() => handleDeleteClick(ubi.id, ubi.nombre)} className={`${styles.listButton} ${styles.deleteButton}`} title="Eliminar">🗑️</button>
                            </div>
                        </li>
                    ))}
                 </ul>
                ) : null }
        </div>
    );
};

export default GestionUbicaciones;