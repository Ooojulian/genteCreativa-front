// frontend/src/components/JefeEmpresa/GestionPedidos.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    getPedidosJefe, updatePedido, deletePedido,
    createPedidoJefe, getPedidoDetalle // Funciones de pedido Jefe/Admin
    // getConductores, getClientes, // Se mueven a usuarios
    // getInventarioPorEmpresaId // Se mueve a bodegaje
} from '../../services/transporte'; // <-- Funciones de Pedidos
import { getConductores, getClientes } from '../../services/usuarios'; // <-- Funciones de Usuarios
import { getInventarioPorEmpresaId } from '../../services/bodegaje'; // <-- Función de Inventario
// Importa las interfaces actualizadas desde tu archivo de tipos
// Asegúrate que todas estas interfaces estén definidas correctamente en types/pedido.ts
import {
    PedidoDetalleData, PedidoEnLista, UserDataCompleta, // Asume que UserData también está en types o se importa de otro lugar
    TipoServicio, TipoVehiculo, TipoTarifaPasajero, ItemARetirarInput, InventarioClienteItem, PedidoEstado, JefeNuevoPedidoDataCompleto
} from '../../types/pedido';
import PedidoDetalleCompleto from '../Shared/PedidoDetalleCompleto';
import styles from '../../styles/JefeEmpresa/GestionPedidos.module.css';

// Interfaz para actualizar (PATCH)
interface PedidoUpdateData {
    origen?: string;
    destino?: string;
    descripcion?: string;
    // cliente_id?: number; // Ya no permitimos cambiar cliente
    conductor_id?: number | null;
    estado?: PedidoEstado;
    hora_recogida_programada?: string | null; // Enviar null si se borra
    hora_entrega_programada?: string | null;  // Enviar null si se borra
    tipo_vehiculo_requerido?: string | null; // Enviar null si se borra
    // No se suelen actualizar campos específicos de tipo (pasajeros, bodega) vía PATCH genérico
}


// --- Funciones Helper ---
const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return '--';
    try { const date = new Date(isoString); return date.toLocaleString('es-CO'); }
    catch (e) { console.error("Error date format:", e); return isoString; }
};

const formatISODateForInput = (isoString: string | null | undefined): string => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
        console.error("Error formateando fecha para input:", isoString, e);
        return '';
    }
};
// --- Fin Funciones Helper ---


