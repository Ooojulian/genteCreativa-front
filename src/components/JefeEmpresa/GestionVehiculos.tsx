// frontend/src/components/JefeEmpresa/GestionVehiculos.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Importa las funciones API y tipos necesarios
import {
    getVehiculos, createVehiculo, updateVehiculo, deleteVehiculo, getTiposVehiculo
} from '../../services/transporte'; // <-- APUNTA AL NUEVO ARCHIVO
import { VehiculoData, TipoVehiculoData, VehiculoInputData }  from '../../types/pedido'; // Ajusta ruta
// Importa los estilos (crearemos este archivo después)
import styles from '../../styles/JefeEmpresa/GestionVehiculos.module.css'; // Ajusta ruta

const GestionVehiculos: React.FC = () => {
    // --- Estados ---
    const [vehiculos, setVehiculos] = useState<VehiculoData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingVehiculo, setEditingVehiculo] = useState<VehiculoData | null>(null);

    const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculoData[]>([]);
    const [loadingTipos, setLoadingTipos] = useState(false);
    // Estado del formulario
    const [id, setId] = useState<number | null>(null);
    const [placa, setPlaca] = useState('');
    const [formTipoId, setFormTipoId] = useState<number | string>('');
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');
    const [year, setYear] = useState<number | string>('');
    const [activo, setActivo] = useState(true);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    const fetchTipos = useCallback(async () => {
        console.log("[GestionVehiculos] Fetching tipos de vehiculo...");
        setLoadingTipos(true);
        // Podrías limpiar el error general aquí también si prefieres
        // setError(null);
        try {
            const data = await getTiposVehiculo();
            setTiposVehiculo(data);
        } catch (err: any) {
            setError(prev => `${prev || ''} Error cargando tipos.`); // Añade al error general
        } finally {
            setLoadingTipos(false);
        }
    }, []);

    // --- Carga de Datos ---
    const fetchVehiculos = useCallback(async () => {
        console.log("[GestionVehiculos] Fetching vehiculos...");
        setIsLoading(true); setError(null); setFormSuccess(null);
        try {
            const data = await getVehiculos();
            setVehiculos(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar vehículos");
            setVehiculos([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVehiculos();
        fetchTipos(); // Llama a la nueva función
    }, [fetchVehiculos, fetchTipos]); 

    // --- Handlers ---
    const resetForm = () => {
        setEditingVehiculo(null); setId(null);
        setPlaca(''); setFormTipoId(''); setMarca(''); setModelo(''); setYear(''); setActivo(true); // Limpia formTipoId
        setShowForm(false); setFormError(null); setFormSuccess(null); setIsSubmitting(false);
    };

    const handleEditClick = (vehiculo: VehiculoData) => {
        if (showForm && editingVehiculo?.id === vehiculo.id) { resetForm(); return; }
        setEditingVehiculo(vehiculo);
        setId(vehiculo.id);
        setPlaca(vehiculo.placa);
        setFormTipoId(vehiculo.tipo ? vehiculo.tipo.toString() : ''); // Asegura string
        setMarca(vehiculo.marca || '');
        setModelo(vehiculo.modelo || '');
        setYear(vehiculo.year || '');
        setActivo(vehiculo.activo ?? true); // Usa ?? por si es undefined
        setShowForm(true); setFormError(null); setFormSuccess(null);
        window.scrollTo(0, 0);
    };

    const handleDeleteClick = async (vehiculoId: number, vehiculoPlaca: string) => {
        if (window.confirm(`¿Seguro eliminar vehículo "${vehiculoPlaca}" (ID: ${vehiculoId})? No podrá ser asignado.`)) {
            setError(null); setFormSuccess(null); // Limpia mensajes
            // Podrías usar setIsLoading(true) aquí
            try {
                await deleteVehiculo(vehiculoId);
                setFormSuccess(`Vehículo "${vehiculoPlaca}" eliminado.`);
                fetchVehiculos(); // Recarga la lista
                resetForm(); // Cierra formulario si estaba editando el eliminado
            } catch (err: any) {
                setError(err.message || `Error eliminando vehículo`);
            } finally {
                // setIsLoading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);
        // --- VALIDACIÓN: Ahora requiere formTipoId ---
        if (!placa || !formTipoId) { // Requiere placa y SELECCIÓN de tipo
            setFormError("La Placa y el Tipo son obligatorios.");
            setIsSubmitting(false); return;
        }
        // -----------------------------------------

        // --- Usa VehiculoInputData ---
        const vehiculoData: VehiculoInputData = {
            placa: placa.toUpperCase().trim(),
            tipo_id: Number(formTipoId), // <-- Envía el ID numérico
            marca: marca.trim() || null,
            modelo: modelo.trim() || null,
            year: year ? Number(year) : null,
            activo: activo
        };
        // ---------------------------

        try {
            let mensajeExito = '';
            if (editingVehiculo && id) { // --- Actualizar ---
                // Prepara datos para PATCH (sin placa si no se edita)
                const updateData: Partial<VehiculoInputData> = { ...vehiculoData };
                // delete updateData.placa; // Descomenta si no permites editar placa

                const vActualizado = await updateVehiculo(id, updateData); // Envía tipo_id
                mensajeExito = `Vehículo "${vActualizado.placa}" actualizado.`;
            } else { // --- Crear ---
                const nuevoV = await createVehiculo(vehiculoData); // Envía tipo_id
                mensajeExito = `Vehículo "${nuevoV.placa}" creado.`;
            }
            setFormSuccess(mensajeExito);
            resetForm();
            fetchVehiculos();
        } catch (err: any) {
             // ... (manejo de errores sin cambios) ...
            const backendErrors = err.response?.data;
            let errorMsg = err.message || "Error al guardar vehículo.";
            if (typeof backendErrors === 'object' && backendErrors !== null) { errorMsg = Object.entries(backendErrors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(',') : v}`).join('; ') || "Error de validación"; }
            setFormError(errorMsg);
            console.error("Submit error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Renderizado ---
    return (
        <div className={styles.gestionContainer}>
            <h3>Gestionar Vehículos</h3>

            {/* Botón Crear */}
            <div className={styles.actionBar}>
                {!editingVehiculo && (
                    <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }} className={`${styles.commonButton} ${showForm ? styles.cancelButton : styles.createButton}`}>
                        {showForm ? 'Cancelar Creación' : '+ Registrar Nuevo Vehículo'}
                    </button>
                )}
                 {/* Mensajes generales fuera del form */}
                 {!showForm && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
                 {error && <p className={styles.generalError}>Error: {error}</p>}
            </div>


            {/* Formulario Crear/Editar */}
            {showForm && (
                <form onSubmit={handleSubmit} className={styles.vehiculoForm}>
                    <h4 className={styles.formTitle}>{editingVehiculo ? `Editando Vehículo: ${editingVehiculo.placa}` : 'Nuevo Vehículo'}</h4>

                    <div className={styles.inputGroup}>
                        <label htmlFor="veh-placa" className={styles.label}>Placa:*</label>
                        <input id="veh-placa" type="text" value={placa} onChange={e => setPlaca(e.target.value)} required className={styles.input} maxLength={10} placeholder="Ej: AAA123" />
                        {/* Podrías añadir disabled={!!editingVehiculo} si no quieres que se edite la placa */}
                    </div>

                    {/* --- MODIFICADO: Select de Tipo --- */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="veh-tipo" className={styles.label}>Tipo:*</label>
                        <select
                            id="veh-tipo"
                            value={formTipoId} // <-- Vinculado a formTipoId
                            onChange={e => setFormTipoId(e.target.value)} // <-- Actualiza formTipoId
                            required
                            className={styles.select}
                            disabled={loadingTipos || tiposVehiculo.length === 0} // Deshabilita si carga o no hay tipos
                        >
                            <option value="" disabled>-- Selecciona tipo --</option>
                            {/* Mapea los tipos cargados desde la API */}
                            {tiposVehiculo.map(tipo => (
                                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                            ))}
                        </select>
                        {loadingTipos && <span className={styles.loadingSmall}> Cargando tipos...</span>}
                        {!loadingTipos && tiposVehiculo.length === 0 && <small className={styles.loadingSmall}> No hay tipos creados.</small>}
                    </div>
                    {/* --- FIN MODIFICACIÓN --- */}


                    <div className={styles.inputGroup}>
                        <label htmlFor="veh-marca" className={styles.label}>Marca:</label>
                        <input id="veh-marca" type="text" value={marca} onChange={e => setMarca(e.target.value)} className={styles.input} />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="veh-modelo" className={styles.label}>Modelo/Línea:</label>
                        <input id="veh-modelo" type="text" value={modelo} onChange={e => setModelo(e.target.value)} className={styles.input} />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="veh-year" className={styles.label}>Año:</label>
                        <input id="veh-year" type="number" value={year} onChange={e => setYear(e.target.value)} min="1900" max={new Date().getFullYear() + 1} className={styles.input} placeholder="Ej: 2023"/>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.checkboxLabel}>
                            <input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} className={styles.checkboxInput} />
                            Vehículo Activo (disponible para asignar)
                        </label>
                    </div>

                    {/* Mensajes y Botones */}
                    {formError && <p className={styles.formError}>{formError}</p>}
                    {formSuccess && !isSubmitting && <p className={styles.formSuccess}>{formSuccess}</p>}
                    <div className={styles.buttonGroup}>
                        <button type="submit" disabled={isSubmitting || loadingTipos} className={`${styles.commonButton} ${styles.submitButton}`}>{isSubmitting ? 'Guardando...' : (editingVehiculo ? 'Actualizar Vehículo' : 'Crear Vehículo')}</button> {/* Deshabilita si carga tipos */}
                        {editingVehiculo && <button type="button" onClick={resetForm} className={`${styles.commonButton} ${styles.cancelButton}`}>Cancelar Edición</button>}
                    </div>
                </form>
            )}

            {/* Lista de Vehículos */}
            <h4 className={styles.listTitle}>Vehículos Registrados</h4>
            {/* Mensaje de éxito general */}
             {!showForm && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
             {/* Muestra error general si no es error de form */}
             {error && !formError && <p className={styles.generalError}>Error: {error}</p>}


            {isLoading ? (<p>Cargando vehículos...</p>)
             : !error && vehiculos.length === 0 ? (<p>No hay vehículos registrados.</p>)
             : !error ? (
                 <div className={styles.listContainer}>
                     <table className={styles.vehiculoTable}>
                         <thead>
                             <tr>
                                 <th>Placa</th>
                                 <th>Tipo</th> {/* Columna Tipo ahora muestra nombre */}
                                 <th>Marca</th>
                                 <th>Modelo</th>
                                 <th>Año</th>
                                 <th>Activo</th>
                                 <th className={styles.actionsCell}>Acciones</th>
                             </tr>
                         </thead>
                         <tbody>
                             {vehiculos.map(v => (
                                 <tr key={v.id} className={!v.activo ? styles.inactiveRow : ''}>
                                     <td>{v.placa}</td>
                                     {/* Muestra el nombre del tipo desde el objeto anidado */}
                                     <td>{v.tipo?.nombre || <span style={{color:'red'}}>Inválido</span>}</td>
                                     <td>{v.marca || '-'}</td>
                                     <td>{v.modelo || '-'}</td>
                                     <td>{v.year || '-'}</td>
                                     <td style={{ textAlign: 'center' }}>{v.activo ? '✔️' : '❌'}</td>
                                     <td className={styles.actionsCell}>
                                         <button onClick={() => handleEditClick(v)} className={`${styles.listButton} ${styles.editButton}`} title="Editar">✏️</button>
                                         <button onClick={() => handleDeleteClick(v.id, v.placa)} className={`${styles.listButton} ${styles.deleteButton}`} title="Eliminar">🗑️</button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
                ) : null
             }
        </div>
    );
};

export default GestionVehiculos;