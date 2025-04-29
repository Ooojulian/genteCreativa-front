// frontend/src/components/Conductor/ConductorDashboard.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
// --- CORRECCIÓN AQUÍ ---
import { getPedidos } from '../../services/transporte'; // <-- APUNTA AL NUEVO ARCHIVO
// ---------------------
import PedidoItem from './PedidoItem';
import { useAuth } from '../../context/AuthContext';
import HistorialViajes from './HistorialViajes';
import layoutStyles from '../../styles/Layout/DashboardLayout.module.css';
import styles from '../../styles/Conductor/ConductorDashboard.module.css';
import { PedidoConductorData } from '../../types/pedido';
import Header from '../Layout/Header';

type ConductorVista = 'inicio' | 'pedidos' | 'historial';

const ConductorDashboard: React.FC = () => {
  // --- Estados ---
  const [vistaActual, setVistaActual] = useState<ConductorVista>('inicio');
  const [pedidos, setPedidos] = useState<PedidoConductorData[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true); // Should be true initially
  const [errorPedidos, setErrorPedidos] = useState<string | null>(null);
  const { user, logout } = useAuth();
  // const fetchPedidosRef = useRef(false); // This ref might not be necessary with the corrected useEffect

  // --- Carga de Datos (fetchPedidosActivos - IMPLEMENTADO) ---
  const fetchPedidosActivos = useCallback(async () => {
      console.log('[ConductorDashboard] Fetching active orders...');
      setLoadingPedidos(true);
      setErrorPedidos(null);
      try {
          // Make the actual API call to get assigned orders
          const data = await getPedidos(); // This calls /api/transporte/mis_pedidos/
          console.log('[ConductorDashboard] Active orders fetched:', data.length);
          setPedidos(data);
      } catch (err: any) {
          console.error('[ConductorDashboard] Error fetching active orders:', err.response || err);
          setErrorPedidos(err.response?.data?.detail || err.message || 'Error al cargar pedidos asignados.');
          setPedidos([]); // Clear previous data on error
      } finally {
          setLoadingPedidos(false);
      }
  }, []); // No dependencies needed as it uses imported functions and state setters

  // --- useEffect para cargar pedidos al montar y cuando cambia el usuario ---
  useEffect(() => {
      // Only fetch if the user is authenticated and has the conductor role
      if (user && user.rol?.nombre === 'conductor' && vistaActual === 'pedidos') {
           console.log('[ConductorDashboard] useEffect triggered, fetching active orders.');
          fetchPedidosActivos();
      }
      // No need for cleanup here as fetchPedidosActivos is idempotent
  }, [user, vistaActual, fetchPedidosActivos]); // Depend on user, vistaActual, and the stable fetch function


  const handleLogout = () => {
      logout(); // Assuming logout is handled by useAuth
  };

  // --- Renderizado del Contenido Principal (sin cambios, ya usa los estados correctos) ---
  const renderVistaPrincipal = () => {
    switch (vistaActual) {
      case 'inicio':
        return (
          <div className={styles.inicioContent}>
            <h3 className={styles.welcomeTitle}>Bienvenido, {user?.nombre || user?.cedula || 'Conductor'}!</h3>
            <p className={styles.welcomeText}>Selecciona una opción del menú para comenzar.</p>
          </div>
        );

      case 'pedidos':
        // This section correctly displays loading, error, or the list based on state
        return (
          <div className={styles.pedidosContainer}>
            <h3 className={styles.pedidosTitle}>Pedidos Actualmente Asignados</h3>
            {/* Display messages based on loading and error states */}
            {loadingPedidos && <p className={styles.loadingText}>Cargando pedidos asignados...</p>}
            {errorPedidos && !loadingPedidos && <p className={styles.errorText}>Error al cargar pedidos: {errorPedidos}</p>}
            {!loadingPedidos && !errorPedidos && (
                 pedidos.length === 0 ? (
                    <p className={styles.noPedidosText}>No tienes pedidos asignados en este momento.</p>
                 ) : (
                    // Render the list if not loading and no error, and there are orders
                    <ul className={styles.pedidosList}>
                        {pedidos.map((pedido) => (
                        <PedidoItem key={pedido.id} pedido={pedido} onUpdate={fetchPedidosActivos} />
                        ))}
                    </ul>
                 )
            )}
          </div>
        );

      case 'historial':
        // HistorialViajes has its own fetching logic
        return <HistorialViajes />;

      default:
        return <p>Vista no encontrada.</p>;
    }
  };
  // --- Fin Renderizado Contenido ---

  // --- Renderizado Condicional General (Auth Check - sin cambios) ---
  // Initial check while auth state is being determined
  if (!user) {
      // You might want a more specific loading state here before user is resolved
      return <div>Cargando información de usuario...</div>;
  }

   // Deny access if user is authenticated but not a conductor
   if (user.rol?.nombre !== 'conductor') {
       // Redirect to login or show an access denied message
       // Depending on your app flow, maybe call logout() here or in PrivateRoute
        return <p>Acceso denegado. Solo conductores pueden ver este panel.</p>; // Or navigate('/login')
   }


  // --- Renderizado del Layout del Dashboard (sin cambios) ---
  return (
    <div className={layoutStyles.dashboardContainer}>
      {/* Cabecera */}
      <Header title={`Panel de Conductor`}/>

      {/* Menú de Navegación */}
      <nav className={layoutStyles.navigation}>
         {/* Update vistaActual on button clicks */}
         <button onClick={() => setVistaActual('inicio')} className={`${layoutStyles.navButton} ${vistaActual === 'inicio' ? layoutStyles.navButtonActive : ''}`}> Inicio </button>
         <button onClick={() => setVistaActual('pedidos')} className={`${layoutStyles.navButton} ${vistaActual === 'pedidos' ? layoutStyles.navButtonActive : ''}`}> Pedidos Asignados </button>
         <button onClick={() => setVistaActual('historial')} className={`${layoutStyles.navButton} ${vistaActual === 'historial' ? layoutStyles.navButtonActive : ''}`}> Historial de Viajes </button>
      </nav>

      {/* Área Principal que cambia según la vista */}
      <main className={layoutStyles.mainContent}>
        {renderVistaPrincipal()}
      </main>
    </div>
  );
};

export default ConductorDashboard;