const GestionPedidos: React.FC = () => {
    // --- Estados Generales y de Lista/Detalle ---
    const [pedidos, setPedidos] = useState<PedidoEnLista[]>([]);
    const [conductores, setConductores] = useState<UserDataCompleta[]>([]);
    const [clientes, setClientes] = useState<UserDataCompleta[]>([]); // Necesita tener la 'empresa' anidada
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
    const [pedidoDetalle, setPedidoDetalle] = useState<PedidoDetalleData | null>(null);
    const [loadingDetalle, setLoadingDetalle] = useState<boolean>(false);
    const [errorDetalle, setErrorDetalle] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingPedidoORIGINAL, setEditingPedidoORIGINAL] = useState<PedidoDetalleData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // --- Estados del Formulario (Unificados Crear/Editar) ---
    const [formTipoServicio, setFormTipoServicio] = useState<TipoServicio>('SIMPLE');
    const [formOrigen, setFormOrigen] = useState('');
    const [formDestino, setFormDestino] = useState('');
    const [formDescripcion, setFormDescripcion] = useState('');
    const [formClienteId, setFormClienteId] = useState<number | string>('');
    const [formConductorId, setFormConductorId] = useState<number | string>('');
    const [formEstado, setFormEstado] = useState<PedidoEstado | string>('pendiente'); // Principalmente para editar
    const [formHoraRecogida, setFormHoraRecogida] = useState('');
    const [formHoraEntrega, setFormHoraEntrega] = useState('');
    const [formTipoVehiculo, setFormTipoVehiculo] = useState<TipoVehiculo | string>('');
    // Bodega
    const [formTiempoBodegaje, setFormTiempoBodegaje] = useState('');
    const [formDimensionesContenido, setFormDimensionesContenido] = useState('');
    // Pasajeros
    const [formNumeroPasajeros, setFormNumeroPasajeros] = useState<string>('');
    const [formTipoTarifaPasajero, setFormTipoTarifaPasajero] = useState<TipoTarifaPasajero | string>('');
    const [formDuracionEstimada, setFormDuracionEstimada] = useState<string>('');
    const [formDistanciaEstimada, setFormDistanciaEstimada] = useState<string>('');

    // Estados para Retiro Bodega (específico de Creación tipo SALIDA)
    const [inventarioClienteSeleccionado, setInventarioClienteSeleccionado] = useState<InventarioClienteItem[]>([]);
    const [loadingInventarioCliente, setLoadingInventarioCliente] = useState(false);
    const [errorInventarioCliente, setErrorInventarioCliente] = useState<string | null>(null);
    const [cantidadesARetirar, setCantidadesARetirar] = useState<Record<number, number>>({}); // { producto_id: cantidad }

    // --- Funciones Carga Datos ---
    const fetchPedidos = useCallback(async () => {
        setIsLoading(true); setError(null); setFormSuccess(null);
        try { const data = await getPedidosJefe(); setPedidos(data); }
        catch (err: any) { setError(err.message || "Error al cargar pedidos"); }
        finally { setIsLoading(false); }
    }, []);

    const fetchConductores = useCallback(async () => {
        try { const data = await getConductores(); setConductores(data); }
        catch (e) { console.error("Error fetching conductores", e); setError(prev => `${prev || ''} Error Conductores.`); }
    }, []);

    // Asegúrate que fetchClientes traiga la info de la empresa asociada a cada cliente
    const fetchClientes = useCallback(async () => {
         setIsLoading(true); // Indicar carga mientras se obtienen clientes también
         try {
             // Asume que getUsuarios({ rol: 'cliente' }) devuelve UserData[] incluyendo el objeto 'empresa'
             const data = await getClientes(); // getClientes probablemente llama a getUsuarios con filtro
             setClientes(data);
         } catch (e) { console.error("Error fetching clientes", e); setError(prev => `${prev || ''} Error Clientes.`); }
         finally { setIsLoading(false); } // Finaliza carga general aquí o ajusta
     }, []);

    useEffect(() => { fetchPedidos(); fetchConductores(); fetchClientes(); }, [fetchPedidos, fetchConductores, fetchClientes]);

    // Carga detalles de pedido seleccionado (sin cambios)
    useEffect(() => {
        if (selectedPedidoId === null || showEditForm) {
            if (!showEditForm) setPedidoDetalle(null);
            setErrorDetalle(null);
            return;
        }
        const fetchDetalle = async () => {
            setLoadingDetalle(true); setErrorDetalle(null); setPedidoDetalle(null);
            try { const data = await getPedidoDetalle(selectedPedidoId); setPedidoDetalle(data); }
            catch (err: any) { setErrorDetalle(`Error al cargar detalles.`); console.error(err); }
            finally { setLoadingDetalle(false); }
        };
        fetchDetalle();
    }, [selectedPedidoId, showEditForm]);


     // useEffect para cargar inventario del cliente SELECCIONADO (en CREACIÓN)
     useEffect(() => {
        // Solo si creando, tipo SALIDA y cliente seleccionado
        if (showCreateForm && formTipoServicio === 'BODEGAJE_SALIDA' && formClienteId) {
            const clienteIdNum = Number(formClienteId);
            const clienteSeleccionado = clientes.find(c => c.id === clienteIdNum);
            const empresaIdCliente = clienteSeleccionado?.empresa?.id;

            if (empresaIdCliente) {
                setLoadingInventarioCliente(true);
                setErrorInventarioCliente(null);
                setInventarioClienteSeleccionado([]);
                setCantidadesARetirar({});

                getInventarioPorEmpresaId(empresaIdCliente)
                    .then(data => {
                        const processedData: InventarioClienteItem[] = data
                            .map(item => ({
                                id: item.id,
                                producto_id: item.producto_id_read || 0,
                                producto_nombre: item.producto_nombre || 'N/A',
                                cantidad: item.cantidad,
                            }))
                            .filter(item => item.producto_id && item.cantidad > 0);

                        if (data.length > 0 && processedData.length === 0) {
                            console.warn("Inventario recibido pero producto_id falta o es 0.");
                            setErrorInventarioCliente("No se pudo procesar el inventario del cliente (falta ID producto).");
                        }
                        setInventarioClienteSeleccionado(processedData);
                    })
                    .catch(err => setErrorInventarioCliente("Error al cargar inventario del cliente."))
                    .finally(() => setLoadingInventarioCliente(false));
            } else {
                 setInventarioClienteSeleccionado([]);
                 setCantidadesARetirar({});
                 setErrorInventarioCliente(formClienteId ? "Cliente sin empresa asociada." : "Selecciona un cliente.");
            }
        } else {
             // Limpiar si no aplica
             if (inventarioClienteSeleccionado.length > 0 || errorInventarioCliente) {
                 setInventarioClienteSeleccionado([]);
                 setErrorInventarioCliente(null);
                 setCantidadesARetirar({});
             }
        }
    }, [showCreateForm, formTipoServicio, formClienteId, clientes]); // Depende de estos estados

    // --- Handlers ---
    const resetFormsAndSelection = () => {
        setSelectedPedidoId(null); setPedidoDetalle(null); setShowCreateForm(false);
        setShowEditForm(false); setEditingPedidoORIGINAL(null);
        // Resetear TODOS los campos del formulario
        setFormTipoServicio('SIMPLE'); setFormOrigen(''); setFormDestino('');
        setFormDescripcion(''); setFormClienteId(''); setFormConductorId('');
        setFormEstado('pendiente'); setFormHoraRecogida(''); setFormHoraEntrega('');
        setFormTipoVehiculo(''); setFormTiempoBodegaje(''); setFormDimensionesContenido('');
        setFormNumeroPasajeros(''); setFormTipoTarifaPasajero(''); setFormDuracionEstimada('');
        setFormDistanciaEstimada('');
        // Resetear estado de inventario
        setInventarioClienteSeleccionado([]); setCantidadesARetirar({});
        setLoadingInventarioCliente(false); setErrorInventarioCliente(null);
        // Resetear mensajes y submitting
        setFormError(null); setFormSuccess(null); setIsSubmitting(false);
     };

    const handleSelectPedido = (id: number) => {
         console.log(`[GestionPedidos] Seleccionado pedido ID: ${id}`);
         resetFormsAndSelection(); // Asegura que se limpien los formularios al seleccionar
         setSelectedPedidoId(id);
    };

    const handleEditClick = async (pedidoId: number) => {
        console.log(`[GestionPedidos] Click EDITAR en pedido ID: ${pedidoId}`);
        resetFormsAndSelection();
        setSelectedPedidoId(pedidoId); // Selecciona para mostrar mientras carga
        setLoadingDetalle(true); setErrorDetalle(null);

        try {
            const detalle = await getPedidoDetalle(pedidoId);
            // setPedidoDetalle(detalle); // No es necesario si solo se usa para el form
            setEditingPedidoORIGINAL(detalle); // Guarda el original para comparar

            // Rellena campos del form (usando helper para fechas)
            // setFormClienteId(detalle.cliente_id || ''); // NO, cliente no se edita
            setFormConductorId(detalle.conductor_id || '');
            setFormOrigen(detalle.origen || '');
            setFormDestino(detalle.destino || '');
            setFormDescripcion(detalle.descripcion || '');
            setFormEstado(detalle.estado);
            setFormHoraRecogida(formatISODateForInput(detalle.hora_recogida_programada));
            setFormHoraEntrega(formatISODateForInput(detalle.hora_entrega_programada));
            setFormTipoVehiculo(detalle.tipo_vehiculo_requerido || '');
            // Rellenar otros campos específicos si fueran editables (ej. descripción, estado)
            // Campos como numero_pasajeros, items_a_retirar, etc., usualmente NO se editan.

            setShowEditForm(true); // Muestra el form de edición
            window.scrollTo(0, 0); // Sube la vista

        } catch (err: any) {
             setErrorDetalle(`Error al preparar edición del pedido ${pedidoId}.`);
             console.error(`Error handleEditClick (${pedidoId}):`, err);
             resetFormsAndSelection(); // Limpia todo si falla
        } finally { setLoadingDetalle(false); }
    };

    const handleCreateClick = () => {
        if (showCreateForm) { resetFormsAndSelection(); }
        else { resetFormsAndSelection(); setShowCreateForm(true); window.scrollTo(0, 0); }
     };

    const handleDeleteClick = async (pedidoId: number) => {
        if (window.confirm(`¿Seguro eliminar Pedido ID: ${pedidoId}?`)) {
             setError(null); setFormSuccess(null); setIsLoading(true);
             try { await deletePedido(pedidoId); setFormSuccess(`Pedido ID: ${pedidoId} eliminado.`); fetchPedidos(); resetFormsAndSelection(); }
             catch (err: any) { setError(err.message || `Error eliminando Pedido ID: ${pedidoId}`); }
             finally { setIsLoading(false); }
         }
     };

     // Handler para cantidades a retirar (igual que en SolicitarEnvio)
     const handleCantidadRetirarChange = (producto_id: number, cantidadInput: string) => {
        const cantidad = parseInt(cantidadInput, 10);
        const nuevaCantidad = !isNaN(cantidad) && cantidad >= 0 ? cantidad : 0;
        const itemInventario = inventarioClienteSeleccionado.find(inv => inv.producto_id === producto_id);
        const maxCantidad = itemInventario ? itemInventario.cantidad : 0;
        setCantidadesARetirar(prev => ({
            ...prev,
            [producto_id]: Math.min(Math.max(0, nuevaCantidad), maxCantidad)
        }));
    };


    // handleEditSubmit (Simplificado para enviar siempre los campos editables)
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPedidoORIGINAL) {
            setFormError("Error interno: No hay datos originales para comparar."); return;
        }

        const id = editingPedidoORIGINAL.id;
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);

        // Prepara los datos directamente desde el estado del formulario actual
        const updateData: PedidoUpdateData = {
            // No incluimos cliente_id
            origen: formOrigen || undefined, // Envía undefined si está vacío
            destino: formDestino || undefined,
            descripcion: formDescripcion || undefined,
            conductor_id: formConductorId ? Number(formConductorId) : null, // null para desasignar
            estado: formEstado as PedidoEstado, // Asumimos que el estado es válido
            hora_recogida_programada: formHoraRecogida || null, // Envía null si se borra
            hora_entrega_programada: formHoraEntrega || null, // Envía null si se borra
            tipo_vehiculo_requerido: formTipoVehiculo || null, // Envía null si se borra
            // Otros campos NO específicos de tipo (como tiempo_bodegaje, num_pasajeros)
            // usualmente no se editan una vez creado el pedido, pero podrías añadirlos aquí si fuera necesario.
        };

        console.log(`[GestionPedidos] Enviando actualización (PATCH) para ID: ${id}`, updateData);

        try {
            const pedidoActualizado = await updatePedido(id, updateData);
            setFormSuccess(`Pedido ID: ${id} actualizado exitosamente.`);
            resetFormsAndSelection();
            fetchPedidos();
        } catch (err: any) {
            console.error("Error actualizando pedido:", err.response?.data || err.message);
            const backendErrors = err.response?.data;
            let errorMsg = err.message || "Error al actualizar el pedido.";
             if (typeof backendErrors === 'object' && backendErrors !== null) { errorMsg = Object.entries(backendErrors).map(([key, value])=>`${key}: ${Array.isArray(value)?value.join(','):value}`).join('; ')||"Error validación"; }
            setFormError(errorMsg);
        } finally { setIsSubmitting(false); }
    };


    // handleCreateSubmit (MODIFICADO para ser dinámico)
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); setFormSuccess(null); setIsSubmitting(true);

        // Validaciones comunes
        if (!formClienteId) { setFormError("Debe seleccionar un cliente."); setIsSubmitting(false); return; }
        if (!formTipoServicio) { setFormError("Debe seleccionar un tipo de servicio."); setIsSubmitting(false); return; }

        // Construir objeto base
        let dataToSend: Partial<JefeNuevoPedidoDataCompleto> = {
            tipo_servicio: formTipoServicio,
            cliente_id: Number(formClienteId),
            conductor_id: formConductorId ? Number(formConductorId) : null,
            descripcion: formDescripcion || undefined,
            hora_recogida_programada: formHoraRecogida || null,
            hora_entrega_programada: formHoraEntrega || null,
            tipo_vehiculo_requerido: formTipoVehiculo || null, // Puede ser null
        };

        let valid = true;
        let errors: string[] = [];

        // Validaciones y campos específicos por tipo
        switch (formTipoServicio) {
            case 'SIMPLE':
                if (!formOrigen) { valid = false; errors.push("Origen requerido."); }
                if (!formDestino) { valid = false; errors.push("Destino requerido."); }
                if (valid) { dataToSend = { ...dataToSend, origen: formOrigen, destino: formDestino, dimensiones_contenido: formDimensionesContenido || null }; }
                break;
            case 'BODEGAJE_ENTRADA':
                if (!formOrigen) { valid = false; errors.push("Origen requerido."); }
                if (!formTiempoBodegaje) { valid = false; errors.push("Tiempo de Bodegaje requerido."); }
                if (valid) { dataToSend = { ...dataToSend, origen: formOrigen, tiempo_bodegaje_estimado: formTiempoBodegaje, dimensiones_contenido: formDimensionesContenido || null }; }
                break;
            case 'BODEGAJE_SALIDA':
                if (!formDestino) { valid = false; errors.push("Destino requerido."); }
                const itemsParaEnviar = Object.entries(cantidadesARetirar)
                    .filter(([_, cantidad]) => cantidad > 0)
                    .map(([idStr, cantidad]) => ({ producto_id: Number(idStr), cantidad }));
                if (itemsParaEnviar.length === 0) { valid = false; errors.push("Debe seleccionar items a retirar."); }
                if (valid) { dataToSend = { ...dataToSend, destino: formDestino, items_a_retirar: itemsParaEnviar }; }
                break;
            case 'PASAJEROS':
                const numPas = parseInt(formNumeroPasajeros, 10);
                const dur = parseFloat(formDuracionEstimada);
                const dist = parseFloat(formDistanciaEstimada);
                if (!formOrigen) { valid = false; errors.push("Origen requerido."); }
                if (!formDestino) { valid = false; errors.push("Destino requerido."); }
                if (!formNumeroPasajeros || isNaN(numPas) || numPas <= 0) { valid = false; errors.push("No. Pasajeros inválido."); }
                if (!formTipoTarifaPasajero) { valid = false; errors.push("Tipo de tarifa requerido."); }
                if (formTipoTarifaPasajero === 'TIEMPO' && (!formDuracionEstimada || isNaN(dur) || dur <= 0)) { valid = false; errors.push("Duración inválida."); }
                if (formTipoTarifaPasajero === 'DISTANCIA' && (!formDistanciaEstimada || isNaN(dist) || dist <= 0)) { valid = false; errors.push("Distancia inválida."); }
                if (valid) { dataToSend = { ...dataToSend, origen: formOrigen, destino: formDestino, numero_pasajeros: numPas, tipo_tarifa_pasajero: formTipoTarifaPasajero as TipoTarifaPasajero, duracion_estimada_horas: dur || null, distancia_estimada_km: dist || null }; }
                break;
            case 'RENTA_VEHICULO':
                if (!formHoraRecogida) { valid = false; errors.push("Inicio renta requerido."); }
                if (!formHoraEntrega) { valid = false; errors.push("Fin renta requerido."); }
                if (!formTipoVehiculo) { valid = false; errors.push("Tipo vehículo requerido."); }
                if (formHoraRecogida && formHoraEntrega && new Date(formHoraRecogida) >= new Date(formHoraEntrega)) { valid = false; errors.push("Fecha fin debe ser posterior a inicio."); }
                break;
            default:
                valid = false; errors.push("Tipo de servicio inválido.");
        }

        if (!valid) {
            setFormError(errors.join(' '));
            setIsSubmitting(false);
            return;
        }

        // Llamada API
        try {
            console.log("[GestionPedidos] Enviando datos de CREACIÓN:", dataToSend);
            // Aseguramos que el tipo completo se envíe
            const nuevoPedido = await createPedidoJefe(dataToSend as JefeNuevoPedidoDataCompleto);
            setFormSuccess(`Pedido ID: ${nuevoPedido.id} (${formTipoServicio}) creado exitosamente.`);
            resetFormsAndSelection();
            fetchPedidos();
        } catch (err: any) {
            console.error("Error creando pedido:", err.response?.data || err.message);
            const backendErrors = err.response?.data;
            let errorMsg = err.message || "Error al crear el pedido.";
             if (typeof backendErrors === 'object' && backendErrors !== null) { errorMsg = Object.entries(backendErrors).map(([key, value])=>`${key}: ${Array.isArray(value)?value.join(','):value}`).join('; ')||"Error validación"; }
            setFormError(errorMsg);
        } finally { setIsSubmitting(false); }
    };


    // --- Renderizado ---
    return (
        <div className={styles.gestionContainer}>
            <h3 className={styles.title}>Gestionar Pedidos de Transporte</h3>
            <div className={styles.actionBar}>
                {/* Botón Crear/Cancelar */}
                <button onClick={handleCreateClick} className={`${styles.commonButton} ${showCreateForm ? styles.cancelButton : styles.createButton}`} disabled={showEditForm} >
                    {showCreateForm ? 'Cancelar Creación' : '+ Crear Nuevo Pedido'}
                </button>
                {/* Mensajes generales */}
                {!showCreateForm && !showEditForm && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
                {!showCreateForm && !showEditForm && error && <p className={styles.generalError}>{error}</p>}
            </div>

            {/* --- Formulario de CREACIÓN (Complejo) --- */}
            {showCreateForm && (
                 <form onSubmit={handleCreateSubmit} className={`${styles.pedidoForm} ${styles.createForm}`}>
                    <h4 className={styles.sectionTitle}>Nuevo Pedido</h4>

                    {/* Selector Tipo Servicio */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="create-tipo-servicio" className={styles.label}>Tipo de Servicio:*</label>
                        <select id="create-tipo-servicio" value={formTipoServicio} onChange={e => setFormTipoServicio(e.target.value as TipoServicio)} required className={styles.select}>
                            {/* Opciones desde el tipo TipoServicio */}
                            <option value="SIMPLE">Envío Simple (Mercancía)</option>
                            <option value="BODEGAJE_ENTRADA">Dejar Mercancía en Bodega</option>
                            <option value="BODEGAJE_SALIDA">Retirar Mercancía de Bodega</option>
                            <option value="PASAJEROS">Transporte de Pasajeros</option>
                            <option value="RENTA_VEHICULO">Renta Vehículo con Conductor</option>
                        </select>
                    </div>

                     {/* Cliente (Siempre requerido al crear por Jefe) */}
                     <div className={styles.inputGroup}>
                         <label htmlFor="create-cliente" className={styles.label}>Cliente:*</label>
                         <select id="create-cliente" value={formClienteId} onChange={e => setFormClienteId(e.target.value)} className={styles.select} required>
                             <option value="" disabled>-- Selecciona Cliente --</option>
                             {/* Asume que 'clientes' tiene { id, nombre, apellido, cedula, empresa: { id, nombre } } */}
                             {clientes.map(c => <option key={c.id} value={c.id}>{`${c.nombre || ''} ${c.apellido || ''} (${c.cedula}) ${c.empresa ? `- ${c.empresa.nombre}` : ''}`.trim()}</option>)}
                         </select>
                     </div>

                     {/* --- Renderizado Condicional de Campos --- */}

                    {/* Origen (Req: Simple, Entrada, Pasajeros) */}
                    {(formTipoServicio === 'SIMPLE' || formTipoServicio === 'BODEGAJE_ENTRADA' || formTipoServicio === 'PASAJEROS') && (
                         <div className={styles.inputGroup}> <label htmlFor="create-origen" className={styles.label}>Origen/Recogida:*</label> <input id="create-origen" type="text" value={formOrigen} onChange={e => setFormOrigen(e.target.value)} required className={styles.input} /> </div>
                    )}

                    {/* Destino (Req: Simple, Salida, Pasajeros) */}
                    {(formTipoServicio === 'SIMPLE' || formTipoServicio === 'BODEGAJE_SALIDA' || formTipoServicio === 'PASAJEROS') && (
                         <div className={styles.inputGroup}> <label htmlFor="create-destino" className={styles.label}>Destino/Entrega:*</label> <input id="create-destino" type="text" value={formDestino} onChange={e => setFormDestino(e.target.value)} required className={styles.input} /> </div>
                    )}

                    {/* Hora Recogida/Inicio (Req: Renta | Opc: Simple, Entrada, Pasajeros) */}
                    {(formTipoServicio !== 'BODEGAJE_SALIDA') && (
                         <div className={styles.inputGroup}>
                            <label htmlFor="create-hora-recogida" className={styles.label}>
                                {formTipoServicio === 'RENTA_VEHICULO' ? 'Fecha/Hora Inicio Renta:*' : 'Fecha/Hora Recogida:'}
                            </label>
                            <input id="create-hora-recogida" type="datetime-local" value={formHoraRecogida} onChange={e => setFormHoraRecogida(e.target.value)} className={styles.input} required={formTipoServicio === 'RENTA_VEHICULO'} />
                         </div>
                    )}

                    {/* Hora Entrega/Fin (Req: Renta, Salida | Opc: Simple, Pasajeros) */}
                     {(formTipoServicio !== 'BODEGAJE_ENTRADA') && (
                         <div className={styles.inputGroup}>
                            <label htmlFor="create-hora-entrega" className={styles.label}>
                                {formTipoServicio === 'RENTA_VEHICULO' ? 'Fecha/Hora Fin Renta:*' : (formTipoServicio === 'BODEGAJE_SALIDA' ? 'Fecha/Hora Entrega:*' : 'Fecha/Hora Entrega:')}
                            </label>
                             <input id="create-hora-entrega" type="datetime-local" value={formHoraEntrega} onChange={e => setFormHoraEntrega(e.target.value)} className={styles.input} required={formTipoServicio === 'RENTA_VEHICULO' || formTipoServicio === 'BODEGAJE_SALIDA'} />
                         </div>
                     )}

                     {/* Campos Bodega */}
                     {formTipoServicio === 'BODEGAJE_ENTRADA' && (
                         <div className={styles.inputGroup}> <label htmlFor="create-tiempo-bodegaje" className={styles.label}>Tiempo Bodegaje Estimado:*</label> <input id="create-tiempo-bodegaje" type="text" value={formTiempoBodegaje} onChange={e => setFormTiempoBodegaje(e.target.value)} required className={styles.input} placeholder="Ej: 3 meses"/> </div>
                     )}
                    {(formTipoServicio === 'SIMPLE' || formTipoServicio === 'BODEGAJE_ENTRADA') && (
                         <div className={styles.inputGroup}> <label htmlFor="create-dimensiones" className={styles.label}>Dimensiones/Tamaño:</label> <input id="create-dimensiones" type="text" value={formDimensionesContenido} onChange={e => setFormDimensionesContenido(e.target.value)} className={styles.input} placeholder="Ej: Pallet 120x80x100cm"/> </div>
                    )}

                    {/* Sección Retiro Bodega */}
                    {formTipoServicio === 'BODEGAJE_SALIDA' && (
                        <div className={styles.retiroSection}>
                             <h5 className={styles.subSectionTitle}>Seleccionar Productos a Retirar*</h5>
                             {loadingInventarioCliente && <p>Cargando inventario del cliente...</p>}
                             {errorInventarioCliente && <p className={styles.formError}>{errorInventarioCliente}</p>}
                             {!loadingInventarioCliente && !errorInventarioCliente && !formClienteId && <p className={styles.infoNota}>Selecciona un cliente para ver su inventario.</p> }
                             {!loadingInventarioCliente && !errorInventarioCliente && formClienteId && inventarioClienteSeleccionado.length === 0 && <p className={styles.infoNota}>El cliente seleccionado no tiene inventario en bodega.</p> }
                             {!loadingInventarioCliente && !errorInventarioCliente && formClienteId && inventarioClienteSeleccionado.length > 0 && (
                                 <div className={styles.tablaRetiroContainer}>
                                     <table className={styles.tablaRetiro}>
                                         <thead><tr><th>Producto</th><th>Disp.</th><th>Retirar*</th></tr></thead>
                                         <tbody>
                                             {inventarioClienteSeleccionado.map(item => (
                                                 <tr key={item.producto_id}>
                                                     <td>{item.producto_nombre}</td>
                                                     <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                                                     <td>
                                                         <input type="number" min="0" max={item.cantidad} value={cantidadesARetirar[item.producto_id] || 0} onChange={(e) => handleCantidadRetirarChange(item.producto_id, e.target.value)} className={styles.inputCantidadRetiro} disabled={item.cantidad === 0} placeholder="0"/>
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             )}
                         </div>
                    )}

                    {/* Sección Pasajeros */}
                    {formTipoServicio === 'PASAJEROS' && (
                         <>
                            <div className={styles.inputGroup}> <label htmlFor="create-num-pasajeros" className={styles.label}>Número de Pasajeros:*</label> <input id="create-num-pasajeros" type="number" min="1" step="1" value={formNumeroPasajeros} onChange={e => setFormNumeroPasajeros(e.target.value)} required className={styles.input} /> </div>
                            <div className={styles.inputGroup}> <label htmlFor="create-tipo-tarifa" className={styles.label}>Tipo de Tarifa:*</label> <select id="create-tipo-tarifa" value={formTipoTarifaPasajero} onChange={e => setFormTipoTarifaPasajero(e.target.value as TipoTarifaPasajero)} required className={styles.select}> <option value="" disabled>-- Seleccione --</option> <option value="TIEMPO">Por Tiempo</option> <option value="DISTANCIA">Por Distancia</option> </select> </div>
                            {formTipoTarifaPasajero === 'TIEMPO' && ( <div className={styles.inputGroup}> <label htmlFor="create-duracion" className={styles.label}>Duración Estimada (Horas):*</label> <input id="create-duracion" type="number" min="0.1" step="0.1" value={formDuracionEstimada} onChange={e => setFormDuracionEstimada(e.target.value)} required className={styles.input} placeholder="Ej: 2.5"/> </div> )}
                            {formTipoTarifaPasajero === 'DISTANCIA' && ( <div className={styles.inputGroup}> <label htmlFor="create-distancia" className={styles.label}>Distancia Estimada (Km):*</label> <input id="create-distancia" type="number" min="0.1" step="0.1" value={formDistanciaEstimada} onChange={e => setFormDistanciaEstimada(e.target.value)} required className={styles.input} placeholder="Ej: 15.3"/> </div> )}
                         </>
                     )}

                     {/* Selector Vehículo (Req para Renta, Opc para otros) */}
                     {(formTipoServicio !== 'BODEGAJE_SALIDA') && ( // No aplica a salida de bodega
                         <div className={styles.inputGroup}>
                             <label htmlFor="create-tipo-vehiculo" className={styles.label}>
                                 {formTipoServicio === 'RENTA_VEHICULO' ? 'Tipo Vehículo a Rentar:*' : 'Tipo Vehículo Recomendado:'}
                             </label>
                             <select id="create-tipo-vehiculo" value={formTipoVehiculo || ''} onChange={e => setFormTipoVehiculo(e.target.value)} className={styles.select} required={formTipoServicio === 'RENTA_VEHICULO'}>
                                 <option value="">-- {formTipoServicio === 'RENTA_VEHICULO' ? 'Seleccione Vehículo' : 'No especificar'} --</option>
                                 <option value="MOTO">Moto</option>
                                 <option value="PEQUENO">Pequeño (Automóvil)</option>
                                 <option value="MEDIANO">Mediano (Camioneta)</option>
                                 <option value="GRANDE">Grande (Furgón)</option>
                             </select>
                         </div>
                     )}


                    {/* Conductor (Siempre opcional al crear) */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="create-conductor" className={styles.label}>Asignar Conductor (Opcional):</label>
                        <select id="create-conductor" value={formConductorId || ''} onChange={e => setFormConductorId(e.target.value)} className={styles.select}>
                            <option value="">-- Sin Asignar --</option>
                            {conductores.map(c => <option key={c.id} value={c.id}>{`${c.nombre || ''} ${c.apellido || ''} (${c.cedula})`.trim()}</option>)}
                        </select>
                    </div>

                    {/* Descripción General (Req para Salida Bodega) */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="create-desc" className={styles.label}>
                            {formTipoServicio === 'BODEGAJE_SALIDA' ? 'Instrucciones Adicionales (Retiro Bodega):*' : 'Descripción / Notas Adicionales:'}
                        </label>
                        <textarea id="create-desc" value={formDescripcion} onChange={e => setFormDescripcion(e.target.value)} className={styles.textarea} rows={3} required={formTipoServicio === 'BODEGAJE_SALIDA'} />
                        {formTipoServicio === 'BODEGAJE_SALIDA' && <small className={styles.requiredHint}>Obligatorio para retiro de bodega.</small>}
                    </div>

                    {/* Errores y Botones */}
                    {formError && <p className={styles.formError}>{formError}</p>}
                    {formSuccess && <p className={styles.formSuccess}>{formSuccess}</p>}
                    <div className={styles.buttonGroup}>
                        <button type="submit" disabled={isSubmitting || (formTipoServicio === 'BODEGAJE_SALIDA' && loadingInventarioCliente)} className={`${styles.commonButton} ${styles.submitButton}`}>
                            {isSubmitting ? 'Creando Pedido...' : 'Crear Pedido'}
                        </button>
                        <button type="button" onClick={resetFormsAndSelection} className={`${styles.commonButton} ${styles.cancelButton}`}>
                            Cancelar
                        </button>
                    </div>
                </form>
            )}


            {/* --- Formulario de EDICIÓN (Sin cambios respecto a la versión anterior) --- */}
             {showEditForm && editingPedidoORIGINAL && (
                <form onSubmit={handleEditSubmit} className={`${styles.pedidoForm} ${styles.editForm}`}>
                     <h4 className={styles.sectionTitle}>Editando Pedido ID: {editingPedidoORIGINAL.id} (Tipo: {editingPedidoORIGINAL.tipo_servicio_display})</h4>
                     <div className={styles.inputGroup}> <label className={styles.label}>Cliente:</label> <p className={styles.infoText}>{editingPedidoORIGINAL.cliente || 'N/A'}</p> </div>
                     <div className={styles.inputGroup}> <label htmlFor="edit-origen" className={styles.label}>Origen:</label> <input id="edit-origen" type="text" value={formOrigen} onChange={e => setFormOrigen(e.target.value)} className={styles.input} disabled={editingPedidoORIGINAL.tipo_servicio==='BODEGAJE_SALIDA'} /> </div>
                     <div className={styles.inputGroup}> <label htmlFor="edit-destino" className={styles.label}>Destino:</label> <input id="edit-destino" type="text" value={formDestino} onChange={e => setFormDestino(e.target.value)} className={styles.input} disabled={editingPedidoORIGINAL.tipo_servicio==='BODEGAJE_ENTRADA'} /> </div>
                     <div className={styles.inputGroup}> <label htmlFor="edit-hora-recogida" className={styles.label}>Hora Recogida/Inicio:</label> <input id="edit-hora-recogida" type="datetime-local" value={formHoraRecogida} onChange={e => setFormHoraRecogida(e.target.value)} className={styles.input} /> </div>
                     <div className={styles.inputGroup}> <label htmlFor="edit-hora-entrega" className={styles.label}>Hora Entrega/Fin:</label> <input id="edit-hora-entrega" type="datetime-local" value={formHoraEntrega} onChange={e => setFormHoraEntrega(e.target.value)} className={styles.input} /> </div>
                     <div className={styles.inputGroup}> <label htmlFor="edit-desc" className={styles.label}>Descripción:</label> <textarea id="edit-desc" value={formDescripcion} onChange={e => setFormDescripcion(e.target.value)} className={styles.textarea} rows={2} /> </div>
                     <div className={styles.inputGroup}> <label htmlFor="edit-conductor" className={styles.label}>Conductor:</label> <select id="edit-conductor" value={formConductorId || ''} onChange={e => setFormConductorId(e.target.value)} className={styles.select}> <option value="">-- Sin Asignar --</option> {conductores.map(c => <option key={c.id} value={c.id}>{`${c.nombre || ''} ${c.apellido || ''} (${c.cedula})`.trim()}</option>)} </select> </div>
                     <div className={styles.inputGroup}> <label htmlFor="edit-tipo-vehiculo" className={styles.label}>Vehículo Req./Rentado:</label> <select id="edit-tipo-vehiculo" value={formTipoVehiculo || ''} onChange={e => setFormTipoVehiculo(e.target.value)} className={styles.select}> <option value="">-- No especificar/No aplica --</option> <option value="MOTO">Moto</option><option value="PEQUENO">Pequeño</option><option value="MEDIANO">Mediano</option><option value="GRANDE">Grande</option> </select> </div>
                     <div className={styles.inputGroup}> <label htmlFor="edit-estado" className={styles.label}>Estado:</label> <select id="edit-estado" value={formEstado} onChange={e => setFormEstado(e.target.value)} className={styles.select} required> <option value="pendiente">Pendiente</option> <option value="en_curso">En Curso</option> <option value="finalizado">Finalizado</option> <option value="cancelado">Cancelado</option> </select> </div>
                     {formError && <p className={styles.formError}>{formError}</p>}
                     {formSuccess && <p className={styles.formSuccess}>{formSuccess}</p>}
                     <div className={styles.buttonGroup}> <button type="submit" disabled={isSubmitting} className={`${styles.commonButton} ${styles.submitButton}`}> {isSubmitting ? 'Actualizando...' : 'Actualizar Pedido'} </button> <button type="button" onClick={resetFormsAndSelection} className={`${styles.commonButton} ${styles.cancelButton}`}> Cancelar </button> </div>
                </form>
             )}


            {/* --- Layout Dividido: Lista y Detalle (Sin cambios) --- */}
            <hr className={styles.divider} />
            <div className={styles.layout}>
                 {/* Columna Lista */}
                 <div className={styles.listaPedidos}>
                      <h4 className={styles.sectionTitle}>Pedidos Registrados</h4>
                      {isLoading ? (<p>Cargando...</p>)
                          : error ? (<p className={styles.generalError}>{error}</p>)
                          : pedidos.length === 0 ? (<p>No hay pedidos registrados.</p>)
                          : ( <div className={styles.listContainer}> <table className={styles.pedidoTable}>
                                  <thead><tr><th>ID</th><th>Cliente</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr></thead>
                                  <tbody> {pedidos.map(pedido => (
                                      <tr key={pedido.id} onClick={() => handleSelectPedido(pedido.id)} className={selectedPedidoId === pedido.id ? styles.seleccionado : ''}>
                                          <td style={{ textAlign: 'center' }}>{pedido.id}</td>
                                          <td>{pedido.cliente || '-'}</td> <td>{pedido.tipo_servicio_display || '-'}</td> <td>{pedido.estado_display || pedido.estado}</td>
                                          <td className={styles.actionsCell}>
                                              <button onClick={(e) => { e.stopPropagation(); handleEditClick(pedido.id); }} className={`${styles.listButton} ${styles.editButton}`} title="Editar">✏️</button>
                                              <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(pedido.id); }} className={`${styles.listButton} ${styles.deleteButton}`} title="Eliminar">🗑️</button>
                                          </td>
                                      </tr> ))}
                                  </tbody>
                              </table> </div>
                          ) }
                  </div>
                 {/* Columna Detalles */}
                 <div className={styles.detallePedido}>
                      {/* Contenido del detalle: Se muestra el componente o mensajes */}
                      {selectedPedidoId && loadingDetalle && <p>Cargando detalles del pedido #{selectedPedidoId}...</p>}
                      {selectedPedidoId && !loadingDetalle && errorDetalle && <p className={styles.generalError}>{errorDetalle}</p>}
                      {selectedPedidoId && !loadingDetalle && !errorDetalle && !pedidoDetalle && <p>No se pudieron cargar los detalles.</p> }
                      {!selectedPedidoId && !showCreateForm && !showEditForm && <div className={styles.noSeleccionado}>Selecciona un pedido de la lista o crea uno nuevo.</div> }
                      {/* Muestra el componente de detalle si hay datos cargados y no está el form de edición */}
                      {pedidoDetalle && !showEditForm && <PedidoDetalleCompleto pedido={pedidoDetalle} />}
                  </div>
             </div>
        </div>
    );
};

export default GestionPedidos;