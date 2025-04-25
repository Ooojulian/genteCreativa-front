// frontend/src/components/Conductor/PedidoItem.tsx

import React, { useState, ChangeEvent } from 'react';
import {
    iniciarPedido,
    finalizarPedido,
    uploadPruebaEntrega,
    getQRData // Importa la función para obtener datos del QR
} from '../../services/api';
import { PedidoConductorData } from '../../types/pedido'; // Importa la interfaz con flags booleanos
import styles from '../../styles/Conductor/PedidoItem.module.css';
import QRCode from "react-qr-code"; // <-- Importa la librería para generar el QR

// Interfaz para las props
interface PedidoItemProps {
  pedido: PedidoConductorData;
  onUpdate: () => void;
}

// Tipo para los tipos de foto que sube este componente
type TipoFotoUpload = 'INICIO_GEN' | 'FIN_MERC' | 'FIN_REC';

// Formateador de fecha
const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return 'N/A';
    try { return new Date(isoString).toLocaleString('es-CO'); }
    catch (e) { return isoString; }
}

const PedidoItem: React.FC<PedidoItemProps> = ({ pedido, onUpdate }) => {

    // --- Estados para subida de archivos ---
    const [selectedFileInicio, setSelectedFileInicio] = useState<File | null>(null);
    const [selectedFileFinMerc, setSelectedFileFinMerc] = useState<File | null>(null);
    const [selectedFileFinRec, setSelectedFileFinRec] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<TipoFotoUpload | false>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

    // --- Estados para QR ---
    const [qrUrl, setQrUrl] = useState<string | null>(null); // Guarda la URL para el QR
    const [loadingQr, setLoadingQr] = useState<boolean>(false);
    const [errorQr, setErrorQr] = useState<string | null>(null);

    // --- Handler para generar/mostrar/ocultar QR ---
    const handleGenerarQR = async () => {
        // Si ya hay una URL (el QR se está mostrando), ocúltalo
        if (qrUrl) {
            setQrUrl(null);
            setErrorQr(null); // Limpia error anterior si lo había
            return;
        }

        // Si no hay URL, genérala
        setLoadingQr(true);
        setErrorQr(null);
        try {
            const response = await getQRData(pedido.id); // Llama a la API
            if (response.confirmation_url) {
                setQrUrl(response.confirmation_url); // Guarda la URL en el estado
            } else {
                setErrorQr("No se recibió la URL de confirmación del servidor.");
            }
        } catch (error: any) {
            setErrorQr(error.response?.data?.detail || error.message || "Error al obtener datos del QR.");
        } finally {
            setLoadingQr(false);
        }
    };

    // --- Handlers para selección y subida de archivos ---
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>, tipoFoto: TipoFotoUpload) => {
         setUploadError(null); setUploadSuccess(null); setErrorQr(null); // Limpia mensajes al seleccionar
         const file = event.target.files ? event.target.files[0] : null;
         switch (tipoFoto) {
             case 'INICIO_GEN': setSelectedFileInicio(file); break;
             case 'FIN_MERC': setSelectedFileFinMerc(file); break;
             case 'FIN_REC': setSelectedFileFinRec(file); break;
         }
         event.target.value = ''; // Limpiar input
    };

    const handleUpload = async (tipoFoto: TipoFotoUpload) => {
        let fileToUpload: File | null = null;
        // ... (lógica para seleccionar fileToUpload - sin cambios) ...
         switch (tipoFoto) { case 'INICIO_GEN': fileToUpload = selectedFileInicio; break; case 'FIN_MERC': fileToUpload = selectedFileFinMerc; break; case 'FIN_REC': fileToUpload = selectedFileFinRec; break; }
         if (!fileToUpload) { setUploadError(`No hay archivo seleccionado para ${tipoFoto}.`); return; }

        setIsUploading(tipoFoto); setUploadError(null); setUploadSuccess(null); setErrorQr(null);

        try {
            await uploadPruebaEntrega(pedido.id, tipoFoto, fileToUpload);
            setUploadSuccess(`Foto ${tipoFoto} subida correctamente.`);
            // ... (lógica para limpiar estado del archivo - sin cambios) ...
             switch (tipoFoto) { case 'INICIO_GEN': setSelectedFileInicio(null); break; case 'FIN_MERC': setSelectedFileFinMerc(null); break; case 'FIN_REC': setSelectedFileFinRec(null); break; }
            onUpdate(); // Refrescar datos del pedido
        } catch (error: any) { /* ... manejo error ... */
            const errorMsg = error.response?.data?.detail || error.response?.data?.error || error.message || `Error al subir foto ${tipoFoto}.`; setUploadError(errorMsg);
         } finally { setIsUploading(false); }
    };

    // Handlers Iniciar/Finalizar (sin cambios)
    const handleIniciar = async () => { /* ... */
        if (window.confirm(`¿Iniciar pedido ${pedido.id}?`)) { try { await iniciarPedido(pedido.id); onUpdate(); } catch (error: any) { alert(`Error al iniciar: ${error.response?.data?.detail || error.message}`); } }
     };
    const handleFinalizar = async () => { /* ... */
        if (window.confirm(`¿Finalizar pedido ${pedido.id}?`)) { try { await finalizarPedido(pedido.id); onUpdate(); } catch (error: any) { alert(`Error al finalizar: ${error.response?.data?.detail || error.message}`); } }
     };

    // Lógica de botones deshabilitados (sin cambios)
    const puedeIniciar = pedido.estado === 'pendiente' && (!pedido.requiere_fotos_inicio || pedido.fotos_inicio_completas);
    const puedeFinalizar = pedido.estado === 'en_curso' &&
                           (!pedido.requiere_fotos_fin || pedido.fotos_fin_completas) &&
                           (!pedido.requiere_confirmacion_cliente || pedido.confirmacion_cliente_realizada);

    // --- RENDERIZADO ---
    return (
        <li className={styles.pedidoItem}>
            {/* ... (Info Básica y Detalles) ... */}
            <div className={styles.infoPrincipal}><span><strong>ID: {pedido.id}</strong></span><span>Estado: {pedido.estado}</span><span>Tipo: {pedido.tipo_servicio_display || 'N/A'}</span></div> <hr/> <div className={styles.detalles}> <p><strong>Cliente:</strong> {pedido.cliente}</p> {pedido.origen && <p><strong>Origen:</strong> {pedido.origen}</p>} {pedido.destino && <p><strong>Destino:</strong> {pedido.destino}</p>} <p><strong>Creado:</strong> {formatDateTime(pedido.fecha_creacion)}</p> {pedido.fecha_inicio && <p><strong>Iniciado:</strong> {formatDateTime(pedido.fecha_inicio)}</p>} {pedido.fecha_fin && <p><strong>Finalizado:</strong> {formatDateTime(pedido.fecha_fin)}</p>} </div>

            {/* --- Sección Subida Fotos INICIO --- */}
            {pedido.estado === 'pendiente' && pedido.requiere_fotos_inicio && !pedido.fotos_inicio_completas && (
                 <div className={styles.uploadSection}> {/* ... (Input y botón INICIO_GEN sin cambios) ... */}
                      <label htmlFor={`foto-inicio-${pedido.id}`}>Foto Inicio Requerida:</label> <input type="file" id={`foto-inicio-${pedido.id}`} accept="image/*" onChange={(e) => handleFileChange(e, 'INICIO_GEN')} disabled={!!isUploading} /> <button onClick={() => handleUpload('INICIO_GEN')} disabled={!selectedFileInicio || !!isUploading} className={styles.uploadButton} > {isUploading === 'INICIO_GEN' ? 'Subiendo...' : 'Subir Foto Inicio'} </button> {uploadError && isUploading !== 'INICIO_GEN' && <p className={styles.uploadError}>{uploadError}</p>} {uploadSuccess && !selectedFileInicio && <p className={styles.uploadSuccess}>{uploadSuccess}</p>}
                 </div>
             )}

            {/* --- Sección Subida Fotos FIN --- */}
            {pedido.estado === 'en_curso' && pedido.requiere_fotos_fin && !pedido.fotos_fin_completas && (
                 <> {/* ... (Inputs y botones FIN_MERC y FIN_REC sin cambios) ... */}
                      <div className={styles.uploadSection}> <label htmlFor={`foto-fin-merc-${pedido.id}`}>Foto Mercancía Entregada*:</label> <input type="file" id={`foto-fin-merc-${pedido.id}`} accept="image/*" onChange={(e) => handleFileChange(e, 'FIN_MERC')} disabled={!!isUploading} /> <button onClick={() => handleUpload('FIN_MERC')} disabled={!selectedFileFinMerc || !!isUploading} className={styles.uploadButton} > {isUploading === 'FIN_MERC' ? 'Subiendo...' : 'Subir Foto Merc.'} </button> </div>
                      <div className={styles.uploadSection}> <label htmlFor={`foto-fin-rec-${pedido.id}`}>Foto Persona Receptora*:</label> <input type="file" id={`foto-fin-rec-${pedido.id}`} accept="image/*" onChange={(e) => handleFileChange(e, 'FIN_REC')} disabled={!!isUploading} /> <button onClick={() => handleUpload('FIN_REC')} disabled={!selectedFileFinRec || !!isUploading} className={styles.uploadButton} > {isUploading === 'FIN_REC' ? 'Subiendo...' : 'Subir Foto Rec.'} </button> </div>
                      {uploadError && isUploading !== 'FIN_MERC' && isUploading !== 'FIN_REC' && <p className={styles.uploadError}>{uploadError}</p>} {uploadSuccess && !selectedFileFinMerc && !selectedFileFinRec && <p className={styles.uploadSuccess}>{uploadSuccess}</p>}
                      <p className={styles.infoNota}>*Se requieren ambas fotos para poder finalizar.</p>
                 </>
             )}

            {/* Mensaje si fotos FIN OK pero falta confirmación cliente */}
            {pedido.estado === 'en_curso' && pedido.requiere_fotos_fin && pedido.fotos_fin_completas && pedido.requiere_confirmacion_cliente && !pedido.confirmacion_cliente_realizada && (
                 <p className={styles.infoNota}>Fotos listas. Pendiente confirmación del cliente.</p>
            )}

            {/* --- Sección QR (ACTUALIZADA) --- */}
            {/* Mostrar botón y QR si: en curso Y fotos fin OK Y requiere confirmación Y aún no está confirmada */}
            {pedido.estado === 'en_curso' && pedido.fotos_fin_completas && pedido.requiere_confirmacion_cliente && !pedido.confirmacion_cliente_realizada && (
                <div className={styles.qrSection}>
                     <button
                         onClick={handleGenerarQR} // Llama a la función para obtener/limpiar URL
                         disabled={loadingQr || !!isUploading} // Deshabilitado mientras carga QR o sube foto
                         className={styles.actionButton}
                     >
                         {loadingQr ? 'Generando...' : (qrUrl ? 'Ocultar QR' : 'Mostrar QR Cliente')}
                     </button>
                     {errorQr && <p className={styles.uploadError}>{errorQr}</p>}

                     {/* Mostrar el código QR si tenemos la URL */}
                     {qrUrl && !loadingQr && (
                         <div className={styles.qrCodeContainer}>
                             <p>Muestra este QR al cliente para confirmar:</p>
                             <QRCode value={qrUrl} size={160} /> {/* Ajusta tamaño si es necesario */}
                             {/* <p className={styles.qrUrlText}>{qrUrl}</p> */}
                         </div>
                     )}
                 </div>
            )}
            {/* --- FIN Sección QR --- */}


            {/* --- Botones de Acción (Iniciar/Finalizar) --- */}
            <div className={styles.actionButtons}>
                {pedido.estado === 'pendiente' && (
                    <button onClick={handleIniciar} disabled={!puedeIniciar || !!isUploading} className={styles.actionButton}>
                        Iniciar Viaje
                    </button>
                )}

                {pedido.estado === 'en_curso' && (
                    <button onClick={handleFinalizar} disabled={!puedeFinalizar || !!isUploading} className={styles.actionButton}>
                        Finalizar Viaje
                    </button>
                )}
            </div>
        </li>
    );
};

export default PedidoItem;