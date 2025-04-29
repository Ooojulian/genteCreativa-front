// frontend/src/services/transporte.ts
import api from './apiConfig'; // Importa la instancia configurada de Axios
import axios from 'axios'; // Necesario para submitConfirmacionCliente
// Importa todos los tipos necesarios para este módulo
import {
    TipoVehiculoData,
    VehiculoInputData,
    VehiculoData,
    ConfirmacionClientePayload,
    ConfirmacionClienteResponse,
    QRDataResponse,
    PruebaEntregaData,
    TipoFotoUpload,
    PedidoEnLista,
    PedidoDetalleData,
    PedidoConductorData,
    JefeNuevoPedidoDataCompleto,
    NuevoPedidoClienteData,
    PedidoData, // Asegúrate que PedidoData esté definido en types/pedido.ts si lo usas
    PedidoUpdateData,
} from '../types/pedido'; // Ajusta la ruta si es necesario

// --- Funciones Tipos Vehiculo ---

export const getTiposVehiculo = async (): Promise<TipoVehiculoData[]> => {
    console.log("[API getTiposVehiculo] Fetching...");
    try {
        const response = await api.get<TipoVehiculoData[]>('/transporte/tipos-vehiculo/');
        console.log("[API getTiposVehiculo] Tipos recibidos:", response.data.length);
        return response.data;
    } catch (error: any) {
        console.error("[API getTiposVehiculo] Error fetching:", error.response?.data || error.message);
        throw error; // Re-lanza para manejo en componente
    }
};

export const createTipoVehiculo = async (tipoData: Omit<TipoVehiculoData, 'id'>): Promise<TipoVehiculoData> => {
    console.log("[API createTipoVehiculo] Creando:", tipoData);
    try {
        const response = await api.post<TipoVehiculoData>('/transporte/tipos-vehiculo/', tipoData);
        console.log("[API createTipoVehiculo] Creado:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[API createTipoVehiculo] Error creando:", error.response?.data || error.message);
        throw error;
    }
};

export const updateTipoVehiculo = async (id: number, tipoData: Partial<Omit<TipoVehiculoData, 'id'>>): Promise<TipoVehiculoData> => {
    console.log(`[API updateTipoVehiculo] Actualizando ID: ${id}`, tipoData);
    try {
        const response = await api.patch<TipoVehiculoData>(`/transporte/tipos-vehiculo/${id}/`, tipoData);
        console.log(`[API updateTipoVehiculo] Actualizado ID: ${id}`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`[API updateTipoVehiculo] Error actualizando ID: ${id}:`, error.response?.data || error.message);
        throw error;
    }
};

export const deleteTipoVehiculo = async (id: number): Promise<void> => {
    console.log(`[API deleteTipoVehiculo] Eliminando ID: ${id}`);
    try {
        await api.delete(`/transporte/tipos-vehiculo/${id}/`);
        console.log(`[API deleteTipoVehiculo] Eliminado ID: ${id}`);
    } catch (error: any) {
        console.error(`[API deleteTipoVehiculo] Error eliminando ID: ${id}:`, error.response?.data || error.message);
        if (error.response?.status === 409 || error.response?.data?.detail?.includes('protected')) {
             throw new Error(`No se puede eliminar el tipo ID ${id} porque está siendo usado por vehículos.`);
        }
        throw error;
    }
};

// --- Funciones Vehiculo ---

export const getVehiculos = async (): Promise<VehiculoData[]> => {
    console.log("[API getVehiculos] Fetching...");
    try {
        const response = await api.get<VehiculoData[]>('/transporte/vehiculos/');
        console.log("[API getVehiculos] Vehículos recibidos:", response.data.length);
        return response.data;
    } catch (error: any) {
        console.error("[API getVehiculos] Error fetching:", error.response?.data || error.message);
        throw error;
    }
};

export const createVehiculo = async (vehiculoData: VehiculoInputData): Promise<VehiculoData> => {
    const dataToSend = { ...vehiculoData, year: vehiculoData.year ? Number(vehiculoData.year) : null };
    console.log("[API createVehiculo] Creando:", dataToSend);
    try {
        const response = await api.post<VehiculoData>('/transporte/vehiculos/', dataToSend);
        console.log("[API createVehiculo] Creado:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[API createVehiculo] Error creando:", error.response?.data || error.message);
        throw error;
    }
};

