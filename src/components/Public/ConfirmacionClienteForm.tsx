// src/components/Public/ConfirmacionClienteForm.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Para leer el token de la URL
import SignatureCanvas from 'react-signature-canvas'; // Importa el componente de firma
import { submitConfirmacionCliente } from '../../services/api'; // Necesitarás crear esta función en api.ts
import styles from '../../styles/Public/ConfirmacionForm.module.css'; // Crea este archivo CSS

// Interfaz para los datos del formulario
interface ConfirmacionFormData {
    nombre_receptor: string;
    cedula_receptor?: string; // Opcional
    firma_imagen_base64: string; // Enviaremos la firma como base64
    observaciones?: string; // Opcional
}

const ConfirmacionClienteForm: React.FC = () => {
    // Obtener el token de la URL
    const { token } = useParams<{ token: string }>();

    // Estados del formulario
    const [nombreReceptor, setNombreReceptor] = useState('');
    const [cedulaReceptor, setCedulaReceptor] = useState('');
    const [observaciones, setObservaciones] = useState('');

    // Referencia al canvas de la firma
    const sigCanvasRef = useRef<SignatureCanvas>(null);

    // Estados de UI y envío
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false); // Para mostrar mensaje de éxito y ocultar form

    // Limpiar el canvas de la firma
    const handleClearSignature = () => {
        sigCanvasRef.current?.clear(); // Llama al método clear del canvas
    };

    // Manejar el envío del formulario
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null); // Limpia error anterior

        // 1. Validar que haya firma
        if (sigCanvasRef.current?.isEmpty()) {
            setError("La firma es obligatoria.");
            return;
        }
        // 2. Validar nombre (requerido)
        if (!nombreReceptor.trim()) {
             setError("El nombre de quien recibe es obligatorio.");
             return;
        }

        // 3. Obtener la firma como imagen base64 (PNG por defecto)
        // getTrimmedCanvas().toDataURL('image/png') recorta espacios en blanco
        const firmaBase64 = sigCanvasRef.current?.toDataURL('image/png');

        if (!firmaBase64) {
            setError("No se pudo obtener la imagen de la firma.");
            return;
        }

        // 4. Preparar datos para enviar
        const formData: ConfirmacionFormData = {
            nombre_receptor: nombreReceptor.trim(),
            cedula_receptor: cedulaReceptor.trim() || undefined, // Enviar undefined si está vacío
            firma_imagen_base64: firmaBase64,
            observaciones: observaciones.trim() || undefined, // Enviar undefined si está vacío
        };

        // 5. Enviar a la API
        setIsSubmitting(true);
        try {
            if (!token) {
                throw new Error("Token de confirmación no encontrado en la URL.");
            }
            // Llama a la función API que tendrás que crear
            await submitConfirmacionCliente(token, formData);
            setSuccess(true); // Mostrar mensaje de éxito

        } catch (err: any) {
            console.error("Error al enviar confirmación:", err.response?.data || err.message);
            setError(err.response?.data?.detail || err.message || "Ocurrió un error al enviar la confirmación.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Si ya se envió con éxito, muestra mensaje y no el formulario
    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.successMessage}>
                    <h2>¡Confirmación Enviada!</h2>
                    <p>Gracias por confirmar la recepción.</p>
                </div>
            </div>
        );
    }

    // Renderiza el formulario
    return (
        <div className={styles.container}>
            <h2>Confirmación de Recepción/Servicio</h2>
            <p>Por favor, complete los siguientes datos y firme para confirmar.</p>
            {!token && <p className={styles.error}>Error: Falta el token de confirmación en la URL.</p>}

            {token && (
                 <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="nombreReceptor">Nombre de quien recibe:*</label>
                        <input
                            type="text"
                            id="nombreReceptor"
                            value={nombreReceptor}
                            onChange={(e) => setNombreReceptor(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="cedulaReceptor">Cédula/ID (Opcional):</label>
                        <input
                            type="text"
                            id="cedulaReceptor"
                            value={cedulaReceptor}
                            onChange={(e) => setCedulaReceptor(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                     <div className={styles.inputGroup}>
                        <label>Firma:*</label>
                        <div className={styles.signatureContainer}>
                             <SignatureCanvas
                                ref={sigCanvasRef}
                                penColor='black'
                                canvasProps={{ className: styles.signatureCanvas }}
                            />
                        </div>
                        <button type="button" onClick={handleClearSignature} className={styles.clearButton}>
                            Limpiar Firma
                        </button>
                    </div>


                    <div className={styles.inputGroup}>
                        <label htmlFor="observaciones">Observaciones (Opcional):</label>
                        <textarea
                            id="observaciones"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            rows={3}
                            className={styles.textarea}
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" disabled={isSubmitting || !token} className={styles.submitButton}>
                        {isSubmitting ? 'Enviando...' : 'Confirmar Recepción'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default ConfirmacionClienteForm;