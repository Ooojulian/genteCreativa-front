// frontend/src/components/Shared/PedidoDetalleCompleto.tsx
import React from 'react';
// Asegúrate que importe las interfaces actualizadas y necesarias
import { PedidoDetalleData } from '../../types/pedido'; // Ajusta la ruta si es necesario
import styles from '../../styles/Shared/PedidoDetalleCompleto.module.css'; // Ajusta la ruta si es necesario

// Función para formatear fechas (puedes moverla a un archivo utils)
const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('es-CO', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    } catch (e) {
        console.error("Error formateando fecha:", isoString, e);
        return isoString; // Devuelve el string original si falla
    }
};

// Props para el componente
interface PedidoDetalleCompletoProps {
    pedido: PedidoDetalleData | null; // Acepta null por si no hay pedido seleccionado
}

const PedidoDetalleCompleto: React.FC<PedidoDetalleCompletoProps> = ({ pedido }) => {

    if (!pedido) {
        return <div className={styles.noSeleccionado}>Selecciona un pedido para ver los detalles.</div>;
    }

    // Filtrar fotos por etapa para mostrarlas separadas (usando tipo_foto)
    // Asegúrate que pedido.pruebas_entrega exista en tu interfaz PedidoDetalleData
    const fotosInicio = pedido.pruebas_entrega?.filter(p => p.tipo_foto?.startsWith('INICIO')) || [];
    const fotosFin = pedido.pruebas_entrega?.filter(p => p.tipo_foto?.startsWith('FIN')) || [];

    return (
        // Contenedor principal
        <div className={styles.detalleContainer}>
            {/* Título */}
            <h3 className={styles.titulo}>Detalles del Pedido #{pedido.id}</h3>

            {/* --- Sección Información General --- */}
            <div className={styles.seccion}>
                <h4>Información General</h4>
                <p><strong>Tipo de Servicio:</strong> {pedido.tipo_servicio_display || pedido.tipo_servicio}</p>
                <p><strong>Estado:</strong> {pedido.estado_display || pedido.estado}</p>
                <p><strong>Cliente:</strong> {pedido.cliente}</p>
                <p><strong>Conductor Asignado:</strong> {pedido.conductor || 'No asignado'}</p>
                <p><strong>Fecha Creación:</strong> {formatDateTime(pedido.fecha_creacion)}</p>
                <p><strong>Fecha Inicio Viaje:</strong> {formatDateTime(pedido.fecha_inicio)}</p>
                <p><strong>Fecha Fin Viaje:</strong> {formatDateTime(pedido.fecha_fin)}</p>
                {/* Mostrar descripción general solo si existe */}
                {pedido.descripcion && (<p><strong>Descripción/Notas Generales:</strong> {pedido.descripcion}</p>)}
            </div>

            {/* --- Sección Programación y Ruta (MODIFICADA para excluir SALIDA) --- */}
            {(pedido.tipo_servicio !== 'BODEGAJE_SALIDA') && (
                <div className={styles.seccion}>
                    <h4>Programación y Ruta</h4>
                    {/* Inicio / Recogida */}
                    {pedido.hora_recogida_programada && (
                        <p><strong>
                            {pedido.tipo_servicio === 'RENTA_VEHICULO' ? 'Inicio Renta Programado:' : 'Recogida Programada:'}
                        </strong> {formatDateTime(pedido.hora_recogida_programada)}</p>
                    )}
                    {/* Origen (si aplica) */}
                    {(pedido.tipo_servicio === 'SIMPLE' || pedido.tipo_servicio === 'BODEGAJE_ENTRADA' || pedido.tipo_servicio === 'PASAJEROS') && pedido.origen && (
                        <p><strong>Origen/Dirección Recogida:</strong> {pedido.origen}</p>
                    )}
                    {/* Fin / Entrega (Programada) */}
                    {pedido.hora_entrega_programada && (
                        <p><strong>
                            {pedido.tipo_servicio === 'RENTA_VEHICULO' ? 'Fin Renta Programado:' : 'Entrega Programada:'}
                        </strong> {formatDateTime(pedido.hora_entrega_programada)}</p>
                    )}
                    {/* Destino se mueve a las secciones específicas */}
                </div>
            )}

            {/* --- Sección Específica: Mercancía Simple --- */}
            {pedido.tipo_servicio === 'SIMPLE' && (
                <div className={styles.seccion}>
                    <h4>Detalles Mercancía (Envío Simple)</h4>
                    {pedido.destino && <p><strong>Destino/Dirección Entrega:</strong> {pedido.destino}</p>}
                    {pedido.dimensiones_contenido && <p><strong>Dimensiones/Tamaño:</strong> {pedido.dimensiones_contenido}</p>}
                    {pedido.tipo_vehiculo_display && <p><strong>Vehículo Recomendado:</strong> {pedido.tipo_vehiculo_display}</p>}
                </div>
            )}

            {/* --- Sección Específica: Bodega Entrada --- */}
            {pedido.tipo_servicio === 'BODEGAJE_ENTRADA' && (
                <div className={styles.seccion}>
                    <h4>Detalles Mercancía (Entrada Bodega)</h4>
                    {pedido.tiempo_bodegaje_estimado && <p><strong>Tiempo Bodegaje Estimado:</strong> {pedido.tiempo_bodegaje_estimado}</p>}
                    {pedido.dimensiones_contenido && <p><strong>Dimensiones/Tamaño:</strong> {pedido.dimensiones_contenido}</p>}
                    {pedido.tipo_vehiculo_display && <p><strong>Vehículo Recomendado:</strong> {pedido.tipo_vehiculo_display}</p>}
                </div>
            )}

             {/* --- Sección Específica: Bodega Salida --- */}
             {pedido.tipo_servicio === 'BODEGAJE_SALIDA' && (
                <div className={styles.seccion}>
                    <h4>Detalles Retiro de Bodega</h4>
                    {pedido.destino && <p><strong>Destino/Dirección Entrega:</strong> {pedido.destino}</p>}
                    {pedido.hora_entrega_programada && (<p><strong>Entrega Programada:</strong> {formatDateTime(pedido.hora_entrega_programada)}</p>)}
                    <h5>Productos a Retirar</h5>
                    {pedido.items_pedido && pedido.items_pedido.length > 0 ? (
                        <ul className={styles.itemList}>
                            {pedido.items_pedido.map(item => ( <li key={item.id}>{item.cantidad} x {item.producto}</li> ))}
                        </ul>
                    ) : (<p>No se especificaron items para retirar.</p> )}
                    {pedido.descripcion && <p><strong>Instrucciones Adicionales:</strong> {pedido.descripcion}</p>}
                    {pedido.tipo_vehiculo_display && <p><strong>Vehículo Recomendado:</strong> {pedido.tipo_vehiculo_display}</p>}
                </div>
            )}

            {/* --- Sección Específica: Pasajeros --- */}
            {pedido.tipo_servicio === 'PASAJEROS' && (
                <div className={styles.seccion}>
                    <h4>Detalles Viaje Pasajeros</h4>
                    {pedido.destino && <p><strong>Destino/Dirección Entrega:</strong> {pedido.destino}</p>}
                    {pedido.numero_pasajeros !== null && <p><strong>Número de Pasajeros:</strong> {pedido.numero_pasajeros}</p>}
                    {pedido.tipo_tarifa_pasajero_display && <p><strong>Tipo de Tarifa:</strong> {pedido.tipo_tarifa_pasajero_display}</p>}
                    {pedido.tipo_tarifa_pasajero === 'TIEMPO' && pedido.duracion_estimada_horas && <p><strong>Duración Estimada:</strong> {pedido.duracion_estimada_horas} horas</p>}
                    {pedido.tipo_tarifa_pasajero === 'DISTANCIA' && pedido.distancia_estimada_km && <p><strong>Distancia Estimada:</strong> {pedido.distancia_estimada_km} Km</p>}
                    {pedido.tipo_vehiculo_display && <p><strong>Vehículo Recomendado:</strong> {pedido.tipo_vehiculo_display}</p>}
                    {pedido.descripcion && <p><strong>Notas Adicionales:</strong> {pedido.descripcion}</p>}
                </div>
            )}

             {/* --- Sección Específica: Renta Vehículo --- */}
             {pedido.tipo_servicio === 'RENTA_VEHICULO' && (
                <div className={styles.seccion}>
                    <h4>Detalles Renta Vehículo</h4>
                    {pedido.tipo_vehiculo_display && <p><strong>Vehículo Rentado:</strong> {pedido.tipo_vehiculo_display}</p>}
                    {pedido.descripcion && <p><strong>Notas/Requisitos Renta:</strong> {pedido.descripcion}</p>}
                </div>
            )}

             {/* --- SECCIÓN NUEVA: Pruebas Fotográficas --- */}
             {(fotosInicio.length > 0 || fotosFin.length > 0) && (
                 <div className={styles.seccion}>
                    <h4>Pruebas Fotográficas</h4>
                    {/* Fotos de Inicio */}
                    {fotosInicio.length > 0 && (
                        <>
                            <h5>Inicio Viaje:</h5>
                            <div className={styles.photoGallery}>
                                {fotosInicio.map(foto => (
                                    <div key={foto.id} className={styles.photoContainer}>
                                        {/* Enlace abre imagen en nueva pestaña */}
                                        <a href={foto.foto_url || '#'} target="_blank" rel="noopener noreferrer" title={`Ver foto ${foto.tipo_foto_display}`}>
                                            <img src={foto.foto_url || '/placeholder.png'} alt={foto.tipo_foto_display || 'Foto Inicio'} className={styles.photoThumbnail} />
                                        </a>
                                        <p className={styles.photoCaption}>{foto.tipo_foto_display} ({formatDateTime(foto.timestamp)})</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    {/* Fotos de Fin */}
                     {fotosFin.length > 0 && (
                        <>
                            {/* Separador visual si hay fotos de inicio también */}
                            {fotosInicio.length > 0 && <hr className={styles.photoSeparator}/>}
                            <h5>Fin Viaje:</h5>
                             <div className={styles.photoGallery}>
                                {fotosFin.map(foto => (
                                    <div key={foto.id} className={styles.photoContainer}>
                                        <a href={foto.foto_url || '#'} target="_blank" rel="noopener noreferrer" title={`Ver foto ${foto.tipo_foto_display}`}>
                                            <img src={foto.foto_url || '/placeholder.png'} alt={foto.tipo_foto_display || 'Foto Fin'} className={styles.photoThumbnail} />
                                        </a>
                                        <p className={styles.photoCaption}>{foto.tipo_foto_display} ({formatDateTime(foto.timestamp)})</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                 </div>
             )}
             {/* --- FIN SECCIÓN Pruebas Fotográficas --- */}


             {/* --- SECCIÓN NUEVA: Confirmación Cliente --- */}
             {/* Renderiza esta sección si el objeto confirmacion_cliente existe en los datos del pedido */}
             {pedido.confirmacion_cliente && (
                <div className={styles.seccion}>
                    <h4>Confirmación del Cliente</h4>
                    <p><strong>Recibido por:</strong> {pedido.confirmacion_cliente.nombre_receptor || 'N/A'}</p>
                    {pedido.confirmacion_cliente.cedula_receptor && <p><strong>Cédula/ID:</strong> {pedido.confirmacion_cliente.cedula_receptor}</p>}
                    {pedido.confirmacion_cliente.observaciones && <p><strong>Observaciones del Cliente:</strong> {pedido.confirmacion_cliente.observaciones}</p>}
                    <p><strong>Fecha Confirmación:</strong> {formatDateTime(pedido.confirmacion_cliente.fecha_confirmacion)}</p>
                    {/* Muestra la imagen de la firma si existe */}
                    {pedido.confirmacion_cliente.firma_imagen_base64 ? (
                         <div className={styles.firmaContainer}>
                            <strong>Firma:</strong><br />
                            <img
                                src={pedido.confirmacion_cliente.firma_imagen_base64}
                                alt="Firma Cliente"
                                className={styles.firmaImage}
                            />
                         </div>
                    ) : ( <p><strong>Firma:</strong> No registrada</p> )}
                 </div>
             )}
              {/* --- FIN SECCIÓN Confirmación Cliente --- */}


        </div> // Fin detalleContainer
    );
};

export default PedidoDetalleCompleto;