// frontend/src/services/usuarios.ts
import api from './apiConfig';
// Importa todos los tipos necesarios para este archivo
import { UserData, RolData, UsuarioInputData, GetUsuariosFilters } from '../types/pedido'; // Ajusta ruta

// !! VERIFICA ESTOS IDs con tu base de datos !! (O considera obtenerlos de getRoles)
const ROL_ID_CONDUCTOR = 1;
const ROL_ID_CLIENTE = 2;

export const getUsuarios = async (filtros?: GetUsuariosFilters): Promise<UserData[]> => {
    console.log("[API getUsuarios] Fetching with filters:", filtros);
    try {
        // Usamos 'any' temporalmente y la aserción para el problema de TS que tenías
        const response = await api.get<any>('/gestion/usuarios/', { params: filtros || {} });
        const dataValidada = response.data as UserData[];
        // Verifica si falta el campo clave (solo como advertencia)
        if (Array.isArray(dataValidada) && dataValidada.length > 0 && !dataValidada[0].hasOwnProperty('vehiculo_asignado')) {
             console.warn("[API getUsuarios] ADVERTENCIA: El primer usuario recibido NO tiene 'vehiculo_asignado'. Revisa backend serializer.");
        }
        return dataValidada;
    } catch (error: any) {
        console.error("[API getUsuarios] Error fetching:", error.response?.data || error.message);
        throw error;
    }
};

export const getConductores = async (): Promise<UserData[]> => {
    console.log(`[API getConductores] Buscando rol ID: ${ROL_ID_CONDUCTOR}`);
    return getUsuarios({ rol: ROL_ID_CONDUCTOR }); // Reutiliza getUsuarios
};

export const getClientes = async (): Promise<UserData[]> => {
    console.log(`[API getClientes] Buscando rol ID: ${ROL_ID_CLIENTE}`);
    return getUsuarios({ rol: ROL_ID_CLIENTE }); // Reutiliza getUsuarios
};

export const createUsuario = async (usuarioData: UsuarioInputData): Promise<UserData> => {
    const dataToSend = { ...usuarioData, vehiculo_asignado_id: usuarioData.vehiculo_asignado_id || null };
    console.log("[API createUsuario] Enviando:", dataToSend);
    try {
        const response = await api.post<UserData>('/gestion/usuarios/', dataToSend);
        return response.data;
    } catch (error) { console.error("[API createUsuario] Error:", error); throw error; }
};

export const updateUsuario = async (id: number, usuarioData: Partial<UsuarioInputData>): Promise<UserData> => {
    const dataToSend = { ...usuarioData, ...(usuarioData.hasOwnProperty('vehiculo_asignado_id') && { vehiculo_asignado_id: usuarioData.vehiculo_asignado_id || null }) };
    delete dataToSend.password;
    delete dataToSend.cedula;
    console.log(`[API updateUsuario] Enviando PATCH para ID: ${id}`, dataToSend);
    try {
        const response = await api.patch<UserData>(`/gestion/usuarios/${id}/`, dataToSend);
        return response.data;
    } catch (error) { console.error("[API updateUsuario] Error:", error); throw error; }
};

export const deleteUsuario = async (id: number): Promise<void> => {
     console.log(`[API deleteUsuario] Eliminando ID: ${id}`);
     try { await api.delete(`/gestion/usuarios/${id}/`); }
     catch (error) { console.error("[API deleteUsuario] Error:", error); throw error; }
};

// Mantenemos getRoles aquí o creamos services/roles.ts
export const getRoles = async (): Promise<RolData[]> => {
    console.log("[API getRoles] Fetching roles from backend...");
    try {
        // ¡Asegúrate que este endpoint exista en tu backend!
        const response = await api.get<RolData[]>('/gestion/roles/');
        return response.data;
    } catch (error: any) {
        console.error("[API getRoles] Error fetching:", error.response?.data || error.message);
        // Devuelve array vacío en caso de error para no romper selects
        return [];
    }
};