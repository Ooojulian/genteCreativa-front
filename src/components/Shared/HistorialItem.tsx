// frontend/src/components/Shared/HistorialItem.tsx
import React, { useState } from 'react';
// Asegúrate que la ruta a tu archivo de tipos sea correcta
import { PedidoDetalleData, PruebaEntregaData, ConfirmacionClienteData } from '../../types/pedido';
// Importa la función API para obtener el PDF
import { getRemisionPDF } from '../../services/transporte'; // <-- APUNTA AL NUEVO ARCHIVO
// Importa los estilos
import styles from '../../styles/Shared/HistorialItem.module.css'; // Ajusta la ruta si es necesario

// Props que espera el componente
interface HistorialItemProps {
  pedidoDetalle: PedidoDetalleData; // Recibe el objeto completo del pedido
}

// Función auxiliar para formatear fechas (puedes moverla a un archivo utils)
const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return '--';
    try {
        const date = new Date(isoString);
        // Formato ejemplo: 26/4/2025, 3:05 p. m. (ajusta según preferencia)
        return date.toLocaleString('es-CO', {
             dateStyle: 'short',
             timeStyle: 'short'
        });
    }
    catch (e) {
        console.error("Error formateando fecha:", isoString, e);
        return isoString;
    }
};

// El componente funcional
const HistorialItem: React.FC<HistorialItemProps> = ({ pedidoDetalle }) => {
  // Estado local para mostrar/ocultar detalles
  const [detallesVisibles, setDetallesVisibles] = useState(false);
  // Estado local para el botón de remisión
  const [loadingRemision, setLoadingRemision] = useState(false);
  const [errorRemision, setErrorRemision] = useState<string | null>(null);

  // Función para alternar la visibilidad de los detalles
  const toggleDetalles = () => {
      setDetallesVisibles(!detallesVisibles);
      setErrorRemision(null); // Limpia error al ocultar/mostrar detalles
  };

  // Función para manejar la descarga/visualización de la remisión
  const handleDescargarRemision = async () => {
      setLoadingRemision(true);
      setErrorRemision(null);
      console.log(`Intentando descargar remisión para pedido ID: ${pedidoDetalle.id}`);
      try {
          // Llama a la función API que espera un Blob PDF
          const pdfBlob = await getRemisionPDF(pedidoDetalle.id);

          // Crea una URL temporal para el Blob recibido
          const fileURL = window.URL.createObjectURL(pdfBlob);

          // Abre el PDF en una nueva pestaña del navegador
          window.open(fileURL, '_blank');

          // Opcional: Si prefieres forzar descarga en lugar de abrir
          /*
          const link = document.createElement('a');
          link.href = fileURL;
          link.setAttribute('download', `remision_pedido_${pedidoDetalle.id}.pdf`); // Nombre sugerido para descarga
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link); // Limpiar
          */

           // Importante: Liberar la URL del objeto después de un tiempo (si abres en nueva pestaña)
           // Si fuerzas descarga, puedes revocarla inmediatamente después de link.click()
          setTimeout(() => window.URL.revokeObjectURL(fileURL), 100); // Libera memoria

      } catch (error: any) {
           console.error("Error al descargar/ver remisión:", error);
           // Muestra el mensaje de error que viene de la función API
           setErrorRemision(error.message || "No se pudo generar la remisión.");
      } finally {
          setLoadingRemision(false); // Termina el estado de carga
      }
  };

  // Extracción de datos del pedido para facilitar el renderizado
  const {
      id, cliente, conductor, origen, destino, descripcion, estado_display,
      fecha_creacion, fecha_inicio, fecha_fin, tipo_servicio_display,
      pruebas_entrega = [], // Asegura que sea un array
      confirmacion_cliente = null, // Asegura que sea null si no existe
      items_pedido, numero_pasajeros, tipo_tarifa_pasajero_display,
      duracion_estimada_horas, distancia_estimada_km, tiempo_bodegaje_estimado,
      dimensiones_contenido, tipo_vehiculo_display,
      hora_recogida_programada, hora_entrega_programada
  } = pedidoDetalle;

  // Filtrar fotos por tipo para mostrarlas separadas
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
                  {/* Columna 1: Detalles generales y específicos del tipo */}
                  <div className={styles.columna}>
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

                  {/* Columna 2: Pruebas (Fotos y Confirmación Cliente) y Acciones */}
                  <div className={styles.columna}>
                      {/* Fotos */}
                      {(fotosInicio.length > 0 || fotosFin.length > 0) && (
                          <div className={styles.seccionFotos}>
                              <h4>Fotos de Prueba</h4>
                              {fotosInicio.length > 0 && (
                                  <> <h5>Inicio:</h5> <div className={styles.galeria}> {fotosInicio.map(f => <a key={f.id} href={f.foto_url || '#'} target="_blank" rel="noopener noreferrer"><img src={f.foto_url || ''} alt={f.tipo_foto_display} title={`${f.tipo_foto_display} (${formatDateTime(f.timestamp)})`} /></a>)} </div> </>
                              )}
                              {fotosFin.length > 0 && (
                                  <> {fotosInicio.length > 0 && <hr className={styles.photoSeparator}/>} <h5>Fin:</h5> <div className={styles.galeria}> {fotosFin.map(f => <a key={f.id} href={f.foto_url || '#'} target="_blank" rel="noopener noreferrer"><img src={f.foto_url || ''} alt={f.tipo_foto_display} title={`${f.tipo_foto_display} (${formatDateTime(f.timestamp)})`} /></a>)} </div> </>
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

                      {/* --- Sección de Acción: Remisión --- */}
                      <div className={styles.seccionAcciones}>
                          <h4>Acciones</h4>
                          <button
                              onClick={handleDescargarRemision}
                              disabled={loadingRemision}
                              className={styles.remisionButton}
                          >
                              {loadingRemision ? 'Generando PDF...' : 'Descargar/Ver Remisión'}
                          </button>
                          {/* Muestra el error si ocurre al intentar generar/descargar */}
                          {errorRemision && <p className={styles.errorRemision}>{errorRemision}</p>}
                      </div>
                      {/* --- Fin Sección de Acción --- */}
                  </div>
              </div>
          )}
      </li>
  );
};

export default HistorialItem;