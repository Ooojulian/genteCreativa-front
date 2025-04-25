// frontend/src/components/JefeEmpresa/GestionUsuarios.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Importa todas las funciones y tipos necesarios de tu archivo api.ts
import {
    getUsuarios, createUsuario, updateUsuario, deleteUsuario,
    getRoles, getEmpresas
} from '../../services/api'; // Asegúrate que getUsuarios ahora acepta filtros
import styles from '../../styles/JefeEmpresa/GestionUsuarios.module.css'; // Ajusta ruta si es necesario


// Reutiliza o importa interfaces (asegúrate que coincidan con tu api.ts y AuthContext)
interface RolData { id: number; nombre: string; }
interface EmpresaDataOutput { id: number; nombre: string; /* otros campos si los definiste */ }
interface UserData { id: number; cedula: string; nombre: string | null; apellido: string | null; email: string | null; username: string | null; rol: RolData | null; empresa: EmpresaDataOutput | null; is_active?: boolean; is_staff?: boolean; }
interface UsuarioInputData { cedula: string; password?: string; nombre?: string | null; apellido?: string | null; email?: string | null; username?: string | null; rol_id: number; empresa_id?: number | null; is_active?: boolean; }

// Interfaz para los filtros locales
interface LocalUserFilters {
    rolId: number | string;
    empresaId: number | string;
    searchTerm: string;
    isActive: boolean | string; // 'true', 'false', or 'all'
}

