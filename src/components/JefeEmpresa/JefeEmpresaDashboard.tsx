// frontend/src/components/JefeEmpresa/JefeEmpresaDashboard.tsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

// Componentes de gestión
import GestionEmpresas from './GestionEmpresas';
import GestionUsuarios from './GestionUsuarios';
import GestionPedidos from './GestionPedidos';
import HistorialPedidosJefe from './HistorialPedidosJefe';
// Componentes de Inventario
import GestionInventario from '../Inventario/GestionInventario';
import HistorialInventario from '../Inventario/HistorialInventario';
import GestionUbicaciones from '../Inventario/GestionUbicaciones';
import GestionProductos from '../Inventario/GestionProductos';
// Layout y otros
import Header from '../Layout/Header';
import layoutStyles from '../../styles/Layout/DashboardLayout.module.css';
// --- Importa los estilos específicos de este dashboard ---
import styles from '../../styles/JefeEmpresa/JefeEmpresaDashboard.module.css'; // <-- NUEVO

// --- Importa el GIF ---
// Ajusta la ruta si es necesario
import inicioGif from '../../assets/gift/jefe.gif'; // <-- Asumiendo ruta y extensión .gif

// Tipos de vista
type JefeVista = 'inicio' | 'empresas' | 'usuarios' | 'pedidos' | 'historial_pedidos' | 'inventario' | 'ubicaciones' | 'productos' | 'historial_inventario';

const JefeEmpresaDashboard: React.FC = () => {
  const { user } = useAuth(); // logout no se usa aquí
  const [vistaActual, setVistaActual] = useState<JefeVista>('inicio');

  // Función renderVista actualizada para 'inicio'
  const renderVista = () => {
    switch (vistaActual) {
      case 'empresas': return <GestionEmpresas />;
      case 'usuarios': return <GestionUsuarios />;
      case 'pedidos': return <GestionPedidos />;
      case 'historial_pedidos': return <HistorialPedidosJefe />;
      case 'inventario': return <GestionInventario />;
      case 'ubicaciones': return <GestionUbicaciones />;
      case 'productos': return <GestionProductos />;
      case 'historial_inventario': return <HistorialInventario />;
      case 'inicio':
      default:
        return ( // --- JSX Actualizado para 'inicio' ---
          <div className={styles.inicioContainer}>
            {/* Columna Izquierda: Texto */}
            <div className={styles.inicioTexto}>
              <h3>Resumen - Jefe de Empresa</h3>
              <p>Bienvenido/a, {user?.nombre || user?.username || user?.cedula || 'Jefe'}.</p>
              <p>Rol: {user?.rol?.nombre}</p>
              <p>Selecciona una opción de gestión en el menú.</p>
            </div>
             {/* Columna Derecha: GIF */}
            <div className={styles.inicioGif}>
              <img src={inicioGif} alt="Animación de inicio" />
            </div>
          </div>
        ); // --- Fin JSX Actualizado ---
    }
  }

  return (
    <div className={layoutStyles.dashboardContainer}>
      {/* Cabecera */}
      <Header title={`Panel Jefe de Empresa`}/> {/* Asume que Header maneja logout */}

      {/* Menú de Navegación (sin cambios) */}
      <nav className={layoutStyles.navigation}>
        <button onClick={() => setVistaActual('inicio')} className={`${layoutStyles.navButton} ${vistaActual === 'inicio' ? layoutStyles.navButtonActive : ''}`}> Inicio </button>
        <button onClick={() => setVistaActual('empresas')} className={`${layoutStyles.navButton} ${vistaActual === 'empresas' ? layoutStyles.navButtonActive : ''}`}> Empresas </button>
        <button onClick={() => setVistaActual('usuarios')} className={`${layoutStyles.navButton} ${vistaActual === 'usuarios' ? layoutStyles.navButtonActive : ''}`}> Usuarios </button>
        <button onClick={() => setVistaActual('pedidos')} className={`${layoutStyles.navButton} ${vistaActual === 'pedidos' ? layoutStyles.navButtonActive : ''}`}> Pedidos </button>
        <button onClick={() => setVistaActual('historial_pedidos')} className={`${layoutStyles.navButton} ${vistaActual === 'historial_pedidos' ? layoutStyles.navButtonActive : ''}`}> Hist. Pedidos </button>
        <button onClick={() => setVistaActual('inventario')} className={`${layoutStyles.navButton} ${vistaActual === 'inventario' ? layoutStyles.navButtonActive : ''}`}> Inventario </button>
        <button onClick={() => setVistaActual('ubicaciones')} className={`${layoutStyles.navButton} ${vistaActual === 'ubicaciones' ? layoutStyles.navButtonActive : ''}`}> Ubicaciones </button>
        <button onClick={() => setVistaActual('productos')} className={`${layoutStyles.navButton} ${vistaActual === 'productos' ? layoutStyles.navButtonActive : ''}`}> Productos </button>
        <button onClick={() => setVistaActual('historial_inventario')} className={`${layoutStyles.navButton} ${vistaActual === 'historial_inventario' ? layoutStyles.navButtonActive : ''}`}> Hist. Inventario </button>
      </nav>

      {/* Área Principal */}
      <main className={layoutStyles.mainContent}>
        {renderVista()}
      </main>
    </div>
  );
};

export default JefeEmpresaDashboard;