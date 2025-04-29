// frontend/src/components/JefeEmpresa/GestionTiposVehiculo.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Importa las funciones API y tipos para TipoVehiculo
import {
    getTiposVehiculo, createTipoVehiculo, updateTipoVehiculo, deleteTipoVehiculo
} from '../../services/transporte'; // <-- APUNTA AL NUEVO ARCHIVO
import { TipoVehiculoData } from '../../types/pedido'; // Ajusta ruta
// Importa los estilos (crearemos este archivo después)
import styles from '../../styles/JefeEmpresa/GestionTiposVehiculo.module.css'; // Ajusta ruta

const GestionTiposVehiculo: React.FC = () => {
    // --- Estados ---
    const [tipos, setTipos] = useState<TipoVehiculoData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingTipo, setEditingTipo] = useState<TipoVehiculoData | null>(null);

    // Estado del formulario
    const [id, setId] = useState<number | null>(null);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // --- Carga de Datos ---
    const fetchTipos = useCallback(async () => {
        console.log("[GestionTiposVehiculo] Fetching tipos...");
        setIsLoading(true); setError(null); setFormSuccess(null);
        try {
            const data = await getTiposVehiculo();
            setTipos(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar tipos de vehículo");
            setTipos([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTipos();
    }, [fetchTipos]);

    // --- Handlers ---
    const resetForm = () => {
        setEditingTipo(null); setId(null);
        setNombre(''); setDescripcion('');
        setShowForm(false); setFormError(null); setFormSuccess(null); setIsSubmitting(false);
    };

    const handleEditClick = (tipo: TipoVehiculoData) => {
        if (showForm && editingTipo?.id === tipo.id) { resetForm(); return; }
        setEditingTipo(tipo);
        setId(tipo.id);
        setNombre(tipo.nombre);
        setDescripcion(tipo.descripcion || '');
        setShowForm(true); setFormError(null); setFormSuccess(null);
        window.scrollTo(0, 0);
    };

    const handleDeleteClick = async (tipoId: number, tipoNombre: string) => {
        const confirmMessage = `¿Seguro eliminar tipo "${tipoNombre}" (ID: ${tipoId})?\n\n¡ADVERTENCIA! No podrás eliminarlo si algún vehículo existente está usando este tipo. Deberás reasignar esos vehículos primero.`;
        if (window.confirm(confirmMessage)) {
            setError(null); setFormSuccess(null); // Limpia mensajes
            // Podrías usar setIsLoading(true) o un estado isDeleting
            try {
                await deleteTipoVehiculo(tipoId);
                setFormSuccess(`Tipo de vehículo "${tipoNombre}" eliminado.`);
                fetchTipos(); // Recarga la lista
                resetForm();
            } catch (err: any) {
                setError(err.message || `Error eliminando tipo`); // El error de la API ya debería ser descriptivo (ej. por PROTECT)
            } finally {
                // setIsLoading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);
        if (!nombre.trim()) {
            setFormError("El Nombre del tipo es obligatorio.");
            setIsSubmitting(false); return;
        }

        const tipoData: Omit<TipoVehiculoData, 'id'> = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null, // Envía null si está vacío
        };

        try {
            let mensajeExito = '';
            if (editingTipo && id) { // --- Actualizar ---
                // Solo envía si algo cambió
                if (nombre.trim() === editingTipo.nombre && (descripcion.trim() || null) === (editingTipo.descripcion || null)) {
                     setFormError("No se realizaron cambios.");
                     setIsSubmitting(false);
                     return;
                 }
                const tipoActualizado = await updateTipoVehiculo(id, tipoData);
                mensajeExito = `Tipo "${tipoActualizado.nombre}" actualizado.`;
            } else { // --- Crear ---
                const nuevoTipo = await createTipoVehiculo(tipoData);
                mensajeExito = `Tipo "${nuevoTipo.nombre}" creado.`;
            }
            setFormSuccess(mensajeExito);
            resetForm();
            fetchTipos();
        } catch (err: any) {
            const backendErrors = err.response?.data;
            let errorMsg = err.message || "Error al guardar el tipo de vehículo.";
            if (typeof backendErrors === 'object' && backendErrors !== null) {
                 errorMsg = Object.entries(backendErrors)
                                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(',') : v}`)
                                .join('; ') || "Error de validación";
            }
            setFormError(errorMsg);
            console.error("Submit error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Renderizado ---
    return (
        <div className={styles.gestionContainer}>
            <h3>Gestionar Tipos de Vehículo</h3>

            {/* Botón Crear */}
            <div className={styles.actionBar}>
                {!editingTipo && (
                    <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }} className={`${styles.commonButton} ${showForm ? styles.cancelButton : styles.createButton}`}>
                        {showForm ? 'Cancelar Creación' : '+ Crear Nuevo Tipo'}
                    </button>
                )}
                 {/* Mensajes generales fuera del form */}
                 {!showForm && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
                 {error && <p className={styles.generalError}>Error: {error}</p>}
            </div>


            {/* Formulario Crear/Editar */}
            {showForm && (
                <form onSubmit={handleSubmit} className={styles.tipoForm}>
                    <h4 className={styles.formTitle}>{editingTipo ? `Editando Tipo: ${editingTipo.nombre}` : 'Nuevo Tipo de Vehículo'}</h4>

                    <div className={styles.inputGroup}>
                        <label htmlFor="tipo-nombre" className={styles.label}>Nombre del Tipo:*</label>
                        <input id="tipo-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className={styles.input} maxLength={100} placeholder="Ej: Camioneta Doble Cabina"/>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="tipo-desc" className={styles.label}>Descripción (Opcional):</label>
                        <textarea id="tipo-desc" value={descripcion} onChange={e => setDescripcion(e.target.value)} className={styles.textarea} rows={3} />
                    </div>

                    {/* Mensajes y Botones */}
                    {formError && <p className={styles.formError}>{formError}</p>}
                    {formSuccess && !isSubmitting && <p className={styles.formSuccess}>{formSuccess}</p>}
                    <div className={styles.buttonGroup}>
                        <button type="submit" disabled={isSubmitting} className={`${styles.commonButton} ${styles.submitButton}`}>{isSubmitting ? 'Guardando...' : (editingTipo ? 'Actualizar Tipo' : 'Crear Tipo')}</button>
                        {editingTipo && <button type="button" onClick={resetForm} className={`${styles.commonButton} ${styles.cancelButton}`}>Cancelar Edición</button>}
                    </div>
                </form>
            )}

            {/* Lista de Tipos de Vehículo */}
            <h4 className={styles.listTitle}>Tipos Registrados</h4>
             {/* Mensaje de éxito general */}
             {!showForm && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
             {/* Muestra error general si no es error de form */}
             {error && !formError && <p className={styles.generalError}>Error: {error}</p>}


            {isLoading ? (<p>Cargando tipos...</p>)
             : !error && tipos.length === 0 ? (<p>No hay tipos de vehículo creados.</p>)
             : !error ? (
                 <ul className={styles.tipoList}>
                    {tipos.map(t => (
                        <li key={t.id} className={styles.tipoItem}>
                            <div className={styles.itemInfo}>
                                <strong>{t.nombre}</strong> (ID: {t.id})<br />
                                <small>{t.descripcion || 'Sin descripción'}</small>
                            </div>
                            <div className={styles.itemActions}>
                                <button onClick={() => handleEditClick(t)} className={`${styles.listButton} ${styles.editButton}`} title="Editar">✏️</button>
                                <button onClick={() => handleDeleteClick(t.id, t.nombre)} className={`${styles.listButton} ${styles.deleteButton}`} title="Eliminar">🗑️</button>
                            </div>
                        </li>
                    ))}
                 </ul>
                ) : null
             }
        </div>
    );
};

export default GestionTiposVehiculo;