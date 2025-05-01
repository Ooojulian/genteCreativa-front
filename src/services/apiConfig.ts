// frontend/src/services/apiConfig.ts
import axios from 'axios';

// 1. Crear instancia de Axios
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api', // Usa variable de entorno o default
    timeout: 30000, // Timeout opcional
});

// 2. Configurar Interceptors (como los tenías en api.ts)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    }, (error) => {
        console.error('Axios Request Error:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('Axios Response Error:', error.response || error.message || error);
        if (error.response && error.response.status === 401) {
            console.error('ERROR 401 - Token inválido o expirado. Considera desloguear.');
            // Aquí podrías llamar a una función global de logout si la tienes accesible
            // O emitir un evento para que AuthContext reaccione
            // Ejemplo simple: redirigir si no está ya en login
            // if (!window.location.pathname.includes('/login')) {
            //    window.location.href = '/login';
            // }
        }
        return Promise.reject(error);
    }
);

// 3. Exportar la instancia configurada
export default api;