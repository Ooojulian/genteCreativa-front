// frontend/src/components/Inventario/HistorialInventario.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Importa funciones API necesarias
import {
    getHistorialInventario, getProductos, getUbicaciones
} from '../../services/bodegaje'; // <-- Importa de bodegaje.ts
import { getEmpresas } from '../../services/empresas'; // <-- Importa getEmpresas de empresas.ts
// --- Importa los estilos ---
import styles from '../../styles/Inventario/HistorialInventario.module.css'; // <-- Ajusta la ruta

// --- Interfaces Definidas LOCALMENTE o importadas desde types ---
interface EmpresaData { id: number; nombre: string; }
interface ProductoDataOutput { id: number; nombre: string; sku: string; }
interface UbicacionDataOutput { id: number; nombre: string; }
interface MovimientoInventarioData {
    id: number;
    timestamp: string;
    usuario: string | null; // Nombre usuario o null
    tipo_movimiento: string; // Texto legible del tipo
    producto: string | null; // Nombre producto o null
    ubicacion: string | null; // Nombre ubicación o null
    empresa: EmpresaData | null; // Objeto Empresa
    cantidad_anterior: number | null;
    cantidad_nueva: number | null;
    cantidad_cambio: number;
    motivo: string | null;
    inventario_id: number | null; // ID del registro Inventario afectado (si aún existe)
}
interface HistorialInventarioFiltros { // Para filtrar historial
    year?: number | string;
    month?: number | string;
    day?: number | string;
    producto_id?: number | string;
    ubicacion_id?: number | string;
    empresa_id?: number | string;
}
// --- Fin Interfaces ---

// Función formato fecha
const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return '--';
    try {
        const date = new Date(isoString);
        // Formato más conciso: DD/MM/YY HH:MM
        return date.toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // O true si prefieres AM/PM
        });
    }
    catch (e) {
        return isoString;
    }
};

