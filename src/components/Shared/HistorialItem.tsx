// frontend/src/components/Shared/HistorialItem.tsx (o donde esté)
import React, { useState } from 'react';
import { PedidoDetalleData, PruebaEntregaData, ConfirmacionClienteData} from '../../types/pedido';
import styles from '../../styles/Shared/HistorialItem.module.css'; // Crea este archivo CSS




// Props actualizadas
interface HistorialItemProps {
  pedidoDetalle: PedidoDetalleData; // Recibe el objeto completo
}

// Función para formatear (la tenías en ambos archivos, mejor tenerla en un utils/)
const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return '--';
    try { const date = new Date(isoString); return date.toLocaleString(); }
    catch (e) { return isoString; }
};

// El componente funcional
const HistorialItem: React.FC<HistorialItemProps> = ({ pedidoDetalle }) => {
  // Estado local para mostrar/ocultar detalles (opcional)
  const [detallesVisibles, setDetallesVisibles] = useState(false);

  const toggleDetalles = () => setDetallesVisibles(!detallesVisibles);

  // Extraer datos para facilitar lectura
  const {
      id, cliente, conductor, origen, destino, descripcion, estado_display,
      fecha_creacion, fecha_inicio, fecha_fin, tipo_servicio_display,
      pruebas_entrega = [], // Valor por defecto array vacío
      confirmacion_cliente = null, // Valor por defecto null
      // ... otros campos de PedidoDetalleData que quieras mostrar ...
      items_pedido, numero_pasajeros, tipo_tarifa_pasajero_display,
      duracion_estimada_horas, distancia_estimada_km, tiempo_bodegaje_estimado,
      dimensiones_contenido, tipo_vehiculo_display,
      hora_recogida_programada, hora_entrega_programada
  } = pedidoDetalle;

  const fotosInicio = pruebas_entrega.filter(p => p.tipo_foto?.startsWith('INICIO'));
  const fotosFin = pruebas_entrega.filter(p => p.tipo_foto?.startsWith('FIN'));

  return (
      <li className={styles.historialItem}>
          {/* Resumen Principal (visible siempre) */}
          <div className={styles.resumen}>
              <span className={styles.pedidoId}>ID: {id}</span>
              <span className={styles.cliente}>Cliente: {cliente}</span>
              <span className={styles.tipoServicio}>Tipo: {tipo_servicio_display}</span>
              <span className={styles.fechaFin}>Finalizado: {formatDateTime(fecha_fin)}</span>
              <button onClick={toggleDetalles} className={styles.toggleButton}>
                  {detallesVisibles ? 'Ocultar Detalles ▼' : 'Ver Detalles ▶'}
              </button>
          </div>

          {/* Detalles Adicionales (visibles condicionalmente) */}
          {detallesVisibles && (
              <div className={styles.detallesContainer}>
                  <div className={styles.columna}> {/* Columna 1 */}
                      <h4>Detalles Generales</h4>
                      <p><strong>Conductor:</strong> {conductor || 'No asignado'}</p>
                      <p><strong>Estado:</strong> {estado_display}</p>
                      {origen && <p><strong>Origen:</strong> {origen}</p>}
                      {destino && <p><strong>Destino:</strong> {destino}</p>}
                      {hora_recogida_programada && <p><strong>Recogida Prog.:</strong> {formatDateTime(hora_recogida_programada)}</p>}
                      {hora_entrega_programada && <p><strong>Entrega Prog.:</strong> {formatDateTime(hora_entrega_programada)}</p>}
                      <p><strong>Creado:</strong> {formatDateTime(fecha_creacion)}</p>
                      <p><strong>Inicio Viaje:</strong> {formatDateTime(fecha_inicio)}</p>
                      {descripcion && <p><strong>Notas Generales:</strong> {descripcion}</p>}
                      {tipo_vehiculo_display && <p><strong>Vehículo:</strong> {tipo_vehiculo_display}</p>}

                      {/* Detalles específicos por tipo */}
                      {pedidoDetalle.tipo_servicio === 'BODEGAJE_SALIDA' && items_pedido && items_pedido.length > 0 && (
                           <div><strong>Items Retirados:</strong>
                              <ul className={styles.itemList}>
                                  {items_pedido.map(item => <li key={item.id}>{item.cantidad} x {item.producto}</li>)}
                              </ul>
                           </div>
                      )}
                      {pedidoDetalle.tipo_servicio === 'BODEGAJE_ENTRADA' && tiempo_bodegaje_estimado && <p><strong>T. Bodega Est.:</strong> {tiempo_bodegaje_estimado}</p>}
                      {(pedidoDetalle.tipo_servicio === 'SIMPLE' || pedidoDetalle.tipo_servicio === 'BODEGAJE_ENTRADA') && dimensiones_contenido && <p><strong>Dimensiones:</strong> {dimensiones_contenido}</p>}
                      {pedidoDetalle.tipo_servicio === 'PASAJEROS' && (<>
                          {numero_pasajeros && <p><strong>Pasajeros:</strong> {numero_pasajeros}</p>}
                          {tipo_tarifa_pasajero_display && <p><strong>Tarifa:</strong> {tipo_tarifa_pasajero_display}</p>}
                          {duracion_estimada_horas && <p><strong>Duración Est.:</strong> {duracion_estimada_horas}h</p>}
                          {distancia_estimada_km && <p><strong>Distancia Est.:</strong> {distancia_estimada_km}km</p>}
                      </>)}
                  </div>

                  <div className={styles.columna}> {/* Columna 2 */}
                      {/* Fotos */}
                      {(fotosInicio.length > 0 || fotosFin.length > 0) && (
                          <div className={styles.seccionFotos}>
                              <h4>Fotos de Prueba</h4>
                              {fotosInicio.length > 0 && (
                                  <> <h5>Inicio:</h5> <div className={styles.galeria}> {fotosInicio.map(f => <a key={f.id} href={f.foto_url || '#'} target="_blank" rel="noopener noreferrer"><img src={f.foto_url || ''} alt={f.tipo_foto_display} title={`${f.tipo_foto_display} (${formatDateTime(f.timestamp)})`} /></a>)} </div> </>
                              )}
                              {fotosFin.length > 0 && (
                                  <> <h5>Fin:</h5> <div className={styles.galeria}> {fotosFin.map(f => <a key={f.id} href={f.foto_url || '#'} target="_blank" rel="noopener noreferrer"><img src={f.foto_url || ''} alt={f.tipo_foto_display} title={`${f.tipo_foto_display} (${formatDateTime(f.timestamp)})`} /></a>)} </div> </>
                              )}
                          </div>
                      )}

                      {/* Confirmación Cliente */}
                      {confirmacion_cliente && (
                          <div className={styles.seccionConfirmacion}>
                              <h4>Confirmación Cliente</h4>
                              <p><strong>Recibido por:</strong> {confirmacion_cliente.nombre_receptor}</p>
                              {confirmacion_cliente.cedula_receptor && <p><strong>Cédula/ID:</strong> {confirmacion_cliente.cedula_receptor}</p>}
                              <p><strong>Fecha:</strong> {formatDateTime(confirmacion_cliente.fecha_confirmacion)}</p>
                              {confirmacion_cliente.observaciones && <p><strong>Observaciones:</strong> {confirmacion_cliente.observaciones}</p>}
                              {confirmacion_cliente.firma_imagen_base64 && (
                                  <div><strong>Firma:</strong><br /><img src={confirmacion_cliente.firma_imagen_base64} alt="Firma" className={styles.firmaImagen}/></div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          )}
      </li>
  );
};

export default HistorialItem;