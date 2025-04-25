// frontend/src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import api from '../services/api'; // Asegúrate que la ruta sea correcta
import { useNavigate } from 'react-router-dom';

// --- INICIO: Definición de Tipos (Asegúrate que coincidan con tu backend) ---

// Define cómo es un Rol (según tu RolSerializer)
interface RolData {
  id: number;
  nombre: string;
}

// Define cómo es una Empresa (según tu EmpresaSimpleSerializer)
interface EmpresaData {
  id: number;
  nombre: string;
}

// Define cómo son los datos del Usuario (debe coincidir con UsuarioSerializer)
interface UserData {
  id: number;
  username: string | null;
  email: string | null;
  nombre: string | null;
  apellido: string | null;
  cedula: string; // Asumiendo que siempre viene
  rol: RolData | null; // Puede ser null si no tiene rol
  empresa: EmpresaData | null; // Puede ser null si no tiene empresa
  is_active?: boolean; // Campo opcional, según tu serializer
  is_staff?: boolean;  // Campo opcional, según tu serializer
}

// Define las propiedades que expone el contexto
interface AuthContextProps {
  token: string | null;
  user: UserData | null; // <-- Usa la interfaz UserData
  login: (token: string, userData: UserData) => void; // <-- Usa la interfaz UserData
  logout: () => void;
  isAuthenticated: boolean;
}

// --- FIN: Definición de Tipos ---


// Crear el contexto
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Propiedades esperadas por el Provider
interface AuthProviderProps {
    children: ReactNode;
}

// --- Componente Provider ---
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<UserData | null>(null); // Usa la interfaz UserData
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate(); // Para la redirección

  useEffect(() => {
    console.log("[AuthContext] Verificando localStorage al montar");
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser && storedUser !== 'undefined') { // Verifica que no sea "undefined"
        console.log("[AuthContext] Token y usuario encontrados");
        try {
            const parsedUser: UserData = JSON.parse(storedUser);
            console.log("[AuthContext] Usuario parseado:", parsedUser);
            // Validación básica del usuario parseado
            if (parsedUser && parsedUser.id && parsedUser.cedula) {
                setToken(storedToken);
                setUser(parsedUser);
                setIsAuthenticated(true);
                console.log("[AuthContext] Estado inicial establecido desde localStorage");
            } else {
                console.warn("[AuthContext] Usuario en localStorage inválido, limpiando.");
                throw new Error("Invalid user data in localStorage"); // Lanza error para ir al catch
            }
        } catch (e) {
            console.error("[AuthContext] Error parseando usuario desde localStorage, limpiando:", e);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
        }
    } else {
        console.log("[AuthContext] No se encontró token o usuario válido en localStorage");
        setToken(null); // Asegúrate que el estado quede limpio
        setUser(null);
        setIsAuthenticated(false);
    }
  }, []); // Array vacío para que se ejecute solo una vez al montar

  // Efecto para actualizar la cabecera de Axios cuando el token cambia
  useEffect(() => {
    if (token) {
        console.log("[AuthContext] Token detectado, añadiendo a cabeceras Axios.");
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // Podríamos setear isAuthenticated aquí también, pero login/logout ya lo hacen
        // setIsAuthenticated(true);
    } else {
        console.log("[AuthContext] No hay token, eliminando cabecera Axios.");
        delete api.defaults.headers.common['Authorization'];
        // Aseguramos que si no hay token, no esté autenticado
        // setIsAuthenticated(false);
    }
  }, [token]); // Se ejecuta cada vez que el estado 'token' cambia

  // Función para manejar el inicio de sesión
  const login = (newToken: string, userData: UserData) => { // Espera UserData completa
    console.log("[AuthContext] Ejecutando login con userData:", userData);
    try {
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true); // Establece autenticado
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData)); // Guarda objeto completo
        console.log("[AuthContext] Usuario y token guardados, navegando a dashboard");
        navigate('/dashboard'); // Redirige AHORA que el estado está actualizado
    } catch(e){
        console.error("[AuthContext] Error al guardar en localStorage:", e);
    }
  };

  // Función para manejar el cierre de sesión
  const logout = () => {
    console.log("[AuthContext] Ejecutando logout");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false); // Establece no autenticado
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log("[AuthContext] Logout completado, navegando a login");
    navigate('/login'); // Redirige
  };


  console.log("[AuthContext] Renderizando Provider con estado:", { token, user, isAuthenticated });
  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};