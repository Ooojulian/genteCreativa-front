// frontend/src/components/Cliente/SolicitarEnvio.tsx
import React, { useState, useEffect, useCallback } from 'react';
// --- CORRECCIÓN AQUÍ ---
import { createPedidoTransporteCliente } from '../../services/transporte'; // <-- APUNTA A transporte.ts
import { getInventarioEmpresa } from '../../services/bodegaje';      // <-- APUNTA A bodegaje.ts
// ---------------------
import styles from '../../styles/Cliente/SolicitarEnvio.module.css';
// --- Añade las importaciones de tipos si las usas directamente ---
import { ClienteToService, /* otros tipos como TipoServicio, etc. */ } from '../../types/pedido'; // Ajusta ruta
// ---------------------------------------------------------


// Item para enviar a la API (sin cambios)
interface ItemARetirarInput { producto_id: number; cantidad: number; }

// Tipos para Selects
type TipoVehiculo = 'MOTO' | 'PEQUENO' | 'MEDIANO' | 'GRANDE' | '';
// AÑADIDOS: PASAJEROS, RENTA_VEHICULO
type TipoServicio = 'SIMPLE' | 'BODEGAJE_ENTRADA' | 'BODEGAJE_SALIDA' | 'PASAJEROS' | 'RENTA_VEHICULO';
// NUEVO: Tipo de tarifa para pasajeros
type TipoTarifaPasajero = 'TIEMPO' | 'DISTANCIA' | '';

// Interfaz para los datos del pedido a enviar (actualizada)
interface NuevoPedidoClienteData {
    // Campos comunes (la mayoría opcionales)
    origen?: string | null;
    destino?: string | null;
    descripcion?: string;
    hora_recogida_programada?: string | null; // Usado también como inicio_renta
    hora_entrega_programada?: string | null;  // Usado también como fin_renta
    tipo_vehiculo_requerido?: string | null; // Usado también para renta
    tipo_servicio: TipoServicio;

    // Campos específicos Mercancía/Bodega
    tiempo_bodegaje_estimado?: string | null;
    dimensiones_contenido?: string | null;
    items_a_retirar?: ItemARetirarInput[] | null;

    // NUEVOS CAMPOS: Pasajeros
    numero_pasajeros?: number | null;
    tipo_tarifa_pasajero?: TipoTarifaPasajero | null;
    duracion_estimada_horas?: number | null;
    distancia_estimada_km?: number | null;

    // Nota: Renta usa campos existentes
}