const HistorialInventario: React.FC = () => {
    // --- Estados ---
    const [historial, setHistorial] = useState<MovimientoInventarioData[]>([]);
    const [productos, setProductos] = useState<ProductoDataOutput[]>([]);
    const [ubicaciones, setUbicaciones] = useState<UbicacionDataOutput[]>([]);
    const [empresas, setEmpresas] = useState<EmpresaData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOptionsLoading, setIsOptionsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para los filtros
    const currentYear = new Date().getFullYear();
    const [filtroYear, setFiltroYear] = useState<number | string>(currentYear);
    const [filtroMonth, setFiltroMonth] = useState<number | string>(new Date().getMonth() + 1);
    const [filtroProducto, setFiltroProducto] = useState<number | string>(''); // Clave para Kardex
    const [filtroUbicacion, setFiltroUbicacion] = useState<number | string>(''); // Filtro ubicación
    const [filtroEmpresa, setFiltroEmpresa] = useState<number | string>(''); // Filtro empresa

    // --- Carga de Datos ---
    const fetchFilterOptions = useCallback(async () => {
        setIsOptionsLoading(true); setError(null);
        try {
            const [prodsData, ubiData, empData] = await Promise.all([ getProductos(), getUbicaciones(), getEmpresas() ]);
            setProductos(prodsData); setUbicaciones(ubiData); setEmpresas(empData);
        } catch (e: any) { setError(e.message || "Error al cargar opciones de filtro."); console.error("Error filtros:", e); }
        finally { setIsOptionsLoading(false); }
    }, []);

    const fetchHistorial = useCallback(async () => {
        setIsLoading(true); setError(null);
        const filtros: HistorialInventarioFiltros = {
            year: filtroYear || undefined, month: filtroMonth || undefined,
            producto_id: filtroProducto || undefined, ubicacion_id: filtroUbicacion || undefined,
            empresa_id: filtroEmpresa || undefined,
        };
        // Elimina claves con valor undefined para no enviar params vacíos
        Object.keys(filtros).forEach(key => filtros[key as keyof HistorialInventarioFiltros] === undefined && delete filtros[key as keyof HistorialInventarioFiltros]);
        console.log("[HistorialInventario] Fetching con filtros:", filtros);

        try {
            const data = await getHistorialInventario(filtros);
            // Ordenar por timestamp descendente (más reciente primero) si la API no lo hace
            data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setHistorial(data);
        } catch (err: any) { setError(err.response?.data?.detail || err.message || "Error al cargar historial"); console.error(err); setHistorial([]);}
        finally { setIsLoading(false); }
    }, [filtroYear, filtroMonth, filtroProducto, filtroUbicacion, filtroEmpresa]); // Depende de los filtros

    // Carga inicial de opciones
    useEffect(() => { fetchFilterOptions(); }, [fetchFilterOptions]);

    // Carga de historial cuando cambian filtros relevantes
    useEffect(() => {
        // Buscar si: (Hay Producto sel.) O (No hay Producto sel. Y Hay Empresa sel.)
        if (filtroProducto || (!filtroProducto && filtroEmpresa)) {
           fetchHistorial();
        } else {
           // Limpiar si no hay filtros suficientes para buscar
           setHistorial([]);
        }
    }, [fetchHistorial, filtroProducto, filtroEmpresa]); // Dependencias clave

    // --- Opciones para Filtros ---
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const monthOptions = [
        { value: '', label: 'Todos' }, { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
        { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },{ value: 5, label: 'Mayo' },
        { value: 6, label: 'Junio' },{ value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
        { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
        { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
    ];


    // --- Renderizado ---
    return (
        <div className={styles.gestionContainer}>
            <h3>Historial de Movimientos</h3>

            {/* Sección de Filtros */}
            <div className={styles.filterContainer}>
                {/* Año */}
                <div className={styles.filterGroup}>
                    <label htmlFor="filt-year" className={styles.filterLabel}>Año:</label>
                    <select id="filt-year" value={filtroYear} onChange={e => setFiltroYear(e.target.value)} className={styles.filterSelect}>
                        <option value="">Todos</option>
                        {yearOptions.map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                 {/* Mes */}
                 <div className={styles.filterGroup}>
                     <label htmlFor="filt-month" className={styles.filterLabel}>Mes:</label>
                     <select id="filt-month" value={filtroMonth} onChange={e => setFiltroMonth(e.target.value)} className={styles.filterSelect}>
                        {monthOptions.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
                     </select>
                 </div>
                {/* Producto */}
                <div className={styles.filterGroup}>
                    <label htmlFor="filt-prod" className={styles.filterLabel}>Producto:</label>
                    <select id="filt-prod" value={filtroProducto} onChange={e => setFiltroProducto(e.target.value)} className={styles.filterSelect} disabled={isOptionsLoading}>
                        <option value="">-- Todos (Vista Cronológica) --</option>
                        {productos.map(p=><option key={p.id} value={p.id}>{p.nombre}({p.sku})</option>)}
                    </select>
                </div>
                {/* Empresa */}
                <div className={styles.filterGroup}>
                    <label htmlFor="filt-emp" className={styles.filterLabel}>Empresa Cliente:</label>
                    <select id="filt-emp" value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} className={styles.filterSelect} disabled={isOptionsLoading}>
                        <option value="">-- Todas --</option>
                        {empresas.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                </div>
                 {/* Ubicación */}
                 <div className={styles.filterGroup}>
                     <label htmlFor="filt-ubi" className={styles.filterLabel}>Ubicación:</label>
                     <select id="filt-ubi" value={filtroUbicacion} onChange={e => setFiltroUbicacion(e.target.value)} className={styles.filterSelect} disabled={isOptionsLoading}>
                        <option value="">-- Todas --</option>
                        {ubicaciones.map(u=><option key={u.id} value={u.id}>{u.nombre}</option>)}
                     </select>
                 </div>
                {isOptionsLoading && <div className={styles.loadingFiltersText}><small>Cargando filtros...</small></div>}
                {/* Mensaje si no hay filtros suficientes */}
                {!filtroProducto && !filtroEmpresa && <p className={styles.infoNota}>Selecciona un Producto para vista Kardex o una Empresa para vista cronológica.</p>}
            </div>

            {/* Estado Carga/Error */}
            {isLoading && <p className={styles.loadingText}>Cargando historial...</p>}
            {error && !isLoading && <p className={styles.errorText}>Error: {error}</p>}

            {/* --- Renderizado Condicional de Tabla --- */}
            {!isLoading && !error && (historial.length === 0 && (filtroProducto || filtroEmpresa)) &&
                <p className={styles.noResultsText}>No hay movimientos para los filtros seleccionados.</p>
            }

            {!isLoading && !error && historial.length > 0 && (
                <div className={styles.listContainer}>
                    {/* --- MODO KARDEX (si hay producto seleccionado) --- */}
                    {filtroProducto && (
                        <table className={`${styles.historialTable} ${styles.kardexTable}`}>
                            {/* Texto del caption */}
                            <caption>Kardex de Cantidades para: {productos.find(p => p.id === Number(filtroProducto))?.nombre || 'Producto Desconocido'}</caption>
                            <thead>
                                <tr>
                                    {/* Columnas Kardex */}
                                    <th rowSpan={2}>Fecha/Hora</th>
                                    <th rowSpan={2}>Detalle</th>
                                    <th rowSpan={2}>Ubicación</th>
                                    <th rowSpan={2}>Usuario</th>
                                    <th colSpan={1}>Entradas</th>
                                    <th colSpan={1}>Salidas</th>
                                    <th colSpan={1}>Saldos</th>
                                </tr>
                                <tr>
                                    {/* Sub-cabecera Cantidad */}
                                    <th className={styles.amountCell}>Cantidad</th>
                                    <th className={styles.amountCell}>Cantidad</th>
                                    <th className={styles.amountCell}>Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historial.map(mov => (
                                    // Filtra aquí también para asegurar que solo se muestren movimientos de inventario
                                    !mov.tipo_movimiento.startsWith('PROD_') && !mov.tipo_movimiento.startsWith('UBI_') &&
                                    <tr key={mov.id}>
                                        <td>{formatDateTime(mov.timestamp)}</td>
                                        <td> {/* Celda Detalle */}
                                            <div className={styles.detalleConcepto}>{mov.tipo_movimiento}</div>
                                            {mov.motivo && <div className={styles.detalleMotivo}>{mov.motivo}</div>}
                                        </td>
                                        <td>{mov.ubicacion || '-'}</td> {/* Muestra Ubicación */}
                                        <td>{mov.usuario || 'Sistema'}</td> {/* Muestra Usuario */}
                                        {/* Celdas Entrada/Salida/Saldo */}
                                        <td className={styles.amountCell}>
                                            {mov.cantidad_cambio > 0 ? mov.cantidad_cambio : ''}
                                        </td>
                                        <td className={styles.amountCell}>
                                            {mov.cantidad_cambio < 0 ? Math.abs(mov.cantidad_cambio) : ''}
                                        </td>
                                        <td className={`${styles.amountCell} ${styles.saldoCell}`}>
                                            {mov.cantidad_nueva ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* --- MODO CRONOLÓGICO (si NO hay producto seleccionado) --- */}
                    {!filtroProducto && (
                        <table className={`${styles.historialTable} ${styles.cronologicoTable}`}>
                             {/* Texto del caption */}
                             <caption>Historial Cronológico {filtroEmpresa ? `para Empresa: ${empresas.find(e => e.id === Number(filtroEmpresa))?.nombre}` : '(General - Selecciona Empresa)'}</caption>
                             <thead>
                                <tr>
                                    {/* Columnas Cronológicas */}
                                    <th>Fecha/Hora</th>
                                    <th>Usuario</th>
                                    <th>Tipo Mov.</th>
                                    <th>Producto</th>
                                    <th>Ubicación</th>
                                    <th>Empresa</th>
                                    <th>Detalle/Motivo</th>
                                    {/* Opcional: Mostrar cambio y saldo si es útil */}
                                    {/* <th className={styles.amountCell}>Cambio</th> */}
                                    {/* <th className={styles.amountCell}>Saldo Nuevo</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {historial.map(mov => (
                                    <tr key={mov.id} className={mov.tipo_movimiento.startsWith('PROD_') || mov.tipo_movimiento.startsWith('UBI_') ? styles.logEntryRow : ''}>
                                        <td>{formatDateTime(mov.timestamp)}</td>
                                        <td>{mov.usuario || 'Sistema'}</td>
                                        <td>{mov.tipo_movimiento}</td>
                                        {/* Muestra nombre de producto o indica ver motivo si es evento de producto */}
                                        <td>{mov.producto || (mov.tipo_movimiento.startsWith('PROD_') ? '(Ver Motivo)' : '-')}</td>
                                        {/* Muestra nombre de ubicación o indica ver motivo si es evento de ubicación */}
                                        <td>{mov.ubicacion || (mov.tipo_movimiento.startsWith('UBI_') ? '(Ver Motivo)' : '-')}</td>
                                        <td>{mov.empresa?.nombre || '-'}</td>
                                        <td className={styles.motivoCell}>{mov.motivo || '-'}</td>
                                        {/* <td>{mov.cantidad_cambio}</td> */}
                                        {/* <td>{mov.cantidad_nueva ?? '-'}</td> */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default HistorialInventario;