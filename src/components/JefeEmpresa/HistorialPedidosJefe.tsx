// frontend/src/components/JefeEmpresa/HistorialPedidosJefe.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { getHistorialGeneral } from '../../services/api';
import HistorialItem from '../Shared/HistorialItem';
import { PedidoDetalleData } from '../../types/pedido'; 

const HistorialPedidosJefe: React.FC = () => {
  const [historial, setHistorial] = useState<PedidoDetalleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const fetchHistorial = useCallback(async (year: number, month: number) => {
    setLoading(true); setError(null);
    try {
      const data = await getHistorialGeneral(year, month);
      setHistorial(data); 
    } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'No se pudo cargar el historial.');
        setHistorial([]);
     } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchHistorial(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchHistorial]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const monthOptions = [ { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },{ value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },{ value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },{ value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },{ value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },{ value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' } ];

  // Estilos
  const containerStyle: React.CSSProperties = { padding: '20px' };
  const controlStyle: React.CSSProperties = { marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' };
  const selectStyle: React.CSSProperties = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
  const listStyle: React.CSSProperties = { listStyle: 'none', padding: 0, marginTop: '20px' };

  return (
    <div style={containerStyle}>
      <h3>Historial General de Pedidos Finalizados</h3>
      <div style={controlStyle}>
         <label htmlFor="hist-year">Año:</label> <select id="hist-year" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))} style={selectStyle}>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select>
         <label htmlFor="hist-month">Mes:</label> <select id="hist-month" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))} style={selectStyle}>{monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
      </div>
      {loading && <div>Cargando historial...</div>}
      {error && !loading && <div style={{ color: 'red' }}>Error: {error}</div>}
      {!loading && !error && (
        historial.length === 0 ? ( <p>No hay viajes finalizados para {monthOptions.find(m => m.value === selectedMonth)?.label} de {selectedYear}.</p> )
        : ( <ul style={listStyle}> {historial.map((pedido) => ( <HistorialItem key={pedido.id} pedidoDetalle={pedido} /> ))} </ul> )
      )}
    </div>
  );
};
export default HistorialPedidosJefe;