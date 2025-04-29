// frontend/src/services/auth.ts
import api from './apiConfig';
import { UserData } from '../types/pedido'; // Ajusta ruta si es necesario

// Interfaz específica para la respuesta de login
interface LoginResponseData {
    access: string;
    refresh?: string;
    user: UserData;
}

export const loginUser = async (credentials: any): Promise<LoginResponseData> => {
    console.log("[API loginUser] Attempting login...");
    try {
        const response = await api.post<LoginResponseData>('/auth/login/', credentials);
        console.log("[API loginUser] Login successful.");
        return response.data;
    } catch (error) {
        console.error("[API loginUser] Login failed:", error);
        throw error; // Re-lanza para manejo en componente
    }
};

// Aquí podrías añadir funciones para refrescar token, verificar token, etc. si las necesitas.