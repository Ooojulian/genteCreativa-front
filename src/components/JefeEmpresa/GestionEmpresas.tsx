// frontend/src/components/JefeEmpresa/GestionEmpresas.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Importa TODAS las funciones API necesarias para Empresa
import { createEmpresa, getEmpresas, updateEmpresa, deleteEmpresa } from '../../services/empresas'; // <-- APUNTA AL NUEVO ARCHIVO
import styles from '../../styles/JefeEmpresa/GestionEmpresas.module.css';


// Define las interfaces para los datos de Empresa (pueden estar en un archivo de tipos)
interface EmpresaDataInput {
    nombre: string;
    nit?: string | null;
    direccion?: string | null;
    telefono?: string | null;
}
interface EmpresaDataOutput extends EmpresaDataInput {
    id: number;
}

const GestionEmpresas: React.FC = () => {
    // --- Estados del Componente ---
    const [empresas, setEmpresas] = useState<EmpresaDataOutput[]>([]); // Lista de empresas
    const [isLoading, setIsLoading] = useState(false); // Indicador de carga para la lista
    const [error, setError] = useState<string | null>(null); // Errores al cargar la lista
    const [showForm, setShowForm] = useState(false); // Controla visibilidad del formulario
    const [editingEmpresa, setEditingEmpresa] = useState<EmpresaDataOutput | null>(null); // Guarda datos de la empresa en edición

    // Estado del formulario (usado para Crear y Editar)
    const [id, setId] = useState<number | null>(null); // ID de la empresa en edición
    const [nombre, setNombre] = useState('');
    const [nit, setNit] = useState('');
    const [direccion, setDireccion] = useState('');
    const [telefono, setTelefono] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // Indicador de envío del formulario
    const [formError, setFormError] = useState<string | null>(null); // Errores específicos del formulario
    const [formSuccess, setFormSuccess] = useState<string | null>(null); // Mensajes de éxito (Crear, Editar, Borrar)
    const [searchTerm, setSearchTerm] = useState('');

    // --- Funciones ---

    // Función para cargar la lista de empresas desde la API
    const fetchEmpresas = useCallback(async (currentSearchTerm: string) => {
        console.log(`[GestionEmpresas] Fetching con searchTerm: "${currentSearchTerm}"`);
        setIsLoading(true);
        setError(null); // Limpia errores previos de la lista
        try {
            // Prepara el objeto de filtros
            const filtros: { search?: string } = {};
            if (currentSearchTerm.trim()) {
                filtros.search = currentSearchTerm.trim();
            }
            // Llama a getEmpresas CON los filtros
            const data = await getEmpresas(filtros);
            setEmpresas(data);
            console.log("[GestionEmpresas] Empresas cargadas:", data.length);
        } catch (err: any) {
            console.error("Error cargando empresas:", err.response?.data || err.message);
            setError(err.message || "Error al cargar la lista de empresas.");
            setEmpresas([]); // Limpia la lista en caso de error
        } finally {
            setIsLoading(false);
        }
    }, []); // useCallback ahora no depende de nada que cambie frecuentemente

    useEffect(() => {
        // Opcional: Debounce para evitar llamadas API en cada tecla
        const delayDebounceFn = setTimeout(() => {
            fetchEmpresas(searchTerm);
        }, 300); // Espera 300ms después de dejar de escribir

        return () => clearTimeout(delayDebounceFn); // Limpia el timeout si el componente se desmonta o searchTerm cambia de nuevo
    }, [searchTerm, fetchEmpresas]); // Se ejecuta cuando searchTerm o fetchEmpresas cambian


    // Prepara el formulario para editar una empresa existente
    const handleEditClick = (empresa: EmpresaDataOutput) => {
        console.log(`[GestionEmpresas] handleEditClick llamado para ID: ${empresa.id}`);
        setEditingEmpresa(empresa); // Guarda la empresa completa
        setId(empresa.id);         // Guarda el ID
        setNombre(empresa.nombre); // Rellena los campos del formulario
        setNit(empresa.nit || '');
        setDireccion(empresa.direccion || '');
        setTelefono(empresa.telefono || '');
        setShowForm(true);         // Muestra el formulario
        setFormError(null);        // Limpia mensajes
        setFormSuccess(null);
        window.scrollTo(0, 0);     // Sube la vista
        console.log(`[GestionEmpresas] Formulario preparado para editar ID: ${empresa.id}`);
    };

    // Limpia el formulario y el estado de edición/creación
    const resetForm = () => {
        console.log("[GestionEmpresas] Llamando a resetForm.");
        setEditingEmpresa(null);
        setId(null);
        setNombre(''); setNit(''); setDireccion(''); setTelefono('');
        setShowForm(false);
        setFormError(null);
        setFormSuccess(null); // Limpia también el mensaje de éxito
        setIsSubmitting(false);
    };

    // Maneja el clic en el botón de eliminar
    const handleDeleteClick = async (empresaId: number, empresaNombre: string) => {
        console.log(`[GestionEmpresas] handleDeleteClick llamado para ID: ${empresaId}`);
        if (window.confirm(`¿Estás MUY seguro de eliminar la empresa "${empresaNombre}" (ID: ${empresaId})? Esta acción NO SE PUEDE DESHACER.`)) {
            setIsLoading(true); // Podrías usar un estado 'isDeleting' si prefieres
            setError(null);
            setFormSuccess(null); // Limpia mensajes de éxito previos
            try {
                console.log(`[GestionEmpresas] Intentando llamar a deleteEmpresa API para ID: ${empresaId}`);
                await deleteEmpresa(empresaId); // Llama a la función de la API
                console.log(`[GestionEmpresas] deleteEmpresa API OK para ID: ${empresaId}`);
                setFormSuccess(`Empresa "${empresaNombre}" eliminada correctamente.`); // Muestra mensaje de éxito
                fetchEmpresas(searchTerm); // Recarga la lista actualizada
            } catch (err: any) {
                const errorMsg = err.response?.data?.detail || err.message || `Error al eliminar ${empresaNombre}`;
                console.error(`[GestionEmpresas] Error en deleteEmpresa API para ID: ${empresaId}:`, errorMsg, err.response || err);
                setError(errorMsg); // Muestra error general (podría ser formError también)
            } finally {
                setIsLoading(false);
            }
        } else {
            console.log(`[GestionEmpresas] Borrado cancelado por usuario para ID: ${empresaId}`);
        }
    };

    // Maneja el envío del formulario (sirve para CREAR y ACTUALIZAR)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);
        console.log(`[GestionEmpresas] handleSubmit llamado. Editando ID: ${id}`);

        // Datos a enviar (Parcial para update, completo para create)
        const empresaData: Partial<EmpresaDataInput> = {
            nombre,
            nit: nit || null, // Envía null si está vacío
            direccion: direccion || null,
            telefono: telefono || null,
        };

        try {
            let mensajeExito = '';
            if (editingEmpresa && id) {
                // --- ACTUALIZAR (UPDATE) ---
                console.log(`[GestionEmpresas] Intentando llamar a updateEmpresa API para ID: ${id}`, empresaData);
                const empresaActualizada = await updateEmpresa(id, empresaData); // Llama a API de update
                console.log(`[GestionEmpresas] updateEmpresa API OK para ID: ${id}`);
                mensajeExito = `Empresa "${empresaActualizada.nombre}" actualizada.`;
            } else {
                // --- CREAR (CREATE) ---
                if (!nombre) { // Validación básica
                    throw new Error("El nombre es obligatorio para crear.");
                }
                console.log(`[GestionEmpresas] Intentando llamar a createEmpresa API`, empresaData);
                // Afirmamos el tipo porque sabemos que 'nombre' no es parcial aquí
                const nuevaEmpresa = await createEmpresa(empresaData as EmpresaDataInput);
                console.log(`[GestionEmpresas] createEmpresa API OK`);
                mensajeExito = `Empresa "${nuevaEmpresa.nombre}" creada.`;
            }
            setFormSuccess(mensajeExito); // Muestra mensaje de éxito
            resetForm();        // Limpia y oculta formulario
            fetchEmpresas(searchTerm);    // Recarga la lista
        } catch (err: any) {
            console.error("Error guardando empresa:", err.response?.data || err.message);
            const backendErrors = err.response?.data;
            // Intenta mostrar errores de validación del backend
            if (typeof backendErrors === 'object' && backendErrors !== null) {
                setFormError(Object.entries(backendErrors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; '));
            } else {
                setFormError(err.message || "Error al guardar la empresa.");
            }
        } finally {
            setIsSubmitting(false); // Libera el botón de submit
        }
    };

    // --- Renderizado del Componente (con classNames) ---
    return (
        // --- Usa clases del CSS Module ---
        <div className={styles.gestionContainer}>
            <h3 className={styles.title}>Gestionar Empresas</h3>

            {/* Botón Crear/Ocultar */}
            {!editingEmpresa && (
                <button
                    onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                    // Aplica clases CSS Module
                    className={`${styles.commonButton} ${showForm ? styles.cancelButton : styles.createButton}`} >
                    {showForm ? 'Ocultar Formulario' : '+ Crear Nueva Empresa'}
                </button>
            )}
            <div className={styles.filterContainer}> {/* Puedes crear una clase para esto */}
                <label htmlFor="searchEmpresa" className={styles.filterLabel}>Buscar por Nombre/NIT:</label>
                <input
                    type="text"
                    id="searchEmpresa"
                    placeholder="Escribe para buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.filterInput} // Estilo para el input
                />
            </div>

            {/* Formulario */}
            {showForm && (
                <form onSubmit={handleSubmit} className={styles.empresaForm}>
                    <h4 className={styles.formTitle}>{editingEmpresa ? `Editando Empresa: ${editingEmpresa.nombre} (ID: ${id})` : 'Nueva Empresa'}</h4>
                    {/* Campos */}
                    <div className={styles.inputGroup}> <label htmlFor="emp-nombre" className={styles.label}>Nombre:*</label> <input id="emp-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className={styles.input} /> </div>
                    <div className={styles.inputGroup}> <label htmlFor="emp-nit" className={styles.label}>NIT:</label> <input id="emp-nit" type="text" value={nit} onChange={e => setNit(e.target.value)} className={styles.input} /> </div>
                    <div className={styles.inputGroup}> <label htmlFor="emp-direccion" className={styles.label}>Dirección:</label> <input id="emp-direccion" type="text" value={direccion} onChange={e => setDireccion(e.target.value)} className={styles.input} /> </div>
                    <div className={styles.inputGroup}> <label htmlFor="emp-telefono" className={styles.label}>Teléfono:</label> <input id="emp-telefono" type="text" value={telefono} onChange={e => setTelefono(e.target.value)} className={styles.input} /> </div>

                    {/* Mensajes */}
                    {formError && <p className={styles.formError}>{formError}</p>}
                    {formSuccess && !isSubmitting && <p className={styles.formSuccess}>{formSuccess}</p>}

                    {/* Botones */}
                    <div className={styles.buttonGroup}>
                        <button type="submit" disabled={isSubmitting} className={`${styles.commonButton} ${styles.submitButton}`}>
                            {isSubmitting ? 'Guardando...' : (editingEmpresa ? 'Actualizar Empresa' : 'Guardar Empresa')}
                        </button>
                        {editingEmpresa && <button type="button" onClick={resetForm} className={`${styles.commonButton} ${styles.cancelButton}`}>Cancelar Edición</button>}
                        {/* Si es creación, el botón principal Crear/Ocultar funciona como cancelar */}
                    </div>
                </form>
            )}

            {/* Mensajes Generales */}
            {formSuccess && !showForm && <p className={styles.generalSuccess}>{formSuccess}</p>}
            {error && <p className={styles.generalError}>{error}</p>}

            {/* Lista de Empresas */}
            
            <h4 className={styles.listTitle}>Empresas Registradas</h4>
            {isLoading ? (
                <p>Cargando lista...</p>
            ) : error ? ( // Muestra error si lo hay
                <p className={styles.generalError}>{error}</p>
            ) : empresas.length === 0 ? (
                <p>{searchTerm ? 'No hay empresas que coincidan con tu búsqueda.' : 'No hay empresas creadas.'}</p> // Mensaje contextual
            ) : (
                <ul className={styles.empresaList}>
                    {/* ... (el map para renderizar empresas sigue igual) ... */}
                    {empresas.map(emp => (
                        <li key={emp.id} className={styles.empresaItem}>
                            {/* Información */}
                            <div className={styles.itemInfo}>
                                <strong>{emp.nombre}</strong> (ID: {emp.id})<br />
                                <small>
                                    NIT: {emp.nit || '-'} | Tel: {emp.telefono || '-'} | Dir: {emp.direccion || '-'}
                                </small>
                            </div>
                            {/* Botones */}
                            <div className={styles.itemActions}>
                                <button onClick={() => handleEditClick(emp)} className={`${styles.listButton} ${styles.editButton}`} title="Editar">✏️ Editar</button>
                                <button onClick={() => handleDeleteClick(emp.id, emp.nombre)} className={`${styles.listButton} ${styles.deleteButton}`} title="Eliminar">🗑️ Eliminar</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )
            }
        </div>
    );
};

export default GestionEmpresas;