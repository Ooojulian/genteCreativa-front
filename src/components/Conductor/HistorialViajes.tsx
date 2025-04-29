// frontend/src/components/Conductor/HistorialViajes.tsx (Ajusta ruta si es necesario)

import React, { useState, useEffect, useCallback } from 'react';
import { PedidoDetalleData} from '../../types/pedido'; // Ajusta ruta si es necesario
// --- CORRECCIÓN AQUÍ ---
import { getHistorialMesConductor } from '../../services/transporte'; // <-- APUNTA AL NUEVO ARCHIVO
// ---------------------
import HistorialItem from '../Shared/HistorialItem'; // Ajusta ruta si es necesario
import styles from '../../styles/Conductor/HistorialViajes.module.css'; // Ajusta ruta si es necesario

const HistorialViajes: React.FC = () => {
    const [historial, setHistorial] = useState<PedidoDetalleData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const { logout } = useAuth(); // No se usa aquí

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

    const fetchHistorial = useCallback(async (year: number, month: number) => {
        console.log(`Workspaceing conductor historial for ${year}-${month}`);
        setLoading(true);
        setError(null);
        try {
            // --- 2. LLAMA A LA FUNCIÓN CORRECTA CON ARGUMENTOS CORRECTOS ---
            const data: PedidoDetalleData[] = await getHistorialMesConductor(year, month); // Reemplaza apiFunction
            setHistorial(data);
            // -------------------------------------
        } catch (err: any) {
            console.error(`Error al cargar historial conductor para ${year}-${month}:`, err.response || err);
            if (err.response?.status === 404) {
                 setError(`Error 404: No se encontró el endpoint del historial (/api/transporte/historial_mes_conductor/). Verifica la URL en api.ts y urls.py.`);
            } else {
                 setError(err.response?.data?.detail || err.message || 'No se pudo cargar el historial.');
            }
            setHistorial([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistorial(selectedYear, selectedMonth);
    }, [selectedYear, selectedMonth, fetchHistorial]);

    // Opciones para dropdowns (sin cambios)
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const monthOptions = [
        { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
        { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
        { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
        { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
        { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
    ];

    return (
        // --- USA LAS CLASES DEL CSS MODULE ---
        <div className={styles.container}>
            <h4 className={styles.title} >Historial de Viajes</h4> {/* Título opcionalmente centrado con .title */}

            {/* Controles de Fecha */}
            <div className={styles.controlsContainer}>
                 <div className={styles.controlGroup}>
                    <label htmlFor="hist-drv-year" className={styles.controlLabel}>Año:</label>
                    <select
                        id="hist-drv-year"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                        className={styles.selectControl} // <-- Aplica clase
                    >
                        {yearOptions.map(year => (<option key={year} value={year}>{year}</option>))}
                    </select>
                </div>
                 <div className={styles.controlGroup}>
                    <label htmlFor="hist-drv-month" className={styles.controlLabel}>Mes:</label>
                    <select
                        id="hist-drv-month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                        className={styles.selectControl} // <-- Aplica clase
                    >
                        {monthOptions.map(month => (<option key={month.value} value={month.value}>{month.label}</option>))}
                    </select>
                 </div>
            </div>

            {/* Estado de Carga/Error/Resultado */}
            {loading && <div className={styles.loadingMessage}>Cargando historial...</div>}
            {error && !loading && <div className={styles.errorMessage}>Error: {error}</div>}
            {!loading && !error && (
                historial.length === 0 ? (
                    <p className={styles.noResultsMessage}>
                        No hay viajes finalizados para {monthOptions.find(m => m.value === selectedMonth)?.label} de {selectedYear}.
                    </p>
                ) : (
                    <ul className={styles.historialList}> {/* Aplica clase */}
                        {historial.map((pedido) => (
                            // HistorialItem sigue usando sus propios estilos
                            <HistorialItem key={pedido.id} pedidoDetalle={pedido} />
                        ))}
                    </ul>
                )
            )}
        </div>
         // --- FIN USO DE CLASES ---
    );
};

export default HistorialViajes;