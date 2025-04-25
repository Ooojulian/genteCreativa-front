// frontend/src/components/Cliente/HistorialPedidosCliente.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { PedidoDetalleData } from '../../types/pedido'; // Ajusta ruta si es necesario
import { getHistorialMesCliente } from '../../services/api'; // Importa la nueva función API
import HistorialItem from '../Shared/HistorialItem'; // Reutiliza el componente detallado
// Estilos
import styles from '../../styles/Cliente/HistorialPedidosCliente.module.css';

const HistorialPedidosCliente: React.FC = () => {
    const [historial, setHistorial] = useState<PedidoDetalleData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para filtros de fecha
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

    // Función para cargar datos
    const fetchHistorial = useCallback(async (year: number, month: number) => {
        console.log(`[HistorialPedidosCliente] Fetching historial for ${year}-${month}`);
        setLoading(true);
        setError(null);
        try {
            // Llama a la función API específica del cliente
            const data = await getHistorialMesCliente(year, month);
            setHistorial(data);
        } catch (err: any) {
            console.error(`[HistorialPedidosCliente] Error cargando historial:`, err.response || err);
            setError(err.response?.data?.detail || err.message || 'No se pudo cargar el historial.');
            setHistorial([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Efecto para cargar al inicio y cuando cambian los filtros
    useEffect(() => {
        fetchHistorial(selectedYear, selectedMonth);
    }, [selectedYear, selectedMonth, fetchHistorial]);

    // Opciones para los dropdowns de fecha (igual que otros historiales)
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
            <h3 className={styles.title}>Mi Historial de Pedidos</h3>

            {/* Controles de Fecha */}
            <div className={styles.controlsContainer}>
                <div className={styles.controlGroup}>
                    <label htmlFor="hist-cl-year" className={styles.controlLabel}>Año:</label>
                    <select
                        id="hist-cl-year"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                        className={styles.selectControl} // <-- Aplica clase
                    >
                        {yearOptions.map(year => (<option key={year} value={year}>{year}</option>))}
                    </select>
                </div>
                <div className={styles.controlGroup}>
                    <label htmlFor="hist-cl-month" className={styles.controlLabel}>Mes:</label>
                    <select
                        id="hist-cl-month"
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
                        No tienes pedidos finalizados o cancelados para {monthOptions.find(m => m.value === selectedMonth)?.label} de {selectedYear}.
                    </p>
                ) : (
                    <ul className={styles.historialList}> {/* Aplica clase a la lista */}
                        {historial.map((pedido) => (
                            // HistorialItem usa sus propios estilos internos (HistorialItem.module.css)
                            <HistorialItem key={pedido.id} pedidoDetalle={pedido} />
                        ))}
                    </ul>
                )
            )}
        </div>
        // --- FIN USO DE CLASES ---
    );
};

export default HistorialPedidosCliente;