// frontend/src/App.tsx
import React from 'react';
// Remove BrowserRouter as Router and Navigate from here
import { Route, Routes, Navigate } from 'react-router-dom';

import Login from './components/Auth/Login';
import ConductorDashboard from './components/Conductor/ConductorDashboard';
import HistorialViajes from './components/Conductor/HistorialViajes';
import { useAuth } from './context/AuthContext';
// Remove AuthProvider from here
import ClienteDashboard from './components/Cliente/ClienteDashboard';
import JefeEmpresaDashboard from './components/JefeEmpresa/JefeEmpresaDashboard';
import JefeInventarioDashboard from './components/JefeInventario/JefeInventarioDashboard';
import ConfirmacionClienteForm from './components/Public/ConfirmacionClienteForm';


// Componente PrivateRoute (keeps useAuth, which is fine)
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  // console.log('[PrivateRoute] Estado de autenticación:', isAuthenticated); // Log si aún lo necesitas
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/jefe-inventario/dashboard"
          element={<PrivateRoute><JefeInventarioDashboard /></PrivateRoute>}
        />
        <Route
          path="/confirmar/:token"
          element={<ConfirmacionClienteForm />}
        />
        <Route
           path="/conductor/dashboard"
           element={<PrivateRoute><ConductorDashboard /></PrivateRoute>}
         />
        {/* Remove the duplicate /historial route if HistorialViajes is only within ConductorDashboard */}
        {/* <Route
          path="/historial"
          element={<PrivateRoute><HistorialViajes /></PrivateRoute>}
        /> */}
        <Route
          path="/cliente/dashboard"
          element={<PrivateRoute><ClienteDashboard /></PrivateRoute>}
        />
        <Route
          path="/jefe/dashboard"
          element={<PrivateRoute><JefeEmpresaDashboard /></PrivateRoute>}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
  );
}
export default App;