export const updateVehiculo = async (id: number, vehiculoData: Partial<VehiculoInputData>): Promise<VehiculoData> => {
     const dataToSend = { ...vehiculoData, ...(vehiculoData.hasOwnProperty('year') && { year: vehiculoData.year ? Number(vehiculoData.year) : null }) };
    // delete dataToSend.placa; // Descomenta si no se permite editar placa
    console.log(`[API updateVehiculo] Actualizando ID: ${id}`, dataToSend);
    try {
        const response = await api.patch<VehiculoData>(`/transporte/vehiculos/${id}/`, dataToSend);
        console.log(`[API updateVehiculo] Actualizado ID: ${id}`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`[API updateVehiculo] Error actualizando ID: ${id}:`, error.response?.data || error.message);
        throw error;
    }
};

export const deleteVehiculo = async (id: number): Promise<void> => {
    console.log(`[API deleteVehiculo] Eliminando ID: ${id}`);
    try {
        await api.delete(`/transporte/vehiculos/${id}/`);
        console.log(`[API deleteVehiculo] Eliminado ID: ${id}`);
    } catch (error: any) {
        console.error(`[API deleteVehiculo] Error eliminando ID: ${id}:`, error.response?.data || error.message);
        throw error;
    }
};

// --- Funciones Confirmación Cliente / QR ---

export const submitConfirmacionCliente = async (token: string, data: ConfirmacionClientePayload): Promise<ConfirmacionClienteResponse> => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    const url = `${API_BASE_URL}/transporte/confirmar/${token}/`;
    try {
        console.log(`[API submitConfirmacionCliente] Enviando POST a ${url} SIN token Auth`);
        const response = await axios.post<ConfirmacionClienteResponse>(url, data); // Usa axios base
        console.log(`[API submitConfirmacionCliente] Éxito para Token ${token}`);
        return response.data;
    } catch (error: any) {
        console.error(`[API submitConfirmacionCliente] Error para Token ${token}:`, error.response?.data || error.message);
        const responseError = error.response?.data || { detail: error.message || "Error desconocido" };
        throw { response: { data: responseError } };
    }
};

export const getQRData = async (pedidoId: number): Promise<QRDataResponse> => {
    try {
        const response = await api.get<QRDataResponse>(`/transporte/pedidos/${pedidoId}/qr_data/`);
        console.log(`[API getQRData] URL recibida para Pedido ${pedidoId}:`, response.data.confirmation_url);
        return response.data;
    } catch (error: any) {
        console.error(`[API getQRData] Error para Pedido ${pedidoId}:`, error.response?.data || error.message);
        throw error;
    }
};

// --- Funciones Pruebas Entrega ---

