// frontend/src/components/JefeEmpresa/GestionUsuarios.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    getUsuarios, createUsuario, updateUsuario, deleteUsuario, getRoles
} from '../../services/usuarios';   // <-- Funciones de Usuarios y Roles
import { getEmpresas } from '../../services/empresas';     // <-- Función de Empresas
import { getVehiculos } from '../../services/transporte';  // <-- Función de Vehículos
import styles from '../../styles/JefeEmpresa/GestionUsuarios.module.css';
// --- ASEGÚRATE DE IMPORTAR LOS TIPOS NECESARIOS ---
import { UserData, RolData, UsuarioInputData, VehiculoData } from '../../types/pedido'; // Ajusta ruta

// Reutiliza o importa interfaces (asegúrate que coincidan con tu api.ts y AuthContext)
interface EmpresaDataOutput { id: number; nombre: string; /* otros campos si los definiste */ }

interface LocalUserFilters {
    rolId: number | string;
    empresaId: number | string;
    searchTerm: string;
    isActive: boolean | string; // 'true', 'false', or 'all'
}

const GestionUsuarios: React.FC = () => {
    // Usa la interfaz UserData importada
    const [usuarios, setUsuarios] = useState<UserData[]>([]);
    const [roles, setRoles] = useState<RolData[]>([]);
    const [empresas, setEmpresas] = useState<EmpresaDataOutput[]>([]);
    const [vehiculos, setVehiculos] = useState<VehiculoData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingSelects, setLoadingSelects] = useState(false);
    const [loadingVehiculos, setLoadingVehiculos] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    // Usa la interfaz UserData importada
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    // Estado del formulario (sin cambios aquí)
    const [id, setId] = useState<number | null>(null);
    const [cedula, setCedula] = useState('');
    // ... (resto de estados del formulario: password, nombre, ..., formVehiculoId, formIsActive) ...
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [formRolId, setFormRolId] = useState<number | string>('');
    const [formEmpresaId, setFormEmpresaId] = useState<number | string>('');
    const [formVehiculoId, setFormVehiculoId] = useState<number | string>('');
    const [formIsActive, setFormIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    // Estados para Filtros
    const [filtros, setFiltros] = useState<LocalUserFilters>({
        rolId: '',
        empresaId: '',
        searchTerm: '',
        isActive: 'true',
    });

    const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
        setFormSuccess(null); setError(null);
    };

    // --- Funciones de Carga de Datos ---
    const fetchCommonData = useCallback(async () => {
        console.log("[GestionUsuarios] Fetching roles, empresas, y vehiculos...");
        setLoadingSelects(true); // Inicia carga de selects
        setError(null);
        try {
            const [rolesData, empresasData, vehiculosData] = await Promise.all([
                getRoles(), // Asume que getRoles ahora llama a la API si lo implementaste
                getEmpresas(),
                getVehiculos()
            ]);
            setRoles(rolesData);
            setEmpresas(empresasData);
            setVehiculos(vehiculosData.filter(v => v.activo)); // Guarda solo vehículos activos
            console.log("[GestionUsuarios] Datos comunes cargados.");
        } catch (err: any) {
            console.error("Error fetching common data", err);
            setError("Error al cargar datos necesarios (roles/empresas/vehículos).");
        } finally {
            setLoadingSelects(false); // Termina carga de selects
        }
    }, []);

    // CORREGIDO: fetchUsuarios envía 'rol' y 'empresa' con IDs para el FilterSet
    const fetchUsuarios = useCallback(async (currentFiltros: LocalUserFilters) => {
        console.log("[GestionUsuarios] Fetching usuarios con filtros:", currentFiltros);
        setIsLoading(true); setError(null); // Limpia error de lista

        const apiFilters: { [key: string]: any } = {};
        if (currentFiltros.rolId !== '') {
            apiFilters.rol = currentFiltros.rolId; // <-- Correcto: envía ID para el parámetro 'rol'
        }
        if (currentFiltros.empresaId !== '') { apiFilters.empresa = currentFiltros.empresaId; }
        if (currentFiltros.searchTerm.trim() !== '') { apiFilters.search = currentFiltros.searchTerm.trim(); }
        if (currentFiltros.isActive !== '' && currentFiltros.isActive !== 'all') { apiFilters.is_active = currentFiltros.isActive === 'true'; }

        try {
            const data = await getUsuarios(apiFilters);
            setUsuarios(data); // Causa el error si data no incluye vehiculo_asignado
            console.log("[GestionUsuarios] Usuarios cargados:", data)
            console.log("[GestionUsuarios] Usuarios cargados:", data.length);
        } catch (err: any) {
            console.error("[GestionUsuarios] Error fetching usuarios", err);
            setError(err.response?.data?.detail || err.message || "Error al cargar usuarios");
            setUsuarios([]); // Limpia en caso de error
        } finally {
            setIsLoading(false);
        }
    }, []); // Dependencias vacías, usa currentFiltros

    // useEffects (sin cambios)
    useEffect(() => { fetchCommonData(); }, [fetchCommonData]);
    useEffect(() => { fetchUsuarios(filtros); }, [filtros, fetchUsuarios]);


    // --- Lógica del Formulario y Acciones ---
    // CORREGIDO: resetForm
    const resetForm = () => {
        console.log("[GestionUsuarios] Reseteando formulario.");
        setEditingUser(null); setId(null);
        setCedula(''); setPassword(''); setPasswordConfirm(''); setNombre(''); setApellido('');
        setEmail(''); setUsername('');
        setFormRolId(''); setFormEmpresaId(''); setFormIsActive(true);
        setFormVehiculoId(''); // <-- Limpiar vehículo
        setShowForm(false); setFormError(null); setFormSuccess(null); setIsSubmitting(false);
    };

    // CORREGIDO: handleEditClick limpia vehículo (simplificado)
    const handleEditClick = (user: UserData) => {
        console.log(`[GestionUsuarios] Preparando edición para usuario ID: ${user.id}`);
        if (showForm && editingUser?.id === user.id) { resetForm(); return; }

        setEditingUser(user);
        setId(user.id);
        setCedula(user.cedula);
        setPassword(''); setPasswordConfirm('');
        setNombre(user.nombre || '');
        setApellido(user.apellido || '');
        setEmail(user.email || '');
        setUsername(user.username || '');
        setFormRolId(user.rol?.id || '');
        setFormEmpresaId(user.empresa?.id || '');
        setFormIsActive(user.is_active ?? true);
        setFormVehiculoId(''); // <-- Limpiar vehículo al empezar a editar
        setShowForm(true);
        setFormError(null); setFormSuccess(null);
        window.scrollTo(0, 0);
        console.log(`[GestionUsuarios] Formulario preparado para editar ID: ${user.id}`);
    };

    const handleDeleteClick = async (userId: number, userIdentifier: string) => {
        // ... (lógica sin cambios, pero llama a fetchUsuarios(filtros) al final) ...
        if (window.confirm(/*...*/) && window.confirm(/*...*/)) {
            // ... try/catch ...
            await deleteUsuario(userId);
            setFormSuccess(`Usuario "${userIdentifier}" eliminado.`);
            fetchUsuarios(filtros); // Recarga con filtros actuales
            // ... finally ...
        }
    };

    // CORREGIDO: handleSubmit incluye lógica de vehiculo_asignado_id
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);
        console.log(`[GestionUsuarios] handleSubmit. Editando ID: ${id}. Rol ID: ${formRolId}, Vehiculo ID: ${formVehiculoId}`);

        // Validaciones Frontend
        if (!editingUser && password !== passwordConfirm) { /*...*/ setFormError("Las contraseñas no coinciden."); setIsSubmitting(false); return; }
        if (!formRolId) { /*...*/ setFormError("Debes seleccionar un rol."); setIsSubmitting(false); return; }
        if (!cedula) { /*...*/ setFormError("La cédula es obligatoria."); setIsSubmitting(false); return; }

        const selectedRolObj = roles.find(r => r.id === Number(formRolId));
        let finalEmpresaId: number | null = null;
        let finalVehiculoId: number | null = null; // <--- Variable para ID vehículo

        // Determina empresa y vehículo basado en rol
        if (selectedRolObj?.nombre === 'cliente') {
            if (!formEmpresaId || formEmpresaId === '') { /*...*/ setFormError("El rol 'cliente' requiere seleccionar una empresa."); setIsSubmitting(false); return; }
            finalEmpresaId = Number(formEmpresaId);
            finalVehiculoId = null; // Clientes no tienen vehículo
        } else if (selectedRolObj?.nombre === 'conductor') {
            finalEmpresaId = null; // Conductores no tienen empresa
            finalVehiculoId = formVehiculoId ? Number(formVehiculoId) : null; // Asigna ID o null
        } else {
            finalEmpresaId = null;
            finalVehiculoId = null; // Otros roles no tienen ninguno
        }

        try {
            let mensajeExito = '';
            if (editingUser && id) { // --- ACTUALIZAR ---
                // Asegúrate que UsuarioInputData incluya vehiculo_asignado_id
                const updateData: Partial<UsuarioInputData> = {
                    nombre: nombre || null, apellido: apellido || null, email: email || null,
                    username: username || null, rol_id: Number(formRolId),
                    empresa_id: finalEmpresaId,
                    vehiculo_asignado_id: finalVehiculoId, // <-- Campo añadido
                    is_active: formIsActive,
                };
                console.log(`[GestionUsuarios] Intentando updateUsuario API ID: ${id}`, updateData);
                const userActualizado = await updateUsuario(id, updateData);
                console.log(`[GestionUsuarios] updateUsuario API OK ID: ${id}`);
                mensajeExito = `Usuario "${userActualizado.cedula}" actualizado.`;
            } else { // --- CREAR ---
                if (!password) { /*...*/ setFormError("La contraseña es obligatoria al crear."); setIsSubmitting(false); return; }
                // Asegúrate que UsuarioInputData incluya vehiculo_asignado_id
                const createData: UsuarioInputData = {
                    cedula, password, nombre: nombre || null, apellido: apellido || null,
                    email: email || null, username: username || null,
                    rol_id: Number(formRolId), empresa_id: finalEmpresaId,
                    vehiculo_asignado_id: finalVehiculoId, // <-- Campo añadido
                    is_active: formIsActive,
                };
                console.log(`[GestionUsuarios] Intentando createUsuario API`, createData);
                const nuevoUser = await createUsuario(createData);
                console.log(`[GestionUsuarios] createUsuario API OK`);
                mensajeExito = `Usuario "${nuevoUser.cedula}" creado.`;
            }
            setFormSuccess(mensajeExito);
            resetForm();
            fetchUsuarios(filtros); // Recarga con filtros actuales
        } catch (err: any) {
            // ... (manejo de errores sin cambios) ...
            console.error("Error guardando usuario:", err.response?.data || err.message);
            const backendErrors = err.response?.data;
            if (typeof backendErrors === 'object' && backendErrors !== null) { setFormError(Object.entries(backendErrors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')); }
            else { setFormError(err.message || "Error al guardar el usuario."); }
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Renderizado del Componente ---
    return (
        <div className={styles.gestionContainer}>
            <h3 className={styles.title}>Gestionar Usuarios</h3>

            {/* Botón Crear y Mensajes Generales */}
            <div className={styles.actionBar}>
                {!editingUser && (
                    <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }} className={`${styles.commonButton} ${showForm ? styles.cancelButton : styles.createButton}`}>
                        {showForm ? 'Ocultar Formulario' : '+ Crear Nuevo Usuario'}
                    </button>
                )}
                {/* Muestra éxito general SOLO si el form NO está visible */}
                {!showForm && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
                {/* Muestra error general si no es un error específico del form */}
                {error && !formError && <p className={styles.generalError}>{error}</p>}
            </div>

            {/* Formulario Crear/Editar (Condicional como antes) */}
            {showForm && (
                <form onSubmit={handleSubmit} className={styles.usuarioForm}>
                    <h4 className={styles.formTitle}>{editingUser ? `Editando Usuario: ${editingUser.cedula}` : 'Nuevo Usuario'}</h4>

                    {/* Campos Cédula, Password, Nombre, Apellido, Email */}
                    <div className={styles.inputGroup}> <label htmlFor="user-cedula" className={styles.label}>Cédula:*</label> <input id="user-cedula" type="text" value={cedula} onChange={e => setCedula(e.target.value)} required className={styles.input} disabled={!!editingUser} /> {!editingUser && <small className={styles.labelSmall}>No se puede cambiar después.</small>} </div>
                    {!editingUser && (<> <div className={styles.inputGroup}> <label htmlFor="user-pass" className={styles.label}>Contraseña:*</label> <input id="user-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={styles.input} autoComplete="new-password" /> </div> <div className={styles.inputGroup}> <label htmlFor="user-pass2" className={styles.label}>Confirmar Contraseña:*</label> <input id="user-pass2" type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required className={styles.input} autoComplete="new-password" /> </div> </>)}
                    <div className={styles.inputGroup}> <label htmlFor="user-nombre" className={styles.label}>Nombre:</label> <input id="user-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} className={styles.input} /> </div>
                    <div className={styles.inputGroup}> <label htmlFor="user-apellido" className={styles.label}>Apellido:</label> <input id="user-apellido" type="text" value={apellido} onChange={e => setApellido(e.target.value)} className={styles.input} /> </div>
                    <div className={styles.inputGroup}> <label htmlFor="user-email" className={styles.label}>Email:</label> <input id="user-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} /> </div>


                    {/* Rol Dropdown */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="user-rol" className={styles.label}>Rol:*</label>
                        <select
                            id="user-rol"
                            name="formRolId"
                            value={formRolId}
                            onChange={e => {
                                const newRolId = e.target.value;
                                setFormRolId(newRolId);
                                if (roles.find(r => r.id === Number(newRolId))?.nombre !== 'cliente') { setFormEmpresaId(''); }
                                if (roles.find(r => r.id === Number(newRolId))?.nombre !== 'conductor') { setFormVehiculoId(''); }
                            }}
                            required
                            className={styles.select}
                            disabled={loadingSelects} // Deshabilita mientras cargan roles/empresas/vehiculos
                        >
                            <option value="" disabled>-- Selecciona un rol --</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                    </div>

                    {/* RENDERIZADO CONDICIONAL: Empresa */}
                    {roles.find(r => r.id === Number(formRolId))?.nombre === 'cliente' && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="user-empresa" className={styles.label}>Empresa (para Cliente):*</label>
                            <select id="user-empresa" name="formEmpresaId" value={formEmpresaId || ''} onChange={e => setFormEmpresaId(e.target.value)} required className={styles.select} disabled={loadingSelects || empresas.length === 0}>
                                <option value="" disabled>-- Selecciona empresa --</option>
                                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                            </select>
                            {loadingSelects && <span className={styles.loadingSmall}> Cargando...</span>}
                            {!loadingSelects && empresas.length === 0 && <small className={styles.loadingSmall}> No hay empresas.</small>}
                        </div>
                    )}

                    {/* RENDERIZADO CONDICIONAL: Vehículo */}
                    {roles.find(r => r.id === Number(formRolId))?.nombre === 'conductor' && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="user-vehiculo" className={styles.label}>Vehículo Asignado:</label>
                            <select
                                id="user-vehiculo"
                                name="formVehiculoId"
                                value={formVehiculoId || ''}
                                onChange={e => setFormVehiculoId(e.target.value)}
                                className={styles.select}
                                disabled={loadingSelects || vehiculos.length === 0} // Usa loadingSelects general
                            >
                                <option value="">-- Sin Asignar --</option>
                                {vehiculos.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.placa} ({v.tipo?.nombre || 'Inválido'}) {/* Asegúrate que v.tipo exista y tenga nombre */}
                                    </option>
                                ))}
                            </select>
                            {loadingSelects && <span className={styles.loadingSmall}> Cargando...</span>}
                            {!loadingSelects && vehiculos.length === 0 && <small className={styles.loadingSmall}> No hay vehículos activos.</small>}
                        </div>
                    )}

                    {/* Activo Checkbox */}
                    <div className={styles.inputGroup}>
                        <label className={styles.checkboxLabel}>
                            <input type="checkbox" name="formIsActive" checked={formIsActive} onChange={e => setFormIsActive(e.target.checked)} className={styles.checkboxInput} /> Usuario Activo
                        </label>
                    </div>

                    {/* Mensajes y Botones del Form */}
                    {formError && <p className={styles.formError}>{formError}</p>}
                    {/* Mostramos éxito aquí solo si está submitiendo, para feedback inmediato */}
                    {isSubmitting && formSuccess && <p className={styles.formSuccess}>{formSuccess}</p>}
                    <div className={styles.buttonGroup}>
                        <button type="submit" disabled={isSubmitting || loadingSelects} className={`${styles.commonButton} ${styles.submitButton}`}> {isSubmitting ? 'Guardando...' : (editingUser ? 'Actualizar Usuario' : 'Crear Usuario')} </button>
                        {/* El botón cancelar ahora siempre llama a resetForm */}
                        <button type="button" onClick={resetForm} className={`${styles.commonButton} ${styles.cancelButton}`}>Cancelar</button>
                    </div>
                </form>
            )}

            {/* --- Filtros de Usuarios (MOVIDO FUERA del !showForm) --- */}
            <div className={styles.filterContainer}>
                <h4 className={styles.filterTitle}>Filtros</h4> {/* Título para la sección */}
                {/* Filtro Rol */}
                <div className={styles.filterGroup}>
                    <label htmlFor="filtroRolId" className={styles.filterLabel}>Rol:</label>
                    <select id="filtroRolId" name="rolId" value={filtros.rolId} onChange={handleFiltroChange} className={styles.filterSelect} disabled={loadingSelects || roles.length === 0}>
                        <option value="">Todos</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                </div>
                {/* Filtro Empresa */}
                <div className={styles.filterGroup}>
                    <label htmlFor="filtroEmpresaId" className={styles.filterLabel}>Empresa:</label>
                    <select id="filtroEmpresaId" name="empresaId" value={filtros.empresaId} onChange={handleFiltroChange} className={styles.filterSelect} disabled={loadingSelects || empresas.length === 0}>
                        <option value="">Todas</option>
                        {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                </div>
                {/* Filtro Estado */}
                <div className={styles.filterGroup}>
                    <label htmlFor="filtroIsActive" className={styles.filterLabel}>Estado:</label>
                    <select id="filtroIsActive" name="isActive" value={String(filtros.isActive)} onChange={handleFiltroChange} className={styles.filterSelect}>
                        <option value="true">Activos</option>
                        <option value="false">Inactivos</option>
                        <option value="all">Todos</option>
                    </select>
                </div>
                {/* Filtro Búsqueda */}
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
                {/* Indicador carga para selects */}
                {loadingSelects && <div className={styles.loadingSmall}><small>Cargando filtros...</small></div>}
            </div>
            {/* --- FIN Filtros de Usuarios --- */}

            {/* Lista de Usuarios (Añadida columna Vehículo) */}
            <h4 className={styles.listTitle}>Usuarios Registrados</h4>
            {!showForm && !editingUser && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
            {error && <p className={styles.generalError}>{error}</p>}
            {isLoading ? (<p>Cargando usuarios...</p>)
                : !error && usuarios.length === 0 ? (<p>No hay usuarios para mostrar con los filtros seleccionados.</p>)
                    : !error ? (
                        <div className={styles.listContainer}>
                            <table className={styles.usuarioTable}>
                                <thead>
                                    <tr>
                                        <th>Cédula</th><th>Nombre</th><th>Email</th><th>Rol</th>
                                        <th>Empresa</th>
                                        <th>Vehículo</th> {/* <-- COLUMNA AÑADIDA --> */}
                                        <th>Activo</th><th className={styles.actionsCell}>Acciones</th>
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
                                            {/* --- CELDA AÑADIDA --- */}
                                            {/*<td>{user.vehiculo_asignado || '-'}</td>*/}
                                            {/* -------------------- */}
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