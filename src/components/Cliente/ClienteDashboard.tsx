// frontend/src/components/Cliente/ClienteDashboard.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import InventarioCliente from './InventarioCliente';
import SolicitarEnvio from './SolicitarEnvio';
import HistorialPedidosCliente from './HistorialPedidosCliente';
import Header from '../Layout/Header'; // Asumiendo que Header está en Layout

// --- Importa los estilos del Layout Y los específicos de este componente ---
import layoutStyles from '../../styles/Layout/DashboardLayout.module.css';
import clienteStyles from '../../styles/Cliente/ClienteDashboard.module.css'; // <-- NUEVO: Crea este archivo

// --- Importa el GIF ---
// Asegúrate que la ruta sea correcta desde este archivo
// Asumiendo que 'assets' está dentro de 'src'
import inicioGif from '../../assets/gift/inicio.gif'; // <-- Corregido a .gif y ruta relativa

const ClienteDashboard: React.FC = () => {
  const { user } = useAuth(); // logout ya no se usa aquí directamente
  // Añade 'historial' a los tipos de vista si no estaba
  const [vistaActual, setVistaActual] = useState<'inicio' | 'inventario' | 'solicitar' | 'historial'>('inicio');

  const renderVista = () => {
    switch (vistaActual) {
      case 'inventario': return <InventarioCliente />;
      case 'solicitar': return <SolicitarEnvio />;
      case 'historial': return <HistorialPedidosCliente />;
      case 'inicio':
      default:
        return (
          // --- Contenedor para el layout de dos columnas ---
          <div className={clienteStyles.inicioContainer}>
            {/* Columna Izquierda: Texto */}
            <div className={clienteStyles.inicioTexto}>
              <h3>Resumen</h3>
              <p>Bienvenido/a, {user?.nombre || user?.username || user?.cedula || 'Cliente'}.</p>
              <p>Empresa: {user?.empresa?.nombre || 'No asignada'}</p>
              <p>Rol: {user?.rol?.nombre}</p>
              <p>Selecciona una opción del menú.</p>
            </div>
            {/* Columna Derecha: GIF */}
            <div className={clienteStyles.inicioGif}>
              <img src={inicioGif} alt="Animación de inicio" />
            </div>
          </div>
        );
    }
  }

  return (
    <div className={layoutStyles.dashboardContainer}>
      {/* Cabecera (usando componente Header) */}
      {/* Pasamos el título y si mostrar el botón de logout (asumiendo que Header lo maneja) */}
      <Header title={`Panel de Cliente`} />

      {/* Menú de Navegación (sin cambios) */}
      <nav className={layoutStyles.navigation}>
        <button onClick={() => setVistaActual('inicio')} className={`${layoutStyles.navButton} ${vistaActual === 'inicio' ? layoutStyles.navButtonActive : ''}`}> Inicio </button>
        <button onClick={() => setVistaActual('inventario')} className={`${layoutStyles.navButton} ${vistaActual === 'inventario' ? layoutStyles.navButtonActive : ''}`}> Ver Inventario </button>
        <button onClick={() => setVistaActual('solicitar')} className={`${layoutStyles.navButton} ${vistaActual === 'solicitar' ? layoutStyles.navButtonActive : ''}`}> Solicitar Envío </button>
        <button onClick={() => setVistaActual('historial')} className={`${layoutStyles.navButton} ${vistaActual === 'historial' ? layoutStyles.navButtonActive : ''}`}> Historial Servicios </button>
      </nav>

      {/* Área de Contenido Principal */}
      <main className={layoutStyles.mainContent}>
        {renderVista()}
      </main>

    </div>
  );
};
export default ClienteDashboard;