const GestionUsuarios: React.FC = () => {
    // --- Estados del Componente ---
    const [usuarios, setUsuarios] = useState<UserData[]>([]);
    const [roles, setRoles] = useState<RolData[]>([]);
    const [empresas, setEmpresas] = useState<EmpresaDataOutput[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Loading para la lista principal
    const [error, setError] = useState<string | null>(null); // Error de carga de lista
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    // Estado del formulario
    const [id, setId] = useState<number | null>(null);
    const [cedula, setCedula] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState(''); // Opcional
    const [formRolId, setFormRolId] = useState<number | string>(''); // Renombrado para no chocar con filtroRolId
    const [formEmpresaId, setFormEmpresaId] = useState<number | string>(''); // Renombrado
    const [formIsActive, setFormIsActive] = useState(true); // Renombrado

    const [isSubmitting, setIsSubmitting] = useState(false); // Loading del formulario
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // --- NUEVOS ESTADOS PARA FILTROS ---
    const [filtros, setFiltros] = useState<LocalUserFilters>({
        rolId: '',
        empresaId: '',
        searchTerm: '',
        isActive: 'true', // Mostrar solo activos por defecto
    });

    const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
        // Reset success/error messages when filters change
        setFormSuccess(null);
        setError(null);
    };
    // --- FIN NUEVOS ESTADOS PARA FILTROS ---


    // --- Funciones de Carga de Datos ---
    // Dentro de GestionUsuarios.tsx
    const fetchCommonData = useCallback(async () => {
        console.log("[GestionUsuarios] Fetching roles and empresas...");
        try {
            // Intenta cargar AMBAS listas
            const [rolesData, empresasData] = await Promise.all([
                getRoles(),     // Llama a la función en api.ts
                getEmpresas()   // Llama a la función en api.ts
            ]);
            setRoles(rolesData);
            setEmpresas(empresasData);
        } catch (err: any) { // <-- Si CUALQUIERA de las dos llamadas falla, entra aquí
            console.error("Error fetching roles/empresas", err); // <-- MIRA ESTE ERROR DETALLADO
            setError("Error al cargar datos necesarios (roles/empresas)."); // <-- Este es el mensaje que ves
        }
    }, []);

    const fetchUsuarios = useCallback(async (currentFiltros: LocalUserFilters) => {
        console.log("[GestionUsuarios] Fetching usuarios with filters:", currentFiltros);
        setIsLoading(true); setError(null); setFormSuccess(null); // Limpia mensajes generales

        const apiFilters: { [key: string]: any } = {};
        // Construye el objeto de filtros para la API, excluyendo valores vacíos
        if (currentFiltros.rolId !== '') {
             // Envía el ID del rol. Si tu backend solo filtra por nombre, necesitarás buscar el nombre aquí.
             // Asumimos que el backend puede filtrar por rol_id si pasas el ID.
             apiFilters.rol_id = currentFiltros.rolId;
        }
        if (currentFiltros.empresaId !== '') {
            apiFilters.empresa_id = currentFiltros.empresaId;
        }
        if (currentFiltros.searchTerm.trim() !== '') {
             // Esto dependerá completamente de si tu backend UserViewSet implementa búsqueda por 'search'.
             apiFilters.search = currentFiltros.searchTerm.trim();
        }
         if (currentFiltros.isActive !== '' && currentFiltros.isActive !== 'all') {
            apiFilters.is_active = currentFiltros.isActive === 'true'; // Convierte a booleano si no es 'all'
        }

        try {
            // Pasa el objeto apiFilters a la llamada getUsuarios
            const data = await getUsuarios(apiFilters); // Llama a la función API de usuarios con filtros
            setUsuarios(data);
            console.log("[GestionUsuarios] Usuarios cargados con filtros:", data.length);
        } catch (err: any) {
            console.error("[GestionUsuarios] Error fetching usuarios with filters", err);
            setError(err.response?.data?.detail || err.message || "Error al cargar usuarios");
        } finally {
            setIsLoading(false);
        }
    }, [roles]); // Depende de 'roles' para poder mapear ID a nombre si fuera necesario


    // Carga inicial y re-carga cuando CAMBIAN LOS ESTADOS DE FILTRO
    useEffect(() => {
        fetchCommonData(); // Carga roles y empresas una vez al inicio
    }, [fetchCommonData]); // Dependencia correcta

    useEffect(() => {
         // Llama a fetchUsuarios cada vez que el objeto 'filtros' cambia
         // Pasa el estado actual de filtros a la función
        fetchUsuarios(filtros);
    }, [filtros, fetchUsuarios]); // Depende de 'filtros' y de la función fetchUsuarios (que es estable gracias a useCallback y sus deps)


    // --- Lógica del Formulario y Acciones ---
    const resetForm = () => {
        console.log("[GestionUsuarios] Reseteando formulario.");
        setEditingUser(null); setId(null);
        setCedula(''); setPassword(''); setPasswordConfirm(''); setNombre(''); setApellido('');
        setEmail(''); setUsername('');
        setFormRolId(''); setFormEmpresaId(''); setFormIsActive(true); // Usa estados del form
        setShowForm(false); setFormError(null); setFormSuccess(null); setIsSubmitting(false);
    };

    const handleEditClick = (user: UserData) => {
        console.log(`[GestionUsuarios] Preparando edición para usuario ID: ${user.id}`);
        if (showForm && editingUser?.id === user.id) {
            resetForm(); return; // Cierra si se vuelve a pulsar editar en el mismo
        }
        setEditingUser(user);
        setId(user.id);
        setCedula(user.cedula);
        setPassword(''); setPasswordConfirm('');
        setNombre(user.nombre || '');
        setApellido(user.apellido || '');
        setEmail(user.email || '');
        setUsername(user.username || '');
        setFormRolId(user.rol?.id || ''); // Usa formRolId
        // Asegúrate de setear '' si la empresa es null para el placeholder del select
        setFormEmpresaId(user.empresa?.id || ''); // Usa formEmpresaId
        setFormIsActive(user.is_active ?? true); // Usa formIsActive
        setShowForm(true);
        setFormError(null); setFormSuccess(null);
        window.scrollTo(0, 0); // Sube la página para ver el form
        console.log(`[GestionUsuarios] Formulario preparado para editar ID: ${user.id}`);
    };

    const handleDeleteClick = async (userId: number, userIdentifier: string) => {
        console.log(`[GestionUsuarios] handleDeleteClick para ID: ${userId}`);
        // Doble confirmación por seguridad
        if (window.confirm(`¿Eliminar usuario "${userIdentifier}" (ID: ${userId})?`) &&
            window.confirm("¡ACCIÓN IRREVERSIBLE! ¿Estás completamente seguro?")) {
            setError(null); setFormSuccess(null); // Limpia mensajes generales
            try {
                console.log(`[GestionUsuarios] Llamando deleteUsuario API para ID: ${userId}`);
                await deleteUsuario(userId);
                console.log(`[GestionUsuarios] deleteUsuario API OK para ID: ${userId}`);
                setFormSuccess(`Usuario "${userIdentifier}" eliminado.`); // Muestra mensaje de éxito
                // Después de eliminar, re-cargar con los filtros actuales
                fetchUsuarios(filtros); // Pasa los filtros actuales
            } catch (err: any) {
                const errorMsg = err.response?.data?.detail || err.message || `Error al eliminar ${userIdentifier}`;
                console.error(`[GestionUsuarios] Error deleteUsuario API ID: ${userId}:`, errorMsg, err.response || err);
                setError(errorMsg); // Muestra error general
            }
        } else { console.log(`[GestionUsuarios] Borrado cancelado ID: ${userId}`); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);
        console.log(`[GestionUsuarios] handleSubmit. Editando ID: ${id}. Rol ID: ${formRolId}, Empresa ID: ${formEmpresaId}`); // Usa estados del form

        // Validaciones Frontend
        if (!editingUser && password !== passwordConfirm) {
            setFormError("Las contraseñas no coinciden."); setIsSubmitting(false); return;
        }
        if (!formRolId) { setFormError("Debes seleccionar un rol."); setIsSubmitting(false); return; }
        if (!cedula) { setFormError("La cédula es obligatoria."); setIsSubmitting(false); return; }


        const selectedRolObj = roles.find(r => r.id === Number(formRolId)); // Usa formRolId
        let finalEmpresaId: number | null = null;

        if (selectedRolObj?.nombre === 'cliente') {
            if (!formEmpresaId || formEmpresaId === '') { // Usa formEmpresaId
                setFormError("El rol 'cliente' requiere seleccionar una empresa."); setIsSubmitting(false); return;
            }
            finalEmpresaId = Number(formEmpresaId); // Usa formEmpresaId
        } else {
            finalEmpresaId = null; // Asegura null para otros roles
        }

        try {
            let mensajeExito = '';
            if (editingUser && id) { // --- ACTUALIZAR ---
                const updateData: Partial<Omit<UsuarioInputData, 'password' | 'cedula'>> = {
                    nombre: nombre || null, apellido: apellido || null, email: email || null,
                    username: username || null, rol_id: Number(formRolId), // Usa formRolId
                    empresa_id: finalEmpresaId, is_active: formIsActive, // Usa formIsActive
                };
                console.log(`[GestionUsuarios] Intentando updateUsuario API ID: ${id}`, updateData);
                const userActualizado = await updateUsuario(id, updateData);
                console.log(`[GestionUsuarios] updateUsuario API OK ID: ${id}`);
                mensajeExito = `Usuario "${userActualizado.cedula}" actualizado.`;
            } else { // --- CREAR ---
                if (!password) { setFormError("La contraseña es obligatoria al crear."); setIsSubmitting(false); return; }
                const createData: UsuarioInputData = {
                    cedula, password, nombre: nombre || null, apellido: apellido || null,
                    email: email || null, username: username || null,
                    rol_id: Number(formRolId), empresa_id: finalEmpresaId, is_active: formIsActive, // Usa estados del form
                };
                console.log(`[GestionUsuarios] Intentando createUsuario API`, createData);
                const nuevoUser = await createUsuario(createData);
                console.log(`[GestionUsuarios] createUsuario API OK`);
                mensajeExito = `Usuario "${nuevoUser.cedula}" creado.`;
            }
            setFormSuccess(mensajeExito);
            resetForm(); // Limpia el formulario
            fetchUsuarios(filtros); // Re-carga la lista con los filtros actuales
        } catch (err: any) {
            console.error("Error guardando usuario:", err.response?.data || err.message);
            const backendErrors = err.response?.data;
            // Intenta mostrar errores específicos del backend
            if (typeof backendErrors === 'object' && backendErrors !== null) {
                setFormError(Object.entries(backendErrors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; '));
            } else {
                setFormError(err.message || "Error al guardar el usuario.");
            }
        } finally {
            setIsSubmitting(false); // Libera el botón
        }
    };


    // --- Renderizado del Componente (con classNames) ---
    return (
        // --- Usa clases del CSS Module ---
        <div className={styles.gestionContainer}>
            <h3 className={styles.title}>Gestionar Usuarios</h3>

            {/* Botón Crear */}
            <div className={styles.actionBar}> {/* Envuelve en actionBar si quieres estilos específicos */}
                {!editingUser && (
                    <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                            className={`${styles.commonButton} ${showForm ? styles.cancelButton : styles.createButton}`}>
                        {showForm ? 'Ocultar Formulario' : '+ Crear Nuevo Usuario'}
                    </button>
                 )}
                {/* Mensajes generales van fuera del action bar o dentro según preferencia */}
                {!showForm && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
                {!showForm && error && <p className={styles.generalError}>{error}</p>}
             </div>


            {/* Formulario Crear/Editar */}
            {showForm && (
                <form onSubmit={handleSubmit} className={styles.usuarioForm}>
                    <h4 className={styles.formTitle}>{editingUser ? `Editando Usuario: ${editingUser.cedula}` : 'Nuevo Usuario'}</h4>

                    <div className={styles.inputGroup}>
                        <label htmlFor="user-cedula" className={styles.label}>Cédula:*</label>
                        <input id="user-cedula" type="text" value={cedula} onChange={e => setCedula(e.target.value)} required className={styles.input} disabled={!!editingUser} />
                        {!editingUser && <small className={styles.labelSmall}>La cédula no se puede cambiar después.</small>}
                     </div>

                    {!editingUser && (<>
                        <div className={styles.inputGroup}> <label htmlFor="user-pass" className={styles.label}>Contraseña:*</label> <input id="user-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={styles.input} autoComplete="new-password" /> </div>
                        <div className={styles.inputGroup}> <label htmlFor="user-pass2" className={styles.label}>Confirmar Contraseña:*</label> <input id="user-pass2" type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required className={styles.input} autoComplete="new-password" /> </div>
                     </>)}

                    <div className={styles.inputGroup}> <label htmlFor="user-nombre" className={styles.label}>Nombre:</label> <input id="user-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} className={styles.input} /> </div>
                    <div className={styles.inputGroup}> <label htmlFor="user-apellido" className={styles.label}>Apellido:</label> <input id="user-apellido" type="text" value={apellido} onChange={e => setApellido(e.target.value)} className={styles.input} /> </div>
                    <div className={styles.inputGroup}> <label htmlFor="user-email" className={styles.label}>Email:</label> <input id="user-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} /> </div>

                    {/* Rol Dropdown */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="user-rol" className={styles.label}>Rol:*</label>
                        <select id="user-rol" name="formRolId" value={formRolId} onChange={e => { const newRolId = e.target.value; setFormRolId(newRolId); if (roles.find(r => r.id === Number(newRolId))?.nombre !== 'cliente') { setFormEmpresaId(''); } }} required className={styles.select}>
                            <option value="" disabled>-- Selecciona un rol --</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                    </div>

                    {/* Empresa Dropdown (solo si Rol es Cliente) */}
                    {roles.find(r => r.id === Number(formRolId))?.nombre === 'cliente' && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="user-empresa" className={styles.label}>Empresa (para Cliente):*</label>
                            <select id="user-empresa" name="formEmpresaId" value={formEmpresaId || ''} onChange={e => setFormEmpresaId(e.target.value)} required className={styles.select}>
                                <option value="" disabled>-- Selecciona una empresa --</option>
                                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Activo Checkbox */}
                    <div className={styles.inputGroup}>
                        <label className={styles.checkboxLabel}>
                            <input type="checkbox" name="formIsActive" checked={formIsActive} onChange={e => setFormIsActive(e.target.checked)} className={styles.checkboxInput} />
                            Usuario Activo
                        </label>
                    </div>

                    {/* Mensajes y Botones del Form */}
                    {formError && <p className={styles.formError}>{formError}</p>}
                    {formSuccess && !isSubmitting && <p className={styles.formSuccess}>{formSuccess}</p>}
                    <div className={styles.buttonGroup}>
                        <button type="submit" disabled={isSubmitting} className={`${styles.commonButton} ${styles.submitButton}`}> {isSubmitting ? 'Guardando...' : (editingUser ? 'Actualizar Usuario' : 'Crear Usuario')} </button>
                        {/* Solo muestra Cancelar Edición si está editando */}
                        {editingUser && <button type="button" onClick={resetForm} className={`${styles.commonButton} ${styles.cancelButton}`}>Cancelar Edición</button>}
                    </div>
                </form>
            )}

            {/* --- SECCIÓN DE FILTROS --- */}
            {!showForm && ( /* Oculta filtros si el formulario está visible */
                <div className={styles.filterContainer}>
                     <h4 className={styles.listTitle}>Filtros de Usuarios</h4> {/* O un título apropiado */}
                    <div className={styles.filterGroup}>
                        <label htmlFor="filtroRolId" className={styles.filterLabel}>Rol:</label>
                        <select id="filtroRolId" name="rolId" value={filtros.rolId} onChange={handleFiltroChange} className={styles.filterSelect} disabled={roles.length === 0}>
                            <option value="">Todos los roles</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                         <label htmlFor="filtroEmpresaId" className={styles.filterLabel}>Empresa Cliente:</label>
                         <select id="filtroEmpresaId" name="empresaId" value={filtros.empresaId} onChange={handleFiltroChange} className={styles.filterSelect} disabled={empresas.length === 0}>
                             <option value="">Todas las empresas</option>
                             {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                         </select>
                    </div>
                    <div className={styles.filterGroup}>
                         <label htmlFor="filtroIsActive" className={styles.filterLabel}>Estado:</label>
                         <select id="filtroIsActive" name="isActive" value={String(filtros.isActive)} onChange={handleFiltroChange} className={styles.filterSelect}>
                             <option value="true">Activos</option>
                             <option value="false">Inactivos</option>
                             <option value="all">Todos</option> {/* Opción para ver todos */}
                         </select>
                    </div>
                     <div className={styles.filterGroup}>
                        <label htmlFor="searchTerm" className={styles.filterLabel}>Buscar:</label>
                        <input
                            type="text"
                            id="searchTerm"
                            name="searchTerm"
                            value={filtros.searchTerm}
                            onChange={handleFiltroChange}
                            placeholder="Cédula, Nombre, Email..."
                            className={styles.filterInput}
                        />
                     </div>
                </div>
            )}
             {/* --- FIN SECCIÓN DE FILTROS --- */}


            {/* Lista de Usuarios */}
            <h4 className={styles.listTitle}>Usuarios Registrados</h4>
            {/* Mover mensajes generales aquí si no se muestran en actionBar */}
            {!showForm && !editingUser && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
            {error && <p className={styles.generalError}>{error}</p>}


            {isLoading ? (<p>Cargando usuarios...</p>)
                : !error && usuarios.length === 0 ? (<p>No hay usuarios para mostrar con los filtros seleccionados.</p>)
                    : !error ? (
                        <div className={styles.listContainer}> {/* Contenedor para scroll y borde */}
                            <table className={styles.usuarioTable}>
                                <thead>
                                    <tr>
                                        <th>Cédula</th><th>Nombre</th><th>Email</th><th>Rol</th>
                                        <th>Empresa</th><th>Activo</th><th className={styles.actionsCell}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.cedula}</td>
                                            <td>{`${user.nombre || ''} ${user.apellido || ''}`.trim() || '-'}</td>
                                            <td>{user.email || '-'}</td>
                                            <td>{user.rol?.nombre || <span style={{ color: 'red' }}>N/A</span>}</td>
                                            <td>{user.empresa?.nombre || '-'}</td>
                                            <td style={{ textAlign: 'center' }}>{user.is_active ? '✔️' : '❌'}</td>
                                            <td className={styles.actionsCell}>
                                                <button onClick={() => handleEditClick(user)} className={`${styles.listButton} ${styles.editButton}`} title="Editar">✏️</button>
                                                <button onClick={() => handleDeleteClick(user.id, user.cedula || user.email || `ID ${user.id}`)} className={`${styles.listButton} ${styles.deleteButton}`} title="Eliminar">🗑️</button>
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

export default GestionUsuarios;