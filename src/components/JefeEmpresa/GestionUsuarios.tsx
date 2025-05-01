// frontend/src/components/JefeEmpresa/GestionUsuarios.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    getUsuarios, createUsuario, updateUsuario, deleteUsuario, getRoles,
    // --- Importar función para cambiar contraseña ---
    changeUserPassword
} from '../../services/usuarios';   // <-- Funciones de Usuarios y Roles
import { getEmpresas } from '../../services/empresas';     // <-- Función de Empresas
import { getVehiculos } from '../../services/transporte';  // <-- Función de Vehículos
import styles from '../../styles/JefeEmpresa/GestionUsuarios.module.css';
// --- Tipos necesarios ---
import { UserData, RolData, UsuarioInputData, VehiculoData, EmpresaData } from '../../types/pedido'; // Ajusta ruta y asegúrate que EmpresaData esté exportada en types

// Interfaz local para filtros (ya la tenías)
interface LocalUserFilters {
    rolId: number | string;
    empresaId: number | string;
    searchTerm: string;
    isActive: boolean | string;
}

// Interfaz local para Empresa (si no la importas de types)
interface EmpresaDataOutput extends EmpresaData {}

const GestionUsuarios: React.FC = () => {
    // --- Estados existentes ---
    const [usuarios, setUsuarios] = useState<UserData[]>([]);
    const [roles, setRoles] = useState<RolData[]>([]);
    const [empresas, setEmpresas] = useState<EmpresaDataOutput[]>([]);
    const [vehiculos, setVehiculos] = useState<VehiculoData[]>([]); // Vehículos activos
    const [isLoading, setIsLoading] = useState(false); // Carga de lista usuarios
    const [loadingSelects, setLoadingSelects] = useState(false); // Carga de selects (roles, empresas, vehiculos)
    const [error, setError] = useState<string | null>(null); // Error general o de carga
    const [showForm, setShowForm] = useState(false); // Mostrar form crear/editar
    const [editingUser, setEditingUser] = useState<UserData | null>(null); // Datos del usuario en edición

    // Estados del formulario principal (Crear/Editar)
    const [id, setId] = useState<number | null>(null);
    const [cedula, setCedula] = useState('');
    const [password, setPassword] = useState(''); // Solo para CREAR
    const [passwordConfirm, setPasswordConfirm] = useState(''); // Solo para CREAR
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [formRolId, setFormRolId] = useState<number | string>('');
    const [formEmpresaId, setFormEmpresaId] = useState<number | string>('');
    const [formVehiculoId, setFormVehiculoId] = useState<number | string>('');
    const [formIsActive, setFormIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // Submit del form principal
    const [formError, setFormError] = useState<string | null>(null); // Error del form principal
    const [formSuccess, setFormSuccess] = useState<string | null>(null); // Éxito general (crear/editar/borrar)

    // Estados para Filtros
    const [filtros, setFiltros] = useState<LocalUserFilters>({
        rolId: '', empresaId: '', searchTerm: '', isActive: 'true',
    });

    // --- ESTADOS para Modal Cambiar Contraseña ---
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [targetUserIdForPassword, setTargetUserIdForPassword] = useState<number | null>(null);
    const [targetUserIdentifier, setTargetUserIdentifier] = useState<string>('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
    const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
    // --- FIN ESTADOS Modal ---

    // --- Handlers Filtros ---
    const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
        setFormSuccess(null); setError(null); // Limpia mensajes al cambiar filtros
    };

    // --- Funciones de Carga de Datos ---
    const fetchCommonData = useCallback(async () => {
        // ... (igual que antes: carga roles, empresas, vehiculos) ...
        console.log("[GestionUsuarios] Fetching roles, empresas, y vehiculos...");
        setLoadingSelects(true);
        setError(null);
        try {
            const [rolesData, empresasData, vehiculosData] = await Promise.all([
                getRoles(), getEmpresas(), getVehiculos()
            ]);
            setRoles(rolesData);
            setEmpresas(empresasData);
            // Filtrar vehículos activos al recibirlos
            setVehiculos(vehiculosData.filter(v => v.activo));
            console.log("[GestionUsuarios] Datos comunes cargados.");
        } catch (err: any) {
            console.error("Error fetching common data", err);
            setError("Error al cargar datos necesarios (roles/empresas/vehículos).");
        } finally {
            setLoadingSelects(false);
        }
    }, []);

    const fetchUsuarios = useCallback(async (currentFiltros: LocalUserFilters) => {
        // ... (igual que antes: llama a getUsuarios con filtros) ...
        console.log("[GestionUsuarios] Fetching usuarios con filtros:", currentFiltros);
        setIsLoading(true); setError(null);
        const apiFilters: { [key: string]: any } = {};
        if (currentFiltros.rolId) apiFilters.rol = currentFiltros.rolId;
        if (currentFiltros.empresaId) apiFilters.empresa = currentFiltros.empresaId;
        if (currentFiltros.searchTerm.trim()) apiFilters.search = currentFiltros.searchTerm.trim();
        if (currentFiltros.isActive !== 'all') apiFilters.is_active = currentFiltros.isActive === 'true';

        try {
            const data = await getUsuarios(apiFilters);
            setUsuarios(data);
            console.log("[GestionUsuarios] Usuarios cargados:", data.length);
        } catch (err: any) {
            console.error("[GestionUsuarios] Error fetching usuarios", err);
            setError(err.response?.data?.detail || err.message || "Error al cargar usuarios");
            setUsuarios([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchCommonData(); }, [fetchCommonData]);
    useEffect(() => { fetchUsuarios(filtros); }, [filtros, fetchUsuarios]);

    // --- Handlers Formularios y Acciones ---

    // --- resetForm ACTUALIZADO ---
    const resetForm = () => {
        console.log("[GestionUsuarios] Reseteando formularios y modal.");
        // Resetear form principal
        setEditingUser(null); setId(null);
        setCedula(''); setPassword(''); setPasswordConfirm(''); setNombre(''); setApellido('');
        setEmail(''); setUsername('');
        setFormRolId(''); setFormEmpresaId(''); setFormIsActive(true);
        setFormVehiculoId('');
        setShowForm(false); setFormError(null); setFormSuccess(null); setIsSubmitting(false);

        // Resetear modal contraseña
        setShowPasswordModal(false);
        setTargetUserIdForPassword(null);
        setTargetUserIdentifier('');
        setNewPassword('');
        setConfirmNewPassword('');
        setIsSubmittingPassword(false);
        setPasswordChangeError(null);
        setPasswordChangeSuccess(null);
    };
    // --- FIN resetForm ACTUALIZADO ---

    const handleEditClick = (user: UserData) => {
        console.log(`[GestionUsuarios] Preparando edición para usuario ID: ${user.id}`);
        if (showForm && editingUser?.id === user.id) {
            resetForm(); // Si ya estaba editando este, cierra y limpia todo
            return;
        }
        resetForm(); // Limpia estado previo (incluye modal pass) antes de abrir form edición
        setEditingUser(user);
        setId(user.id);
        setCedula(user.cedula);
        setPassword(''); setPasswordConfirm(''); // Passwords no se cargan al editar
        setNombre(user.nombre || '');
        setApellido(user.apellido || '');
        setEmail(user.email || '');
        setUsername(user.username || '');
        setFormRolId(user.rol?.id || '');
        setFormEmpresaId(user.empresa?.id || '');
        setFormIsActive(user.is_active ?? true);
        // Vehículo no se precarga aquí, se maneja en el select si es conductor
        setFormVehiculoId(''); // Asegurar que esté vacío al inicio de la edición
        setShowForm(true); // Mostrar el formulario de edición
        window.scrollTo(0, 0);
    };

    const handleDeleteClick = async (userId: number, userIdentifier: string) => {
        if (window.confirm(`¿Estás seguro de eliminar al usuario "${userIdentifier}"? Esta acción no se puede deshacer.`)) {
            setError(null); setFormSuccess(null); // Limpia mensajes previos
            // Podrías setear un estado de carga específico para delete
            try {
                await deleteUsuario(userId);
                setFormSuccess(`Usuario "${userIdentifier}" eliminado correctamente.`);
                fetchUsuarios(filtros); // Recarga la lista con los filtros actuales
                resetForm(); // Cierra formularios si estaba editando el eliminado
            } catch (err: any) {
                const errorMsg = err.response?.data?.detail || err.message || `Error al eliminar usuario ${userIdentifier}`;
                setError(errorMsg); // Muestra error general
            } finally {
                // Quitar estado de carga delete si lo usaste
            }
        }
    };

    // handleSubmit para Crear/Editar usuario (principal)
    const handleSubmit = async (e: React.FormEvent) => {
        // ... (Lógica igual que en la respuesta anterior, validando rol, empresa, vehículo) ...
         e.preventDefault();
         setFormError(null); setFormSuccess(null); setIsSubmitting(true);
         console.log(`[GestionUsuarios] handleSubmit. Editando ID: ${id}. Rol ID: ${formRolId}, Vehiculo ID: ${formVehiculoId}`);

         // Validaciones Frontend
         if (!editingUser && password !== passwordConfirm) { setFormError("Las contraseñas no coinciden."); setIsSubmitting(false); return; }
         if (!formRolId) { setFormError("Debes seleccionar un rol."); setIsSubmitting(false); return; }
         if (!cedula) { setFormError("La cédula es obligatoria."); setIsSubmitting(false); return; }

         const selectedRolObj = roles.find(r => r.id === Number(formRolId));
         let finalEmpresaId: number | null = null;
         let finalVehiculoId: number | null = null;

         if (selectedRolObj?.nombre === 'cliente') {
             if (!formEmpresaId) { setFormError("El rol 'cliente' requiere seleccionar una empresa."); setIsSubmitting(false); return; }
             finalEmpresaId = Number(formEmpresaId);
             finalVehiculoId = null;
         } else if (selectedRolObj?.nombre === 'conductor') {
             finalEmpresaId = null;
             finalVehiculoId = formVehiculoId ? Number(formVehiculoId) : null;
         } else {
             finalEmpresaId = null; finalVehiculoId = null;
         }

         try {
             let mensajeExito = '';
             if (editingUser && id) { // --- ACTUALIZAR ---
                 const updateData: Partial<UsuarioInputData> = {
                     nombre: nombre || null, apellido: apellido || null, email: email || null,
                     username: username || null, rol_id: Number(formRolId),
                     empresa_id: finalEmpresaId, vehiculo_asignado_id: finalVehiculoId,
                     is_active: formIsActive,
                     // NO incluimos password aquí
                 };
                 const userActualizado = await updateUsuario(id, updateData);
                 mensajeExito = `Usuario "${userActualizado.cedula}" actualizado.`;
             } else { // --- CREAR ---
                 if (!password) { setFormError("La contraseña es obligatoria al crear."); setIsSubmitting(false); return; }
                 const createData: UsuarioInputData = {
                     cedula, password, nombre: nombre || null, apellido: apellido || null,
                     email: email || null, username: username || null,
                     rol_id: Number(formRolId), empresa_id: finalEmpresaId,
                     vehiculo_asignado_id: finalVehiculoId, is_active: formIsActive,
                 };
                 const nuevoUser = await createUsuario(createData);
                 mensajeExito = `Usuario "${nuevoUser.cedula}" creado.`;
             }
             setFormSuccess(mensajeExito); // Muestra éxito general
             resetForm(); // Cierra form y limpia todo
             fetchUsuarios(filtros); // Recarga lista
         } catch (err: any) {
             console.error("Error guardando usuario:", err.response?.data || err.message);
             const backendErrors = err.response?.data;
             let errorMsg = "Error al guardar el usuario.";
             if (typeof backendErrors === 'object' && backendErrors !== null) {
                 errorMsg = Object.entries(backendErrors).map(([key, value])=>`${key}: ${Array.isArray(value)?value.join(','):value}`).join('; ')||"Error validación";
             } else if (err.message) {
                 errorMsg = err.message;
             }
             setFormError(errorMsg); // Muestra error en el form
         } finally {
             setIsSubmitting(false);
         }
    };

    // --- Handlers Modal Cambiar Contraseña ---
    const openPasswordModal = (userId: number, userIdentifier: string) => {
        resetForm(); // Cierra form edición si está abierto y limpia todo
        setTargetUserIdForPassword(userId);
        setTargetUserIdentifier(userIdentifier || `ID ${userId}`);
        setShowPasswordModal(true);
        // Asegurarse de limpiar campos del modal específicamente
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordChangeError(null);
        setPasswordChangeSuccess(null);
    };

    const closePasswordModal = () => {
        // Llama a resetForm que limpia todos los estados, incluido el modal
        resetForm();
    };

    const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetUserIdForPassword) return;

        setPasswordChangeError(null);
        setPasswordChangeSuccess(null);

        // Validación frontend simple
        if (newPassword.length < 8) {
             setPasswordChangeError("La contraseña debe tener al menos 8 caracteres.");
             return;
        }
        if (newPassword !== confirmNewPassword) {
            setPasswordChangeError("Las nuevas contraseñas no coinciden.");
            return;
        }

        setIsSubmittingPassword(true);
        try {
            // Llama a la función del servicio
            await changeUserPassword(targetUserIdForPassword, newPassword, confirmNewPassword);
            setPasswordChangeSuccess(`Contraseña actualizada para ${targetUserIdentifier}.`);
            // Limpiar campos tras éxito
            setNewPassword('');
            setConfirmNewPassword('');
            // Cerrar modal después de un breve retraso para mostrar el mensaje de éxito
            setTimeout(() => {
                closePasswordModal(); // Usa la función close que llama a resetForm
            }, 2000);

        } catch (err: any) {
            console.error("Error cambiando contraseña:", err.response?.data || err.message);
            const backendErrors = err.response?.data;
            let errorMsg = "Error al cambiar la contraseña.";
             // Formatear errores específicos del backend (ej. complejidad, coincidencia si el serializer lo valida)
            if (typeof backendErrors === 'object' && backendErrors !== null) {
                errorMsg = Object.entries(backendErrors)
                           .map(([key, value]) => `${key === 'new_password' ? 'Nueva Contraseña' : (key === 'confirm_password' ? 'Confirmación' : key)}: ${Array.isArray(value) ? value.join(', ') : value}`)
                           .join('; ');
                if (!errorMsg) errorMsg = "Error de validación del backend." // Fallback
            } else if (err.message) {
                 errorMsg = err.message;
            }
            setPasswordChangeError(errorMsg);
        } finally {
            setIsSubmittingPassword(false);
        }
    };
    // --- FIN Handlers Modal ---


    // --- Renderizado ---
    return (
        <div className={styles.gestionContainer}>
            <h3 className={styles.title}>Gestionar Usuarios</h3>

            {/* Botón Crear y Mensajes Generales */}
            <div className={styles.actionBar}>
                {!editingUser && !showPasswordModal && ( // Solo mostrar si no se está editando NI cambiando pass
                    <button onClick={() => { setShowForm(true); resetForm(); }} // Asegura limpiar al abrir form nuevo
                            className={`${styles.commonButton} ${styles.createButton}`}>
                        + Crear Nuevo Usuario
                    </button>
                )}
                {/* Mostrar éxito general si NINGÚN form/modal está activo */}
                {!showForm && !showPasswordModal && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
                {/* Mostrar error general si no hay errores específicos de form/modal */}
                {error && !formError && !passwordChangeError && <p className={styles.generalError}>{error}</p>}
            </div>

            {/* Formulario Crear/Editar (Principal) */}
            {showForm && (
                <form onSubmit={handleSubmit} className={styles.usuarioForm}>
                     <h4 className={styles.formTitle}>{editingUser ? `Editando Usuario: ${editingUser.cedula}` : 'Nuevo Usuario'}</h4>

                     {/* Campos Cédula, Password (solo crear), Nombre, Apellido, Email */}
                     <div className={styles.inputGroup}> <label htmlFor="user-cedula" className={styles.label}>Cédula:*</label> <input id="user-cedula" type="text" value={cedula} onChange={e => setCedula(e.target.value)} required className={styles.input} disabled={!!editingUser} /> {!editingUser && <small className={styles.labelSmall}>No se puede cambiar después.</small>} </div>
                     {!editingUser && (<> <div className={styles.inputGroup}> <label htmlFor="user-pass" className={styles.label}>Contraseña:*</label> <input id="user-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={styles.input} autoComplete="new-password" /> </div> <div className={styles.inputGroup}> <label htmlFor="user-pass2" className={styles.label}>Confirmar Contraseña:*</label> <input id="user-pass2" type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required className={styles.input} autoComplete="new-password" /> </div> </>)}
                     <div className={styles.inputGroup}> <label htmlFor="user-nombre" className={styles.label}>Nombre:</label> <input id="user-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} className={styles.input} /> </div>
                     <div className={styles.inputGroup}> <label htmlFor="user-apellido" className={styles.label}>Apellido:</label> <input id="user-apellido" type="text" value={apellido} onChange={e => setApellido(e.target.value)} className={styles.input} /> </div>
                     <div className={styles.inputGroup}> <label htmlFor="user-email" className={styles.label}>Email:</label> <input id="user-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} /> </div>
                     {/* Quitamos username si ya no es necesario */}
                     {/* <div className={styles.inputGroup}> <label htmlFor="user-username" className={styles.label}>Username:</label> <input id="user-username" type="text" value={username} onChange={e => setUsername(e.target.value)} className={styles.input} /> </div> */}

                     {/* Rol Dropdown */}
                     <div className={styles.inputGroup}>
                         <label htmlFor="user-rol" className={styles.label}>Rol:*</label>
                         <select id="user-rol" name="formRolId" value={formRolId} onChange={e => { const newRolId = e.target.value; setFormRolId(newRolId); if (roles.find(r => r.id === Number(newRolId))?.nombre !== 'cliente') setFormEmpresaId(''); if (roles.find(r => r.id === Number(newRolId))?.nombre !== 'conductor') setFormVehiculoId(''); }} required className={styles.select} disabled={loadingSelects}>
                             <option value="" disabled>-- Selecciona un rol --</option>
                             {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                         </select>
                     </div>

                     {/* Empresa (Condicional) */}
                     {roles.find(r => r.id === Number(formRolId))?.nombre === 'cliente' && (
                         <div className={styles.inputGroup}>
                             <label htmlFor="user-empresa" className={styles.label}>Empresa (para Cliente):*</label>
                             <select id="user-empresa" name="formEmpresaId" value={formEmpresaId || ''} onChange={e => setFormEmpresaId(e.target.value)} required className={styles.select} disabled={loadingSelects || empresas.length === 0}>
                                 <option value="" disabled>-- Selecciona empresa --</option>
                                 {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                             </select>
                             {/* ... indicadores de carga/vacío ... */}
                         </div>
                     )}

                     {/* Vehículo (Condicional) */}
                     {roles.find(r => r.id === Number(formRolId))?.nombre === 'conductor' && (
                         <div className={styles.inputGroup}>
                             <label htmlFor="user-vehiculo" className={styles.label}>Vehículo Asignado:</label>
                             <select id="user-vehiculo" name="formVehiculoId" value={formVehiculoId || ''} onChange={e => setFormVehiculoId(e.target.value)} className={styles.select} disabled={loadingSelects || vehiculos.length === 0}>
                                 <option value="">-- Sin Asignar --</option>
                                 {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.tipo?.nombre || 'Inválido'})</option> )}
                             </select>
                              {/* ... indicadores de carga/vacío ... */}
                         </div>
                     )}

                     {/* Activo Checkbox */}
                     <div className={styles.inputGroup}> <label className={styles.checkboxLabel}> <input type="checkbox" name="formIsActive" checked={formIsActive} onChange={e => setFormIsActive(e.target.checked)} className={styles.checkboxInput} /> Usuario Activo </label> </div>

                     {/* Mensajes y Botones del Form Principal */}
                     {formError && <p className={styles.formError}>{formError}</p>}
                     {/* No mostramos éxito aquí, se muestra fuera del form */}
                     <div className={styles.buttonGroup}>
                         <button type="submit" disabled={isSubmitting || loadingSelects} className={`${styles.commonButton} ${styles.submitButton}`}> {isSubmitting ? 'Guardando...' : (editingUser ? 'Actualizar Usuario' : 'Crear Usuario')} </button>
                         <button type="button" onClick={resetForm} className={`${styles.commonButton} ${styles.cancelButton}`}>Cancelar</button>
                     </div>
                </form>
            )}

            {/* --- Modal Cambiar Contraseña --- */}
            {showPasswordModal && targetUserIdForPassword && (
                 <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h4 className={styles.formTitle}>Cambiar Contraseña para: {targetUserIdentifier}</h4>
                        <form onSubmit={handlePasswordChangeSubmit}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="new-pass" className={styles.label}>Nueva Contraseña:*</label>
                                <input id="new-pass" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} className={styles.input} autoComplete="new-password" />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="confirm-new-pass" className={styles.label}>Confirmar Nueva Contraseña:*</label>
                                <input id="confirm-new-pass" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required minLength={8} className={styles.input} autoComplete="new-password" />
                            </div>

                            {/* Mensajes del modal */}
                            {passwordChangeError && <p className={styles.formError}>{passwordChangeError}</p>}
                            {passwordChangeSuccess && <p className={styles.formSuccess}>{passwordChangeSuccess}</p>}

                            {/* Botones del modal */}
                            <div className={styles.buttonGroup}>
                                <button type="submit" disabled={isSubmittingPassword} className={`${styles.commonButton} ${styles.submitButton}`}>
                                    {isSubmittingPassword ? 'Guardando...' : 'Guardar Contraseña'}
                                </button>
                                <button type="button" onClick={closePasswordModal} disabled={isSubmittingPassword} className={`${styles.commonButton} ${styles.cancelButton}`}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                 </div>
            )}
            {/* --- FIN Modal --- */}

            {/* --- Filtros --- */}
            <div className={styles.filterContainer}>
                <h4 className={styles.filterTitle}>Filtros</h4>
                {/* ... (contenido de filtros sin cambios) ... */}
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
                         <option value="true">Activos</option> <option value="false">Inactivos</option> <option value="all">Todos</option>
                     </select>
                 </div>
                 {/* Filtro Búsqueda */}
                 <div className={styles.filterGroup}>
                     <label htmlFor="searchTerm" className={styles.filterLabel}>Buscar:</label>
                     <input type="text" id="searchTerm" name="searchTerm" value={filtros.searchTerm} onChange={handleFiltroChange} placeholder="Cédula, Nombre, Email..." className={styles.filterInput} />
                 </div>
                 {loadingSelects && <div className={styles.loadingSmall}><small>Cargando filtros...</small></div>}
            </div>

            {/* --- Lista de Usuarios --- */}
            <h4 className={styles.listTitle}>Usuarios Registrados</h4>
            {/* Mensaje de éxito general (si no hay forms/modals abiertos) */}
            {!showForm && !showPasswordModal && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
            {/* Error general (si no hay errores específicos de form/modal) */}
            {error && !formError && !passwordChangeError && <p className={styles.generalError}>{error}</p>}

            {isLoading ? (<p>Cargando usuarios...</p>)
                : !error && usuarios.length === 0 ? (<p>No hay usuarios para mostrar con los filtros seleccionados.</p>)
                    : !error ? (
                        <div className={styles.listContainer}>
                            <table className={styles.usuarioTable}>
                                <thead>
                                    <tr>
                                        <th>Cédula</th><th>Nombre</th><th>Email</th><th>Rol</th>
                                        <th>Empresa</th>
                                        <th>Vehículo</th> {/* Columna Vehículo */}
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
                                            {/* --- Mostrar Vehículo Asignado --- */}
                                            <td>{user.vehiculo_asignado || '-'}</td> {/* Ajusta si el campo se llama diferente */}
                                            {/* ------------------------------- */}
                                            <td style={{ textAlign: 'center' }}>{user.is_active ? '✔️' : '❌'}</td>
                                            <td className={styles.actionsCell}>
                                                <button onClick={() => handleEditClick(user)} className={`${styles.listButton} ${styles.editButton}`} title="Editar Datos">✏️</button>
                                                {/* --- Botón Cambiar Contraseña --- */}
                                                <button
                                                    onClick={() => openPasswordModal(user.id, user.cedula || user.email || `ID ${user.id}`)}
                                                    className={`${styles.listButton} ${styles.passwordButton}`}
                                                    title="Cambiar Contraseña">
                                                    🔑
                                                </button>
                                                {/* --- FIN Botón --- */}
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