const SolicitarEnvio: React.FC = () => {
    // --- Estados del Formulario (existentes + nuevos) ---
    const [tipoServicio, setTipoServicio] = useState<TipoServicio>('SIMPLE');
    const [origen, setOrigen] = useState('');
    const [destino, setDestino] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [horaRecogida, setHoraRecogida] = useState(''); // Inicio Renta
    const [horaEntrega, setHoraEntrega] = useState('');   // Fin Renta
    const [tipoVehiculo, setTipoVehiculo] = useState<TipoVehiculo>(''); // Vehículo Renta
    const [tiempoBodegaje, setTiempoBodegaje] = useState('');
    const [dimensionesContenido, setDimensionesContenido] = useState('');
    // Nuevos estados para Pasajeros
    const [numeroPasajeros, setNumeroPasajeros] = useState<string>(''); // Usar string para input
    const [tipoTarifaPasajero, setTipoTarifaPasajero] = useState<TipoTarifaPasajero>('');
    const [duracionEstimada, setDuracionEstimada] = useState<string>(''); // Usar string
    const [distanciaEstimada, setDistanciaEstimada] = useState<string>(''); // Usar string

    // Estados Retiro Bodega (sin cambios)
    const [inventarioDisponible, setInventarioDisponible] = useState<ClienteToService[]>([]);
    const [loadingInventario, setLoadingInventario] = useState(false);
    const [errorInventario, setErrorInventario] = useState<string | null>(null);
    const [cantidadesARetirar, setCantidadesARetirar] = useState<Record<number, number>>({});

    // Estados UI (sin cambios)
    const [submitting, setSubmitting] = useState(false);
    const [errorApi, setErrorApi] = useState<string | null>(null);
    const [successApi, setSuccessApi] = useState<string | null>(null);

    // --- Lógica ---
    const limpiarFormulario = useCallback(() => { // Usar useCallback si se pasa como dep a useEffect
        setOrigen(''); setDestino(''); setDescripcion(''); setHoraRecogida('');
        setHoraEntrega(''); setTipoVehiculo(''); setTiempoBodegaje('');
        setDimensionesContenido(''); setCantidadesARetirar({});
        // Limpiar nuevos estados
        setNumeroPasajeros(''); setTipoTarifaPasajero(''); setDuracionEstimada(''); setDistanciaEstimada('');
        setErrorApi(null); setSuccessApi(null);
        // No reseteamos tipoServicio aquí
    }, []); // Dependencias vacías si no usa nada externo

    // fetchInventarioCliente (sin cambios, solo se activa con BODEGAJE_SALIDA)
    const fetchInventarioCliente = useCallback(async () => {
        if (tipoServicio !== 'BODEGAJE_SALIDA') {
            setInventarioDisponible([]);
            return;
        }
        setLoadingInventario(true);
        setErrorInventario(null);
        setInventarioDisponible([]);
        try {
            const apiData = await getInventarioEmpresa();
            const processedData = apiData
                .map(item => {
                    const prodId = typeof item.producto_id_read === 'number' ? item.producto_id_read : null;
                    if (prodId === null) return null;
                    return {
                        id: item.id,
                        producto_nombre: item.producto_nombre || "N/A",
                        cantidad: item.cantidad,
                        producto_id: prodId
                    };
                })
                .filter((item): item is ClienteToService => item !== null && item.cantidad > 0);
            setInventarioDisponible(processedData);
        } catch (err: any) {
            setErrorInventario("No se pudo cargar tu inventario.");
        } finally {
            setLoadingInventario(false);
        }
    }, [tipoServicio]);

    useEffect(() => {
        fetchInventarioCliente();
    }, [fetchInventarioCliente]);

    const handleTipoServicioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nuevoTipo = e.target.value as TipoServicio;
        // Limpiar ANTES de cambiar el tipo para evitar condiciones raras
        limpiarFormulario();
        setTipoServicio(nuevoTipo);
        // Si el nuevo tipo es BODEGAJE_SALIDA, fetchInventario se ejecutará por el useEffect
    };

    // handleCantidadRetirarChange (sin cambios)
    const handleCantidadRetirarChange = (producto_id: number, cantidadInput: string) => {
        const cantidad = parseInt(cantidadInput, 10);
        const nuevaCantidad = !isNaN(cantidad) && cantidad >= 0 ? cantidad : 0;
        const itemInventario = inventarioDisponible.find(inv => inv.producto_id === producto_id);
        const maxCantidad = itemInventario ? itemInventario.cantidad : 0;
        setCantidadesARetirar(prev => ({
            ...prev,
            [producto_id]: Math.min(Math.max(0, nuevaCantidad), maxCantidad)
        }));
    };

    // --- SUBMIT ACTUALIZADO ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorApi(null); setSuccessApi(null); setSubmitting(true);

        // Usaremos Partial para ir añadiendo solo los campos necesarios
        let dataToSend: Partial<NuevoPedidoClienteData> = { tipo_servicio: tipoServicio };
        let valid = true;
        let errors: string[] = [];

        // --- Validaciones y Construcción de dataToSend por Tipo ---

        // --- TIPO: SIMPLE ---
        if (tipoServicio === 'SIMPLE') {
            if (!origen) { valid = false; errors.push("Origen es obligatorio."); }
            if (!destino) { valid = false; errors.push("Destino es obligatorio."); }
            if (!horaRecogida) { valid = false; errors.push("Hora de Recogida es obligatoria."); }
            if (valid) {
                dataToSend = {
                    ...dataToSend,
                    origen,
                    destino,
                    hora_recogida_programada: horaRecogida,
                    hora_entrega_programada: horaEntrega || null, // Opcional
                    descripcion: descripcion || undefined,
                    dimensiones_contenido: dimensionesContenido || null,
                    tipo_vehiculo_requerido: tipoVehiculo || null,
                };
            }
        }
        // --- TIPO: BODEGAJE_ENTRADA ---
        else if (tipoServicio === 'BODEGAJE_ENTRADA') {
            if (!origen) { valid = false; errors.push("Origen es obligatorio."); }
            if (!horaRecogida) { valid = false; errors.push("Hora de Recogida es obligatoria."); }
            if (!tiempoBodegaje) { valid = false; errors.push("Tiempo de Bodegaje Estimado es obligatorio."); }
            if (valid) {
                 dataToSend = {
                    ...dataToSend,
                    origen,
                    hora_recogida_programada: horaRecogida,
                    tiempo_bodegaje_estimado: tiempoBodegaje,
                    descripcion: descripcion || undefined,
                    dimensiones_contenido: dimensionesContenido || null,
                    tipo_vehiculo_requerido: tipoVehiculo || null,
                };
            }
        }
        // --- TIPO: BODEGAJE_SALIDA ---
        else if (tipoServicio === 'BODEGAJE_SALIDA') {
            if (!destino) { valid = false; errors.push("Destino es obligatorio."); }
            // Backend lo tiene opcional, ¿debería ser req aquí? Depende de tu lógica. Pondremos req por ahora.
            if (!horaEntrega) { valid = false; errors.push("Hora de Entrega es obligatoria."); }
            if (!descripcion) { valid = false; errors.push("Instrucciones Adicionales son obligatorias."); } // Hacer descripción obligatoria

            const itemsParaEnviar = Object.entries(cantidadesARetirar)
                .filter(([_, cantidad]) => cantidad > 0)
                .map(([idStr, cantidad]) => ({ producto_id: Number(idStr), cantidad }));

            if (itemsParaEnviar.length === 0) { valid = false; errors.push("Debe seleccionar al menos un producto y cantidad a retirar."); }
            else {
                 for (const item of itemsParaEnviar) { // Re-validación stock
                      const itemInv = inventarioDisponible.find(inv => inv.producto_id === item.producto_id);
                      if (!itemInv || item.cantidad > itemInv.cantidad) {
                          valid = false;
                          errors.push(`Stock insuficiente re-validando prod ID ${item.producto_id}.`);
                          break; // Salir al primer error de stock
                      }
                  }
             }

             if (valid) {
                dataToSend = {
                    ...dataToSend,
                    destino,
                    hora_entrega_programada: horaEntrega,
                    descripcion: descripcion, // Ahora obligatorio
                    items_a_retirar: itemsParaEnviar,
                    tipo_vehiculo_requerido: tipoVehiculo || null,
                 };
             }
        }
        // --- TIPO: PASAJEROS ---
        else if (tipoServicio === 'PASAJEROS') {
            const numPasajerosInt = parseInt(numeroPasajeros, 10);
            const duracionFloat = parseFloat(duracionEstimada);
            const distanciaFloat = parseFloat(distanciaEstimada);

            if (!origen) { valid = false; errors.push("Origen es obligatorio."); }
            if (!destino) { valid = false; errors.push("Destino es obligatorio."); }
            if (!horaRecogida) { valid = false; errors.push("Hora de Recogida/Inicio es obligatoria."); }
            if (!numeroPasajeros || isNaN(numPasajerosInt) || numPasajerosInt <= 0) { valid = false; errors.push("Número de pasajeros inválido."); }
            if (!tipoTarifaPasajero) { valid = false; errors.push("Debe seleccionar un tipo de tarifa."); }
            if (tipoTarifaPasajero === 'TIEMPO' && (!duracionEstimada || isNaN(duracionFloat) || duracionFloat <= 0)) { valid = false; errors.push("Duración estimada inválida para tarifa por tiempo."); }
            if (tipoTarifaPasajero === 'DISTANCIA' && (!distanciaEstimada || isNaN(distanciaFloat) || distanciaFloat <= 0)) { valid = false; errors.push("Distancia estimada inválida para tarifa por distancia."); }

             if (valid) {
                 dataToSend = {
                    ...dataToSend,
                    origen,
                    destino,
                    hora_recogida_programada: horaRecogida,
                    // hora_entrega_programada es opcional para pasajeros? Depende de tu lógica.
                    hora_entrega_programada: horaEntrega || null,
                    descripcion: descripcion || undefined,
                    numero_pasajeros: numPasajerosInt,
                    tipo_tarifa_pasajero: tipoTarifaPasajero,
                    duracion_estimada_horas: (tipoTarifaPasajero === 'TIEMPO') ? duracionFloat : null,
                    distancia_estimada_km: (tipoTarifaPasajero === 'DISTANCIA') ? distanciaFloat : null,
                    tipo_vehiculo_requerido: tipoVehiculo || null, // Vehículo recomendado
                 };
             }
        }
        // --- TIPO: RENTA_VEHICULO ---
        else if (tipoServicio === 'RENTA_VEHICULO') {
            if (!horaRecogida) { valid = false; errors.push("Fecha/Hora de Inicio Renta es obligatoria."); }
            if (!horaEntrega) { valid = false; errors.push("Fecha/Hora de Fin Renta es obligatoria."); }
            if (!tipoVehiculo) { valid = false; errors.push("Debe seleccionar el tipo de vehículo a rentar."); }
            // Comparar fechas
            if (horaRecogida && horaEntrega && new Date(horaRecogida) >= new Date(horaEntrega)) {
                 valid = false; errors.push("La fecha/hora de fin debe ser posterior a la de inicio.");
            }

            if (valid) {
                dataToSend = {
                    ...dataToSend,
                    hora_recogida_programada: horaRecogida, // Inicio Renta
                    hora_entrega_programada: horaEntrega,   // Fin Renta
                    tipo_vehiculo_requerido: tipoVehiculo,  // Vehículo Rentado
                    descripcion: descripcion || undefined,       // Notas adicionales
                 };
            }
        }
        // --- FIN Validaciones por Tipo ---


        if (!valid) {
            setErrorApi(errors.join(' '));
            setSubmitting(false);
            return;
        }

        // --- Llamada a la API ---
        try {
            console.log("[SolicitarEnvio] Enviando datos:", dataToSend); // Log para depurar
            // Aseguramos que el tipo es el correcto para la función API
            const pedidoCreado = await createPedidoTransporteCliente(dataToSend as Required<NuevoPedidoClienteData>);
            setSuccessApi(`¡Pedido #${pedidoCreado.id} creado exitosamente! Tipo: ${tipoServicio}, Estado: ${pedidoCreado.estado}`);
            // Limpiar formulario después del éxito (excepto tipoServicio)
            limpiarFormulario();

        } catch (err: any) {
            console.error("Error API al crear pedido:", err.response?.data || err.message || err);
            const backendError = err.response?.data;
            let errorMsg = "Error desconocido al crear el pedido.";
            if (backendError) {
                if (backendError.detail) {
                    errorMsg = backendError.detail;
                } else if (typeof backendError === 'object') {
                    // Formatear errores de validación del serializer
                    errorMsg = Object.entries(backendError)
                               .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                               .join('; ');
                    if (!errorMsg) errorMsg = "Error de validación en el servidor."; // Fallback
                }
            } else if (err.message) {
                errorMsg = err.message;
            }
            setErrorApi(errorMsg);
         } finally {
            setSubmitting(false);
         }
    }; // Fin handleSubmit

    // --- Renderizado ---
    return (
        <div className={styles.solicitarFormContainer}>
            <h3>Solicitar Nuevo Servicio</h3>
            <form onSubmit={handleSubmit} className={styles.solicitarForm}>

                {/* === Selector Tipo Servicio (Añadidas nuevas opciones) === */}
                <div className={styles.inputGroup}>
                    <label htmlFor="tipoServicio" className={styles.label}>Tipo de Servicio Requerido:*</label>
                    <select id="tipoServicio" value={tipoServicio} onChange={handleTipoServicioChange} required className={styles.select}>
                        <option value="SIMPLE">Envío Simple (Mercancía)</option>
                        <option value="BODEGAJE_ENTRADA">Dejar Mercancía en Bodega</option>
                        <option value="BODEGAJE_SALIDA">Retirar Mercancía de Bodega</option>
                        <option value="PASAJEROS">Transporte de Pasajeros</option>
                        <option value="RENTA_VEHICULO">Renta Vehículo con Conductor</option>
                    </select>
                </div>
                <hr className={styles.separator}/>

                {/* === Secciones Condicionales === */}

                {/* --- Sección Recogida (SIMPLE / ENTRADA / PASAJEROS) --- */}
                 {(tipoServicio === 'SIMPLE' || tipoServicio === 'BODEGAJE_ENTRADA' || tipoServicio === 'PASAJEROS') && (
                    <>
                        <h4>Detalles de Origen / Recogida</h4>
                        <div className={styles.inputGroup}>
                            <label htmlFor="origen" className={styles.label}>Dirección de Origen/Recogida:*</label>
                            <input type="text" id="origen" value={origen} onChange={(e) => setOrigen(e.target.value)} required className={styles.input} />
                        </div>
                    </>
                 )}
                 {/* Hora Inicio/Recogida (SIMPLE / ENTRADA / PASAJEROS / RENTA) */}
                 {(tipoServicio === 'SIMPLE' || tipoServicio === 'BODEGAJE_ENTRADA' || tipoServicio === 'PASAJEROS' || tipoServicio === 'RENTA_VEHICULO') && (
                    <div className={styles.inputGroup}>
                           <label htmlFor="horaRecogida" className={styles.label}>
                               {tipoServicio === 'RENTA_VEHICULO' ? 'Fecha/Hora Inicio Renta:*' : 'Fecha/Hora Programada Recogida:*'}
                           </label>
                           <input type="datetime-local" id="horaRecogida" value={horaRecogida} onChange={(e) => setHoraRecogida(e.target.value)} required className={styles.input} />
                    </div>
                 )}
                 {/* Separador si aplica */}
                 {(tipoServicio === 'SIMPLE' || tipoServicio === 'BODEGAJE_ENTRADA' || tipoServicio === 'PASAJEROS') && <hr className={styles.separator}/>}


                 {/* --- Sección Entrega (SIMPLE / SALIDA / PASAJEROS) --- */}
                 {(tipoServicio === 'SIMPLE' || tipoServicio === 'BODEGAJE_SALIDA' || tipoServicio === 'PASAJEROS') && (
                    <>
                        <h4>Detalles de Destino / Entrega</h4>
                        <div className={styles.inputGroup}>
                            <label htmlFor="destino" className={styles.label}>Dirección de Destino/Entrega:*</label>
                            <input type="text" id="destino" value={destino} onChange={(e) => setDestino(e.target.value)} required className={styles.input} />
                        </div>
                    </>
                 )}
                 {/* Hora Fin/Entrega (SIMPLE / SALIDA / PASAJEROS(Opcional) / RENTA) */}
                 {(tipoServicio === 'SIMPLE' || tipoServicio === 'BODEGAJE_SALIDA' || tipoServicio === 'PASAJEROS' || tipoServicio === 'RENTA_VEHICULO') && (
                    <div className={styles.inputGroup}>
                            <label htmlFor="horaEntrega" className={styles.label}>
                                {tipoServicio === 'RENTA_VEHICULO' ? 'Fecha/Hora Fin Renta:*' :
                                (tipoServicio === 'BODEGAJE_SALIDA' ? 'Fecha/Hora Programada Entrega:*' :
                                'Fecha/Hora Programada Entrega (Opcional):')}
                            </label>
                            <input type="datetime-local" id="horaEntrega" value={horaEntrega} onChange={(e) => setHoraEntrega(e.target.value)}
                                   required={tipoServicio === 'RENTA_VEHICULO' || tipoServicio === 'BODEGAJE_SALIDA'} // Requerido para Renta y Salida Bodega
                                   className={styles.input} />
                    </div>
                 )}
                 {/* Separador si aplica */}
                 {(tipoServicio === 'SIMPLE' || tipoServicio === 'BODEGAJE_SALIDA' || tipoServicio === 'PASAJEROS' || tipoServicio === 'RENTA_VEHICULO') && <hr className={styles.separator}/>}


                {/* --- Sección Bodegaje (ENTRADA) --- */}
                {tipoServicio === 'BODEGAJE_ENTRADA' && (
                    <>
                        <h4>Detalles de Bodegaje</h4>
                        <div className={styles.inputGroup}>
                            <label htmlFor="tiempoBodegaje" className={styles.label}>Tiempo Estimado en Bodega:*</label>
                            <input type="text" id="tiempoBodegaje" value={tiempoBodegaje} onChange={(e) => setTiempoBodegaje(e.target.value)} required className={styles.input} placeholder="Ej: 1 mes, Indefinido" />
                        </div>
                        {/* Dimensiones Contenido (Solo ENTRADA / SIMPLE) */}
                        <div className={styles.inputGroup}>
                           <label htmlFor="dimensionesContenido" className={styles.label}>Dimensiones/Tamaño Total Contenido (Opcional):</label>
                           <input type="text" id="dimensionesContenido" value={dimensionesContenido} onChange={(e) => setDimensionesContenido(e.target.value)} className={styles.input} placeholder="Ej: Caja 50x30x20cm" />
                        </div>
                         <hr className={styles.separator}/>
                    </>
                )}

                {/* --- Sección Retirar de Bodega (SALIDA) --- */}
                 {tipoServicio === 'BODEGAJE_SALIDA' && (
                     <div className={styles.retiroSection}>
                         <h4>Seleccionar Productos a Retirar*</h4>
                         {loadingInventario && <p>Cargando inventario...</p>}
                         {errorInventario && <p className={styles.formError}>{errorInventario}</p>}
                         {!loadingInventario && !errorInventario && (
                             inventarioDisponible.length === 0
                                 ? <p>No tienes inventario disponible en bodega.</p>
                                 : <div className={styles.tablaRetiroContainer}>
                                     <table className={styles.tablaRetiro}>
                                         {/* ... thead (igual) ... */}
                                         <thead>
                                            <tr><th>Producto</th><th>Ubicación</th><th>Disp.</th><th>Retirar*</th></tr>
                                        </thead>
                                         <tbody>
                                             {/* ... tbody .map (igual) ... */}
                                             {inventarioDisponible.map(item => (
                                                 <tr key={item.producto_id}>
                                                     <td>{item.producto_nombre}</td>
                                                     <td>{item.ubicacion_nombre}</td>
                                                     <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                                                     <td>
                                                         <input
                                                            type="number" min="0" max={item.cantidad}
                                                            value={cantidadesARetirar[item.producto_id] || 0}
                                                            onChange={(e) => handleCantidadRetirarChange(item.producto_id, e.target.value)}
                                                            className={styles.inputCantidadRetiro}
                                                            disabled={item.cantidad === 0} placeholder="0"
                                                         />
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                         )}
                          <hr className={styles.separator}/>
                     </div>
                 )}


                 {/* --- NUEVA SECCIÓN: PASAJEROS --- */}
                 {tipoServicio === 'PASAJEROS' && (
                    <>
                        <h4>Detalles del Viaje de Pasajeros</h4>
                        <div className={styles.inputGroup}>
                            <label htmlFor="numeroPasajeros" className={styles.label}>Número de Pasajeros:*</label>
                            <input type="number" id="numeroPasajeros" min="1" step="1" value={numeroPasajeros} onChange={(e) => setNumeroPasajeros(e.target.value)} required className={styles.input} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="tipoTarifaPasajero" className={styles.label}>Tipo de Tarifa:*</label>
                            <select id="tipoTarifaPasajero" value={tipoTarifaPasajero} onChange={(e) => setTipoTarifaPasajero(e.target.value as TipoTarifaPasajero)} required className={styles.select}>
                                <option value="">-- Seleccione --</option>
                                <option value="TIEMPO">Por Tiempo</option>
                                <option value="DISTANCIA">Por Distancia</option>
                                {/* <option value="FIJA">Tarifa Fija</option> */}
                            </select>
                        </div>
                        {/* Campos condicionales por tarifa */}
                        {tipoTarifaPasajero === 'TIEMPO' && (
                             <div className={styles.inputGroup}>
                                <label htmlFor="duracionEstimada" className={styles.label}>Duración Estimada (Horas):*</label>
                                <input type="number" id="duracionEstimada" min="0.1" step="0.1" value={duracionEstimada} onChange={(e) => setDuracionEstimada(e.target.value)} required className={styles.input} placeholder="Ej: 2.5"/>
                            </div>
                        )}
                        {tipoTarifaPasajero === 'DISTANCIA' && (
                             <div className={styles.inputGroup}>
                                <label htmlFor="distanciaEstimada" className={styles.label}>Distancia Estimada (Km):*</label>
                                <input type="number" id="distanciaEstimada" min="0.1" step="0.1" value={distanciaEstimada} onChange={(e) => setDistanciaEstimada(e.target.value)} required className={styles.input} placeholder="Ej: 15.3"/>
                            </div>
                        )}
                        <hr className={styles.separator}/>
                    </>
                 )}

                 {/* --- NUEVA SECCIÓN: RENTA VEHÍCULO --- */}
                 {tipoServicio === 'RENTA_VEHICULO' && (
                     <>
                         <h4>Detalles de la Renta</h4>
                         {/* Fechas de Inicio/Fin ya están arriba */}
                         <div className={styles.inputGroup}>
                            <label htmlFor="tipoVehiculoRenta" className={styles.label}>Tipo de Vehículo a Rentar:*</label>
                            {/* Reutilizamos el estado tipoVehiculo pero con un id diferente por si acaso */}
                            <select id="tipoVehiculoRenta" value={tipoVehiculo} onChange={(e) => setTipoVehiculo(e.target.value as TipoVehiculo)} required className={styles.select}>
                                <option value="">-- Seleccione Vehículo --</option>
                                <option value="MOTO">Moto</option>
                                <option value="PEQUENO">Pequeño (Automóvil)</option>
                                <option value="MEDIANO">Mediano (Camioneta)</option>
                                <option value="GRANDE">Grande (Furgón)</option>
                            </select>
                        </div>
                        <hr className={styles.separator}/>
                     </>
                 )}


                 {/* --- Campos Comunes Finales (Descripción y Vehículo Opcional) --- */}
                 <h4>Detalles Adicionales</h4>
                  <div className={styles.inputGroup}>
                      <label htmlFor="descripcion" className={styles.label}>
                          {/* Ajusta etiqueta si es necesario */}
                          {tipoServicio === 'BODEGAJE_SALIDA' ? 'Instrucciones Adicionales (Retiro Bodega):*' :
                          (tipoServicio === 'RENTA_VEHICULO' ? 'Notas/Requisitos Renta (Opcional):' :
                          (tipoServicio === 'PASAJEROS' ? 'Notas Adicionales Pasajeros (Opcional):' :
                          'Descripción Contenido (Opcional):'))}
                      </label>
                      <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className={styles.textarea}
                                required={tipoServicio === 'BODEGAJE_SALIDA'} // Solo obligatorio para retiro bodega
                      />
                  </div>
                  {/* Mostrar selector de vehículo opcional solo si NO es RENTA (donde ya es obligatorio) */}
                  {tipoServicio !== 'RENTA_VEHICULO' && tipoServicio !== 'BODEGAJE_SALIDA' && ( // Ocultar también para Salida Bodega?
                      <div className={styles.inputGroup}>
                        <label htmlFor="tipoVehiculo" className={styles.label}>Tipo Vehículo Recomendado (Opcional):</label>
                        <select id="tipoVehiculo" value={tipoVehiculo} onChange={(e) => setTipoVehiculo(e.target.value as TipoVehiculo)} className={styles.select}>
                            <option value="">-- No especificar --</option>
                            <option value="MOTO">Moto</option>
                            <option value="PEQUENO">Pequeño (Automóvil)</option>
                            <option value="MEDIANO">Mediano (Camioneta)</option>
                            <option value="GRANDE">Grande (Furgón)</option>
                        </select>
                    </div>
                  )}


                 {/* --- Mensajes y Botón Submit --- */}
                 <hr className={styles.separator} />
                 {errorApi && <p className={styles.formError}>{errorApi}</p>}
                 {successApi && <p className={styles.formSuccess}>{successApi}</p>}
                 <button
                    type="submit"
                    disabled={submitting || (tipoServicio === 'BODEGAJE_SALIDA' && loadingInventario)}
                    className={styles.submitButton}
                  >
                     {submitting ? 'Enviando Solicitud...' : 'Solicitar Servicio'}
                 </button>
            </form>
        </div>
    );

} // Fin SolicitarEnvio

export default SolicitarEnvio;