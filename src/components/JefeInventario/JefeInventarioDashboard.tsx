// frontend/src/components/JefeInventario/JefeInventarioDashboard.tsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

// Importa componentes (Ajusta rutas si es necesario)
import GestionInventario from '../Inventario/GestionInventario';
import HistorialInventario from '../Inventario/HistorialInventario';
import GestionUbicaciones from '../Inventario/GestionUbicaciones';
import GestionProductos from '../Inventario/GestionProductos';

// --- Importa estilos ---
import layoutStyles from '../../styles/Layout/DashboardLayout.module.css';
import styles from '../../styles/JefeInventario/JefeInventarioDashboard.module.css'; // <-- NUEVO
import Header from '../Layout/Header';

// --- Importa el GIF ---
// Ajusta la ruta si es necesario
import inicioGif from '../../assets/gift/inicio.gif'; // <-- Asumiendo ruta y extensión .gif

// Tipos de vista
type JefeInvVista = 'inicio' | 'inventario' | 'ubicaciones' | 'productos' | 'historial';

const JefeInventarioDashboard: React.FC = () => {
  const { user } = useAuth(); // logout no se usa aquí
  const [vistaActual, setVistaActual] = useState<JefeInvVista>('inicio');

  // Renderiza el componente correcto (actualizado para 'inicio')
  const renderVista = () => {
    switch(vistaActual) {
      case 'inicio': // --- JSX Actualizado para 'inicio' ---
        return (
          <div className={styles.inicioContainer}>
            {/* Columna Izquierda: Texto */}
            <div className={styles.inicioTexto}>
              <h3>Resumen - Jefe de Inventario</h3>
              <p>Bienvenido/a, {user?.nombre || user?.username || user?.cedula || 'Jefe de Inventario'}.</p>
              <p>Rol: {user?.rol?.nombre}</p>
              <p>Selecciona una opción de gestión del menú.</p>
            </div>
             {/* Columna Derecha: GIF */}
            <div className={styles.inicioGif}>
              <img src={inicioGif} alt="Animación de inicio" />
            </div>
          </div>
        ); // --- Fin JSX Actualizado ---
      case 'ubicaciones': return <GestionUbicaciones />;
      case 'productos': return <GestionProductos />;
      case 'inventario': return <GestionInventario />;
      case 'historial': return <HistorialInventario />;
      default: return null;
    }
  }

  return (
    <div className={layoutStyles.dashboardContainer}>
      {/* Cabecera */}
      <Header title={`Panel Jefe de Inventario`}/> {/* Asume que Header maneja logout */}

       {/* Menú de Navegación/Acciones (sin cambios) */}
      <nav className={layoutStyles.navigation}>
         <button onClick={() => setVistaActual('inicio')} className={`${layoutStyles.navButton} ${vistaActual === 'inicio' ? layoutStyles.navButtonActive : ''}`}> Inicio </button>
         <button onClick={() => setVistaActual('inventario')} className={`${layoutStyles.navButton} ${vistaActual === 'inventario' ? layoutStyles.navButtonActive : ''}`}> Inventario </button>
         <button onClick={() => setVistaActual('ubicaciones')} className={`${layoutStyles.navButton} ${vistaActual === 'ubicaciones' ? layoutStyles.navButtonActive : ''}`}> Ubicaciones </button>
         <button onClick={() => setVistaActual('productos')} className={`${layoutStyles.navButton} ${vistaActual === 'productos' ? layoutStyles.navButtonActive : ''}`}> Productos </button>
         <button onClick={() => setVistaActual('historial')} className={`${layoutStyles.navButton} ${vistaActual === 'historial' ? layoutStyles.navButtonActive : ''}`}> Historial </button>
      </nav>

      {/* Área Principal */}
      <main className={layoutStyles.mainContent}>
        {renderVista()}
      </main>
    </div>
  );
};

export default JefeInventarioDashboard;