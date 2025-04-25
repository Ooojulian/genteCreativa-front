// frontend/src/components/Inventario/HistorialInventario.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Importa funciones API necesarias
import {
    getHistorialInventario, getProductos, getUbicaciones, getEmpresas
} from '../../services/api'; // Ajusta ruta
// --- Importa los estilos ---
import styles from '../../styles/Inventario/HistorialInventario.module.css'; // <-- Ajusta la ruta


// --- Interfaces Definidas LOCALMENTE ---
interface EmpresaData { id: number; nombre: string; }
interface ProductoDataOutput { id: number; nombre: string; sku: string; }
interface UbicacionDataOutput { id: number; nombre: string; }
interface MovimientoInventarioData {
    id: number; timestamp: string; usuario: string | null; tipo_movimiento: string;
    producto: string | null; ubicacion: string | null; empresa: EmpresaData | null;
    cantidad_anterior: number | null; cantidad_nueva: number | null;
    cantidad_cambio: number; motivo: string | null; inventario_id: number | null;
}
interface HistorialInventarioFiltros { year?: number | string; month?: number | string; day?: number | string; producto_id?: number | string; ubicacion_id?: number | string; empresa_id?: number | string; }
// --- Fin Interfaces Locales ---

// Función formato fecha
const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return '--';
    try { const date = new Date(isoString); return date.toLocaleString('es-CO', { dateStyle:'short', timeStyle: 'short' }); } // Formato Colombia
    catch (e) { return isoString; }
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
    const [filtroYear, setFiltroYear] = useState<number | string>(currentYear); // Inicia con año actual
    const [filtroMonth, setFiltroMonth] = useState<number | string>(new Date().getMonth() + 1); // Inicia con mes actual
    const [filtroProducto, setFiltroProducto] = useState<number | string>('');
    const [filtroUbicacion, setFiltroUbicacion] = useState<number | string>('');
    const [filtroEmpresa, setFiltroEmpresa] = useState<number | string>('');

    // --- Carga de Datos ---
    const fetchFilterOptions = useCallback(async () => {
        setIsOptionsLoading(true); setError(null); // Limpia error general al cargar opciones
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
            const data = await getHistorialInventario(filtros); // Llama a la API
            setHistorial(data);
        } catch (err: any) { setError(err.response?.data?.detail || err.message || "Error al cargar historial"); console.error(err); setHistorial([]);}
        finally { setIsLoading(false); }
    }, [filtroYear, filtroMonth, filtroProducto, filtroUbicacion, filtroEmpresa]); // Depende de los filtros

    // Carga inicial y recarga cuando cambian los filtros
    useEffect(() => { fetchFilterOptions(); }, [fetchFilterOptions]);
    useEffect(() => { fetchHistorial(); }, [fetchHistorial]); // Ejecuta fetchHistorial cuando cambien los filtros

    // --- Opciones para Filtros (sin cambios) ---
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const monthOptions = [{ value: '', label: 'Todos' }, { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },{ value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },{ value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },{ value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },{ value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }];


    // --- Renderizado (con classNames) ---
    return (
        // Usa la clase del contenedor principal si aplica (puede venir de un layout superior)
        <div className={styles.gestionContainer}> {/* O simplemente div si el padding viene de fuera */}
            <h3>Historial de Movimientos de Inventario</h3>

            {/* Sección de Filtros */}
            <div className={styles.filterContainer}> {/* Clase para el contenedor de filtros */}
                <div className={styles.filterGroup}> <label htmlFor="filt-year" className={styles.filterLabel}>Año:</label> <select id="filt-year" value={filtroYear} onChange={e => setFiltroYear(e.target.value)} className={styles.filterSelect}><option value="">Todos</option>{yearOptions.map(y=><option key={y} value={y}>{y}</option>)}</select> </div>
                <div className={styles.filterGroup}> <label htmlFor="filt-month" className={styles.filterLabel}>Mes:</label> <select id="filt-month" value={filtroMonth} onChange={e => setFiltroMonth(e.target.value)} className={styles.filterSelect}>{monthOptions.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select> </div>
                <div className={styles.filterGroup}> <label htmlFor="filt-prod" className={styles.filterLabel}>Producto:</label> <select id="filt-prod" value={filtroProducto} onChange={e => setFiltroProducto(e.target.value)} className={styles.filterSelect} disabled={isOptionsLoading}><option value="">Todos</option>{productos.map(p=><option key={p.id} value={p.id}>{p.nombre}({p.sku})</option>)}</select> </div>
                <div className={styles.filterGroup}> <label htmlFor="filt-ubi" className={styles.filterLabel}>Ubicación:</label> <select id="filt-ubi" value={filtroUbicacion} onChange={e => setFiltroUbicacion(e.target.value)} className={styles.filterSelect} disabled={isOptionsLoading}><option value="">Todas</option>{ubicaciones.map(u=><option key={u.id} value={u.id}>{u.nombre}</option>)}</select> </div>
                <div className={styles.filterGroup}> <label htmlFor="filt-emp" className={styles.filterLabel}>Empresa Cliente:</label> <select id="filt-emp" value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} className={styles.filterSelect} disabled={isOptionsLoading}><option value="">Todas</option>{empresas.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select> </div>
                {isOptionsLoading && <div className={styles.loadingFiltersText}><small>Cargando filtros...</small></div>}
            </div>

            {/* Estado Carga/Error */}
            {isLoading && <p className={styles.loadingText}>Cargando historial...</p>}
            {error && !isLoading && <p className={styles.errorText}>Error: {error}</p>}

            {/* Tabla de Historial */}
            {!isLoading && !error && (
                historial.length === 0 ? <p className={styles.noResultsText}>No hay movimientos para los filtros seleccionados.</p> :
                <div className={styles.listContainer}> {/* Contenedor de la tabla */}
                    <table className={styles.historialTable}> {/* Clase para la tabla */}
                        <thead>
                            <tr>
                                <th>Fecha/Hora</th> <th>Usuario</th> <th>Tipo Mov.</th> <th>Producto</th>
                                <th>Ubicación</th> <th>Empresa</th> <th className={styles.amountCell}>Cant. Ant.</th>
                                <th className={styles.amountCell}>Cambio</th> <th className={styles.amountCell}>Cant. Nueva</th> <th>Motivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.map(mov => (
                                <tr key={mov.id}>
                                    <td>{formatDateTime(mov.timestamp)}</td>
                                    <td>{mov.usuario || 'Sistema'}</td>
                                    <td>{mov.tipo_movimiento}</td>
                                    <td>{mov.producto || '?'}</td>
                                    <td>{mov.ubicacion || '?'}</td>
                                    <td>{mov.empresa?.nombre || '?'}</td>
                                    <td className={styles.amountCell}>{mov.cantidad_anterior ?? '-'}</td>
                                    {/* Aplica clase condicional para el color del cambio */}
                                    <td className={mov.cantidad_cambio > 0 ? styles.changeCellPositive : (mov.cantidad_cambio < 0 ? styles.changeCellNegative : styles.changeCellNeutral)}>
                                        {mov.cantidad_cambio > 0 ? `+${mov.cantidad_cambio}` : mov.cantidad_cambio}
                                    </td>
                                    <td className={styles.amountCell}>{mov.cantidad_nueva ?? '-'}</td>
                                    <td>{mov.motivo || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HistorialInventario;