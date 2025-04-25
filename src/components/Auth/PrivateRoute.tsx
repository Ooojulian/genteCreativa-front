// src/components/Auth/PrivateRoute.tsx <--- ¡Asegúrate que el nombre sea .tsx!

import React from 'react';
// Importa Navigate de react-router-dom v6
import { Navigate } from 'react-router-dom';
// Ajusta la ruta a tu AuthContext si es necesario
import { useAuth } from '../../context/AuthContext';

// Props para el componente, usando ReactNode para children
interface PrivateRouteProps {
    children: React.ReactNode; // O puedes usar JSX.Element si prefieres
}

// Define el componente funcional usando la interfaz
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // Obtiene el estado de autenticación del contexto
  const { isAuthenticated } = useAuth();
  console.log('[PrivateRoute] Check - isAuthenticated:', isAuthenticated); // Log útil

  // Lógica de React Router v6
  if (!isAuthenticated) {
    // Si no está autenticado, redirige al login usando el componente Navigate
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, simplemente renderiza los componentes hijos envueltos
  return <>{children}</>; // Puedes usar <>{children}</> o simplemente children
};

export default PrivateRoute;