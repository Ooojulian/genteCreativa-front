// frontend/src/components/JefeEmpresa/GestionUsuarios.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    getUsuarios, createUsuario, updateUsuario, deleteUsuario, getRoles,
    // --- Importar función para cambiar contraseña ---
    changeUserPassword // Asegúrate que esta función exista en services/usuarios.ts
} from '../../services/usuarios';
import { getEmpresas } from '../../services/empresas';
import { getVehiculos } from '../../services/transporte';
import styles from '../../styles/JefeEmpresa/GestionUsuarios.module.css';
// --- Tipos necesarios (Asegúrate que UserData ahora incluye vehiculo_asignado) ---
import { UserData, RolData, UsuarioInputData, VehiculoData, EmpresaData } from '../../types/pedido';

// --- Interfaces Locales (Si las usas) ---
interface LocalUserFilters {
    rolId: number | string;
    empresaId: number | string;
    searchTerm: string;
    isActive: boolean | string;
}
interface EmpresaDataOutput extends EmpresaData {} // Puedes quitarla si importas EmpresaData directamente

const GestionUsuarios: React.FC = () => {
    // --- Estados ---
    const [usuarios, setUsuarios] = useState<UserData[]>([]);
    const [roles, setRoles] = useState<RolData[]>([]);
    const [empresas, setEmpresas] = useState<EmpresaDataOutput[]>([]);
    const [vehiculos, setVehiculos] = useState<VehiculoData[]>([]); // Vehículos activos
    const [isLoading, setIsLoading] = useState(false); // Carga de lista usuarios
    const [loadingSelects, setLoadingSelects] = useState(false); // Carga de selects (roles, empresas, vehiculos)
    const [error, setError] = useState<string | null>(null); // Error general o de carga
    const [showForm, setShowForm] = useState(false); // Mostrar form crear/editar
    const [editingUser, setEditingUser] = useState<UserData | null>(null); // Datos del usuario en edición

    // Estados Formulario Principal (Crear/Editar)
    const [id, setId] = useState<number | null>(null);
    const [cedula, setCedula] = useState('');
    const [password, setPassword] = useState(''); // Solo para CREAR
    const [passwordConfirm, setPasswordConfirm] = useState(''); // Solo para CREAR
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState(''); // Mantener si aún lo usas
    const [formRolId, setFormRolId] = useState<number | string>('');
    const [formEmpresaId, setFormEmpresaId] = useState<number | string>('');
    const [formVehiculoId, setFormVehiculoId] = useState<number | string>('');
    const [formIsActive, setFormIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // Submit del form principal
    const [formError, setFormError] = useState<string | null>(null); // Error del form principal
    const [formSuccess, setFormSuccess] = useState<string | null>(null); // Éxito general (crear/editar/borrar)

    // Estados Filtros
    const [filtros, setFiltros] = useState<LocalUserFilters>({
        rolId: '', empresaId: '', searchTerm: '', isActive: 'true',
    });

    // Estados Modal Contraseña
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [targetUserIdForPassword, setTargetUserIdForPassword] = useState<number | null>(null);
    const [targetUserIdentifier, setTargetUserIdentifier] = useState<string>('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
    const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);

    // --- Handlers Filtros ---
    const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
        setFormSuccess(null); setError(null); // Limpia mensajes al cambiar filtros
    };

    // --- Funciones de Carga de Datos ---
    const fetchCommonData = useCallback(async () => {
        setLoadingSelects(true); setError(null);
        try {
            const [rolesData, empresasData, vehiculosData] = await Promise.all([
                getRoles(), getEmpresas(), getVehiculos()
            ]);
            setRoles(rolesData);
            setEmpresas(empresasData);
            setVehiculos(vehiculosData.filter(v => v.activo)); // Solo activos para asignar
        } catch (err: any) {
            console.error("Error cargando datos comunes:", err);
            setError("Error al cargar datos necesarios (roles/empresas/vehículos).");
        } finally { setLoadingSelects(false); }
    }, []);

    const fetchUsuarios = useCallback(async (currentFiltros: LocalUserFilters) => {
        setIsLoading(true); setError(null);
        const apiFilters: { [key: string]: any } = {};
        if (currentFiltros.rolId) apiFilters.rol = currentFiltros.rolId;
        if (currentFiltros.empresaId) apiFilters.empresa = currentFiltros.empresaId;
        if (currentFiltros.searchTerm.trim()) apiFilters.search = currentFiltros.searchTerm.trim();
        if (currentFiltros.isActive !== 'all') apiFilters.is_active = currentFiltros.isActive === 'true';

        try {
            const data = await getUsuarios(apiFilters);
            setUsuarios(data);
        } catch (err: any) {
            console.error("Error cargando usuarios:", err);
            setError(err.response?.data?.detail || err.message || "Error al cargar usuarios");
            setUsuarios([]);
        } finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchCommonData(); }, [fetchCommonData]);
    useEffect(() => { fetchUsuarios(filtros); }, [filtros, fetchUsuarios]);

    // --- Handlers Formularios y Acciones ---
    const resetForm = () => {
        // Reset form principal
        setEditingUser(null); setId(null);
        setCedula(''); setPassword(''); setPasswordConfirm(''); setNombre(''); setApellido('');
        setEmail(''); setUsername(''); setFormRolId(''); setFormEmpresaId('');
        setFormVehiculoId(''); setFormIsActive(true);
        setShowForm(false); setFormError(null); setFormSuccess(null); setIsSubmitting(false);
        // Reset modal contraseña
        setShowPasswordModal(false); setTargetUserIdForPassword(null); setTargetUserIdentifier('');
        setNewPassword(''); setConfirmNewPassword(''); setIsSubmittingPassword(false);
        setPasswordChangeError(null); setPasswordChangeSuccess(null);
    };

    const handleEditClick = (user: UserData) => {
        if (showForm && editingUser?.id === user.id) { resetForm(); return; }
        resetForm(); // Limpia todo antes de popular para edición
        setEditingUser(user);
        setId(user.id);
        setCedula(user.cedula);
        setNombre(user.nombre || '');
        setApellido(user.apellido || '');
        setEmail(user.email || '');
        setUsername(user.username || '');
        setFormRolId(user.rol?.id || '');
        setFormEmpresaId(user.empresa?.id || '');
        setFormIsActive(user.is_active ?? true);
        setFormVehiculoId(''); // Vehículo se selecciona, no se precarga
        setShowForm(true);
        window.scrollTo(0, 0);
    };

    const handleDeleteClick = async (userId: number, userIdentifier: string) => {
        if (window.confirm(`¿Eliminar usuario "${userIdentifier}"?`)) {
            setError(null); setFormSuccess(null);
            try {
                await deleteUsuario(userId);
                setFormSuccess(`Usuario "${userIdentifier}" eliminado.`);
                fetchUsuarios(filtros);
                resetForm();
            } catch (err: any) {
                setError(err.response?.data?.detail || err.message || `Error eliminando usuario`);
            }
        }
    };

    // Submit del formulario principal (Crear/Editar datos usuario)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);

        if (!editingUser && password !== passwordConfirm) { setFormError("Las contraseñas no coinciden."); setIsSubmitting(false); return; }
        if (!formRolId) { setFormError("Debes seleccionar un rol."); setIsSubmitting(false); return; }
        if (!cedula) { setFormError("La cédula es obligatoria."); setIsSubmitting(false); return; }

        const selectedRolObj = roles.find(r => r.id === Number(formRolId));
        let finalEmpresaId: number | null = null;
        let finalVehiculoId: number | null = null;

        if (selectedRolObj?.nombre === 'cliente') {
            if (!formEmpresaId) { setFormError("El rol 'cliente' requiere una empresa."); setIsSubmitting(false); return; }
            finalEmpresaId = Number(formEmpresaId);
        } else if (selectedRolObj?.nombre === 'conductor') {
            finalVehiculoId = formVehiculoId ? Number(formVehiculoId) : null;
        }

        try {
            let mensajeExito = '';
            if (editingUser && id) { // Actualizar
                const updateData: Partial<UsuarioInputData> = {
                    nombre: nombre || undefined, apellido: apellido || undefined,
                    email: email || undefined, username: username || undefined,
                    rol_id: Number(formRolId), empresa_id: finalEmpresaId,
                    vehiculo_asignado_id: finalVehiculoId, is_active: formIsActive,
                };
                const userActualizado = await updateUsuario(id, updateData);
                mensajeExito = `Usuario "${userActualizado.cedula}" actualizado.`;
            } else { // Crear
                if (!password) { setFormError("La contraseña es obligatoria al crear."); setIsSubmitting(false); return; }
                const createData: UsuarioInputData = {
                    cedula, password, nombre: nombre || undefined, apellido: apellido || undefined,
                    email: email || undefined, username: username || undefined,
                    rol_id: Number(formRolId), empresa_id: finalEmpresaId,
                    vehiculo_asignado_id: finalVehiculoId, is_active: formIsActive,
                };
                const nuevoUser = await createUsuario(createData);
                mensajeExito = `Usuario "${nuevoUser.cedula}" creado.`;
            }
            setFormSuccess(mensajeExito);
            resetForm();
            fetchUsuarios(filtros);
        } catch (err: any) {
            const backendErrors = err.response?.data;
            let errorMsg = "Error al guardar usuario.";
            if (typeof backendErrors === 'object' && backendErrors !== null) { errorMsg = Object.entries(backendErrors).map(([k, v])=>`${k}: ${Array.isArray(v)?v.join(','):v}`).join('; ')||"Error validación"; }
            else if (err.message) { errorMsg = err.message; }
            setFormError(errorMsg);
        } finally { setIsSubmitting(false); }
    };

    // --- Handlers Modal Contraseña ---
    const openPasswordModal = (userId: number, userIdentifier: string) => {
        resetForm();
        setTargetUserIdForPassword(userId);
        setTargetUserIdentifier(userIdentifier || `ID ${userId}`);
        setShowPasswordModal(true);
        setNewPassword(''); setConfirmNewPassword('');
        setPasswordChangeError(null); setPasswordChangeSuccess(null);
    };

    const closePasswordModal = () => {
        resetForm();
    };

    const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetUserIdForPassword) return;
        setPasswordChangeError(null); setPasswordChangeSuccess(null);

        if (newPassword.length < 8) { setPasswordChangeError("Contraseña muy corta (mínimo 8 caracteres)."); return; }
        if (newPassword !== confirmNewPassword) { setPasswordChangeError("Las nuevas contraseñas no coinciden."); return; }

        setIsSubmittingPassword(true);
        try {
            await changeUserPassword(targetUserIdForPassword, newPassword, confirmNewPassword);
            setPasswordChangeSuccess(`Contraseña actualizada para ${targetUserIdentifier}.`);
            setNewPassword(''); setConfirmNewPassword('');
            setTimeout(closePasswordModal, 2000);
        } catch (err: any) {
            const backendErrors = err.response?.data;
            let errorMsg = "Error cambiando contraseña.";
            if (typeof backendErrors === 'object' && backendErrors !== null) { errorMsg = Object.entries(backendErrors).map(([k, v])=>`${k}: ${Array.isArray(v)?v.join(','):v}`).join('; ')||"Error validación"; }
            else if (err.message) { errorMsg = err.message; }
            setPasswordChangeError(errorMsg);
        } finally { setIsSubmittingPassword(false); }
    };

    // --- Renderizado ---
    return (
        <div className={styles.gestionContainer}>
            <h3 className={styles.title}>Gestionar Usuarios</h3>

            {/* Botón Crear y Mensajes Generales */}
            <div className={styles.actionBar}>
                {!editingUser && !showPasswordModal && (
                    <button
                        onClick={() => {
                            resetForm();      // <--- CORRECCIÓN AQUÍ: Primero resetea
                            setShowForm(true); // <--- Luego muestra el form
                        }}
                        className={`${styles.commonButton} ${styles.createButton}`}
                    >
                        + Crear Nuevo Usuario
                    </button>
                )}
                {!showForm && !showPasswordModal && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
                {error && !formError && !passwordChangeError && <p className={styles.generalError}>{error}</p>}
            </div>

            {/* Formulario Crear/Editar (Principal) */}
            {showForm && (
                <form onSubmit={handleSubmit} className={styles.usuarioForm}>
                     <h4 className={styles.formTitle}>{editingUser ? `Editando Usuario: ${editingUser.cedula}` : 'Nuevo Usuario'}</h4>
                      {/* --- Campos Form Principal --- */}
                     <div className={styles.inputGroup}> <label htmlFor="user-cedula" className={styles.label}>Cédula:*</label> <input id="user-cedula" type="text" value={cedula} onChange={e => setCedula(e.target.value)} required className={styles.input} disabled={!!editingUser} /> {!editingUser && <small className={styles.labelSmall}>No se puede cambiar después.</small>} </div>
                     {!editingUser && (<> <div className={styles.inputGroup}> <label htmlFor="user-pass" className={styles.label}>Contraseña:*</label> <input id="user-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={styles.input} autoComplete="new-password" /> </div> <div className={styles.inputGroup}> <label htmlFor="user-pass2" className={styles.label}>Confirmar Contraseña:*</label> <input id="user-pass2" type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required className={styles.input} autoComplete="new-password" /> </div> </>)}
                     <div className={styles.inputGroup}> <label htmlFor="user-nombre" className={styles.label}>Nombre:</label> <input id="user-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} className={styles.input} /> </div>
                     <div className={styles.inputGroup}> <label htmlFor="user-apellido" className={styles.label}>Apellido:</label> <input id="user-apellido" type="text" value={apellido} onChange={e => setApellido(e.target.value)} className={styles.input} /> </div>
                     <div className={styles.inputGroup}> <label htmlFor="user-email" className={styles.label}>Email:</label> <input id="user-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} /> </div>
                     {/* Rol */}
                     <div className={styles.inputGroup}>
                         <label htmlFor="user-rol" className={styles.label}>Rol:*</label>
                         <select id="user-rol" name="formRolId" value={formRolId} onChange={e => { const newRolId = e.target.value; setFormRolId(newRolId); if (roles.find(r => r.id === Number(newRolId))?.nombre !== 'cliente') setFormEmpresaId(''); if (roles.find(r => r.id === Number(newRolId))?.nombre !== 'conductor') setFormVehiculoId(''); }} required className={styles.select} disabled={loadingSelects}>
                             <option value="" disabled>-- Selecciona Rol --</option> {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                         </select>
                     </div>
                     {/* Empresa (Condicional) */}
                     {roles.find(r => r.id === Number(formRolId))?.nombre === 'cliente' && ( <div className={styles.inputGroup}> <label htmlFor="user-empresa" className={styles.label}>Empresa (Cliente):*</label> <select id="user-empresa" name="formEmpresaId" value={formEmpresaId || ''} onChange={e => setFormEmpresaId(e.target.value)} required className={styles.select} disabled={loadingSelects || empresas.length === 0}> <option value="" disabled>-- Selecciona --</option> {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)} </select> {/* Indicadores */} </div> )}
                     {/* Vehículo (Condicional) */}
                     {roles.find(r => r.id === Number(formRolId))?.nombre === 'conductor' && ( <div className={styles.inputGroup}> <label htmlFor="user-vehiculo" className={styles.label}>Vehículo Asignado:</label> <select id="user-vehiculo" name="formVehiculoId" value={formVehiculoId || ''} onChange={e => setFormVehiculoId(e.target.value)} className={styles.select} disabled={loadingSelects || vehiculos.length === 0}> <option value="">-- Sin Asignar --</option> {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} ({v.tipo?.nombre || 'Inválido'})</option> )} </select> {/* Indicadores */} </div> )}
                     {/* Activo */}
                     <div className={styles.inputGroup}> <label className={styles.checkboxLabel}> <input type="checkbox" name="formIsActive" checked={formIsActive} onChange={e => setFormIsActive(e.target.checked)} className={styles.checkboxInput} /> Usuario Activo </label> </div>
                     {/* Mensajes y Botones Form Principal */}
                     {formError && <p className={styles.formError}>{formError}</p>}
                     <div className={styles.buttonGroup}> <button type="submit" disabled={isSubmitting || loadingSelects} className={`${styles.commonButton} ${styles.submitButton}`}> {isSubmitting ? 'Guardando...' : (editingUser ? 'Actualizar Usuario' : 'Crear Usuario')} </button> <button type="button" onClick={resetForm} className={`${styles.commonButton} ${styles.cancelButton}`}>Cancelar</button> </div>
                </form>
            )}

            {/* Modal Cambiar Contraseña */}
            {showPasswordModal && targetUserIdForPassword && (
                 <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h4 className={styles.formTitle}>Cambiar Contraseña para: {targetUserIdentifier}</h4>
                        <form onSubmit={handlePasswordChangeSubmit}>
                            <div className={styles.inputGroup}> <label htmlFor="new-pass" className={styles.label}>Nueva Contraseña:*</label> <input id="new-pass" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} className={styles.input} autoComplete="new-password"/> </div>
                            <div className={styles.inputGroup}> <label htmlFor="confirm-new-pass" className={styles.label}>Confirmar Contraseña:*</label> <input id="confirm-new-pass" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required minLength={8} className={styles.input} autoComplete="new-password"/> </div>
                            {passwordChangeError && <p className={styles.formError}>{passwordChangeError}</p>}
                            {passwordChangeSuccess && <p className={styles.formSuccess}>{passwordChangeSuccess}</p>}
                            <div className={styles.buttonGroup}> <button type="submit" disabled={isSubmittingPassword} className={`${styles.commonButton} ${styles.submitButton}`}> {isSubmittingPassword ? 'Guardando...' : 'Guardar Contraseña'} </button> <button type="button" onClick={closePasswordModal} disabled={isSubmittingPassword} className={`${styles.commonButton} ${styles.cancelButton}`}> Cancelar </button> </div>
                        </form>
                    </div>
                 </div>
            )}

            {/* Filtros */}
            <div className={styles.filterContainer}>
                <h4 className={styles.filterTitle}>Filtros</h4>
                 <div className={styles.filterGroup}> <label htmlFor="filtroRolId" className={styles.filterLabel}>Rol:</label> <select id="filtroRolId" name="rolId" value={filtros.rolId} onChange={handleFiltroChange} className={styles.filterSelect} disabled={loadingSelects || roles.length === 0}> <option value="">Todos</option> {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)} </select> </div>
                 <div className={styles.filterGroup}> <label htmlFor="filtroEmpresaId" className={styles.filterLabel}>Empresa:</label> <select id="filtroEmpresaId" name="empresaId" value={filtros.empresaId} onChange={handleFiltroChange} className={styles.filterSelect} disabled={loadingSelects || empresas.length === 0}> <option value="">Todas</option> {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)} </select> </div>
                 <div className={styles.filterGroup}> <label htmlFor="filtroIsActive" className={styles.filterLabel}>Estado:</label> <select id="filtroIsActive" name="isActive" value={String(filtros.isActive)} onChange={handleFiltroChange} className={styles.filterSelect}> <option value="true">Activos</option> <option value="false">Inactivos</option> <option value="all">Todos</option> </select> </div>
                 <div className={styles.filterGroup}> <label htmlFor="searchTerm" className={styles.filterLabel}>Buscar:</label> <input type="text" id="searchTerm" name="searchTerm" value={filtros.searchTerm} onChange={handleFiltroChange} placeholder="Cédula, Nombre..." className={styles.filterInput} /> </div>
                 {loadingSelects && <div className={styles.loadingSmall}><small>Cargando filtros...</small></div>}
            </div>

            {/* Lista de Usuarios */}
            <h4 className={styles.listTitle}>Usuarios Registrados</h4>
            {!showForm && !showPasswordModal && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
            {error && !formError && !passwordChangeError && <p className={styles.generalError}>{error}</p>}

            {isLoading ? (<p>Cargando usuarios...</p>)
                : !error && usuarios.length === 0 ? (<p>No hay usuarios para mostrar con los filtros seleccionados.</p>)
                    : !error ? (
                        <div className={styles.listContainer}>
                            <table className={styles.usuarioTable}>
                                <thead>
                                    <tr>
                                        <th>Cédula</th><th>Nombre</th><th>Email</th><th>Rol</th>
                                        <th>Empresa</th><th>Vehículo</th><th>Activo</th>
                                        <th className={styles.actionsCell}>Acciones</th>
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
                                            {/* Mostrar Vehículo Asignado (Asegúrate que la interfaz UserData tenga 'vehiculo_asignado') */}
                                            <td>{user.vehiculo_asignado || '-'}</td>
                                            <td style={{ textAlign: 'center' }}>{user.is_active ? '✔️' : '❌'}</td>
                                            <td className={styles.actionsCell}>
                                                <button onClick={() => handleEditClick(user)} className={`${styles.listButton} ${styles.editButton}`} title="Editar Datos">✏️</button>
                                                <button onClick={() => openPasswordModal(user.id, user.cedula || user.email || `ID ${user.id}`)} className={`${styles.listButton} ${styles.passwordButton}`} title="Cambiar Contraseña">🔑</button>
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