export const uploadPruebaEntrega = async (pedidoId: number, tipoFoto: TipoFotoUpload, foto: File): Promise<PruebaEntregaData> => {
    const formData = new FormData();
    formData.append('tipo_foto', tipoFoto);
    formData.append('foto', foto);
    try {
        const response = await api.post<PruebaEntregaData>(
            `/transporte/pedidos/${pedidoId}/subir_prueba/`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        console.log(`[API uploadPruebaEntrega] Éxito para Pedido ${pedidoId}, TipoFoto ${tipoFoto}`);
        return response.data;
    } catch (error: any) {
        console.error(`[API uploadPruebaEntrega] Error para Pedido ${pedidoId}, TipoFoto ${tipoFoto}:`, error.response?.data || error.message);
        throw error;
    }
};

// --- Funciones Pedido (Cliente) ---

export const createPedidoTransporteCliente = async (pedidoData: NuevoPedidoClienteData): Promise<any> => {
    // ¡OJO! Esto sigue apuntando a 'simple-test'. Cambia a la URL real cuando esté lista.
    // La URL real podría ser '/transporte/pedidos/crear/' o similar.
    console.log("[API createPedidoCliente] Enviando datos a endpoint SIMPLE TEST:", pedidoData);
    try {
        const response = await api.post<any>('/transporte/simple-test/', pedidoData);
        console.log("[API createPedidoCliente] Respuesta de endpoint SIMPLE TEST:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[API createPedidoCliente] Error:", error.response?.data || error.message);
        throw error;
    }
};

export const getHistorialMesCliente = async (year: number, month: number): Promise<PedidoDetalleData[]> => {
    console.log(`[API getHistorialCliente] Fetching history for ${year}-${month}`);
    try {
        const response = await api.get<PedidoDetalleData[]>('/transporte/mi_historial/', { params: { year, month } });
        console.log(`[API getHistorialCliente] History received for ${year}-${month}`, response.data.length);
        return response.data;
    } catch (error: any) {
        console.error(`[API getHistorialCliente] Error fetching history for ${year}-${month}:`, error.response?.data || error.message);
        throw error;
    }
};

// --- Funciones Pedido (Conductor) ---

export const getPedidos = async (): Promise<PedidoConductorData[]> => {
    console.log("[API getPedidosConductor] Fetching active orders...");
    try {
        const response = await api.get<PedidoConductorData[]>('/transporte/mis_pedidos/');
        console.log("[API getPedidosConductor] Active orders received:", response.data.length);
        return response.data;
    } catch (error: any) {
        console.error("[API getPedidosConductor] Error fetching:", error.response?.data || error.message);
        throw error;
    }
};

export const iniciarPedido = async (pedidoId: number): Promise<PedidoData> => {
    console.log(`[API iniciarPedido] Iniciando pedido ID: ${pedidoId}`);
    try {
        // Asegúrate que PedidoData sea el tipo correcto de respuesta para esta acción
        const response = await api.patch<PedidoData>(`/transporte/pedidos/${pedidoId}/`, { iniciar: 'confirmado' });
        console.log(`[API iniciarPedido] Pedido ${pedidoId} iniciado.`);
        return response.data;
    } catch (error: any) {
        console.error(`[API iniciarPedido] Error iniciando pedido ${pedidoId}:`, error.response?.data || error.message);
        throw error;
    }
};

export const finalizarPedido = async (pedidoId: number): Promise<PedidoData> => {
    console.log(`[API finalizarPedido] Finalizando pedido ID: ${pedidoId}`);
    try {
        // Asegúrate que PedidoData sea el tipo correcto de respuesta
        const response = await api.patch<PedidoData>(`/transporte/pedidos/${pedidoId}/`, { finalizar: 'confirmado' });
         console.log(`[API finalizarPedido] Pedido ${pedidoId} finalizado.`);
        return response.data;
    } catch (error: any) {
        console.error(`[API finalizarPedido] Error finalizando pedido ${pedidoId}:`, error.response?.data || error.message);
        throw error;
    }
};

export const getHistorialMesConductor = async (year: number, month: number): Promise<PedidoDetalleData[]> => {
     console.log(`[API getHistorialConductor] Fetching history for ${year}-${month}`);
    try {
        const response = await api.get<PedidoDetalleData[]>('/transporte/historial_mes_conductor/', { params: { year, month } });
        console.log(`[API getHistorialConductor] History received for ${year}-${month}`, response.data.length);
        return response.data;
    } catch (error: any) {
        console.error(`[API getHistorialConductor] Error fetching history for ${year}-${month}:`, error.response?.data || error.message);
        throw error;
    }
};

// --- Funciones Pedido (Jefe/Admin) ---

export const getPedidosJefe = async (): Promise<PedidoEnLista[]> => {
     console.log("[API getPedidosJefe] Fetching list...");
    try {
        const response = await api.get<PedidoEnLista[]>('/transporte/pedidos/');
        console.log("[API getPedidosJefe] List received:", response.data.length);
        return response.data;
    } catch (error: any) {
        console.error("[API getPedidosJefe] Error fetching list:", error.response?.data || error.message);
        throw error;
    }
};

export const getPedidoDetalle = async (id: number): Promise<PedidoDetalleData> => {
    console.log(`[API getPedidoDetalle] Fetching details for ID: ${id}`);
    try {
        const response = await api.get<PedidoDetalleData>(`/transporte/pedidos/${id}/`);
        console.log(`[API getPedidoDetalle] Details received for ID: ${id}`);
        return response.data;
    } catch (error: any) {
        console.error(`[API getPedidoDetalle] Error fetching details for ID: ${id}:`, error.response?.data || error.message);
        throw error;
    }
};

export const createPedidoJefe = async (pedidoData: JefeNuevoPedidoDataCompleto): Promise<PedidoData> => {
    console.log("[API createPedidoJefe] Creando pedido:", pedidoData);
    try {
        // Asegúrate que PedidoData sea el tipo correcto de respuesta
        const response = await api.post<PedidoData>('/transporte/pedidos/', pedidoData);
        console.log("[API createPedidoJefe] Pedido creado:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[API createPedidoJefe] Error creando pedido:", error.response?.data || error.message);
        throw error;
    }
};

export const updatePedido = async (id: number, pedidoData: Partial<PedidoUpdateData>): Promise<PedidoData> => {
    console.log(`[API updatePedido] Actualizando ID: ${id}`, pedidoData);
    try {
        // Asegúrate que PedidoData sea el tipo correcto de respuesta
        const response = await api.patch<PedidoData>(`/transporte/pedidos/${id}/`, pedidoData);
        console.log(`[API updatePedido] Pedido actualizado ID: ${id}`);
        return response.data;
    } catch (error: any) {
        console.error(`[API updatePedido] Error actualizando ID: ${id}:`, error.response?.data || error.message);
        throw error;
    }
};

export const deletePedido = async (id: number): Promise<void> => {
    console.log(`[API deletePedido] Eliminando ID: ${id}`);
    try {
        await api.delete(`/transporte/pedidos/${id}/`);
        console.log(`[API deletePedido] Pedido eliminado ID: ${id}`);
    } catch (error: any) {
        console.error(`[API deletePedido] Error eliminando ID: ${id}:`, error.response?.data || error.message);
        throw error;
    }
};

export const getHistorialGeneral = async (year: number, month: number): Promise<PedidoDetalleData[]> => {
    console.log(`[API getHistorialGeneral] Fetching history for ${year}-${month}`);
    try {
        const response = await api.get<PedidoDetalleData[]>('/transporte/historial_mes/', { params: { year, month } });
        console.log(`[API getHistorialGeneral] History received for ${year}-${month}`, response.data.length);
        return response.data;
    } catch (error: any) {
        console.error(`[API getHistorialGeneral] Error fetching history for ${year}-${month}:`, error.response?.data || error.message);
        throw error;
    }
};

export const getRemisionPDF = async (pedidoId: number): Promise<Blob> => {
    console.log(`[API getRemisionPDF] Solicitando PDF para Pedido ID: ${pedidoId}`);
    try {
        const response = await api.get(`/transporte/pedidos/${pedidoId}/remision/`, {
            responseType: 'blob',
        });
        if (response.data instanceof Blob && (response.data.type === 'application/pdf' || response.data.type === 'application/octet-stream')) {
             console.log("[API getRemisionPDF] Blob recibido:", response.data.size, response.data.type);
            return response.data;
        } else {
             let errorMsg = 'La respuesta del backend no fue un archivo PDF válido.';
            if (response.data instanceof Blob) { try { errorMsg = await response.data.text(); } catch (e) {} }
            throw new Error(errorMsg);
        }
    } catch (error: any) {
        console.error(`[API getRemisionPDF] Error para Pedido ID: ${pedidoId}:`, error);
        const detail = error.response?.data?.detail || error.message || 'Error desconocido al obtener la remisión.';
        throw new Error(detail);
    }
};

// --- Función de prueba (si aún la necesitas) ---
/*
export const postSimplePedidoTest = async (payload: any): Promise<any> => {
    console.log('[API postSimplePedidoTest] Enviando prueba simple POST a /transporte/simple-test/', payload);
    try {
        const response = await api.post<any>('/transporte/simple-test/', payload);
        console.log('[API postSimplePedidoTest] Respuesta de prueba simple:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('[API postSimplePedidoTest] Error:', error.response?.data || error.message);
        throw error;
    }
};
*/