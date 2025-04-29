// frontend/src/services/bodegaje.ts
import api from './apiConfig'; // Importa la instancia configurada de Axios
import {
    InventarioDataOutput,
    EntradaInventarioPayload,
    SalidaInventarioPayload,
    InventarioFiltrosAPI,
    ProductoDataInput,
    ProductoDataOutput,
    UbicacionDataInput,
    UbicacionDataOutput,
    MovimientoInventarioData,
    HistorialInventarioFiltros,
    // Asegúrate de que InventarioInputData y InventarioUpdateInput estén en types/pedido.ts si usas las funciones comentadas
    // InventarioInputData,
    // InventarioUpdateInput
} from '../types/pedido'; // Ajusta la ruta si es necesario

// --- Funciones de Inventario ---

// Obtener inventario para Jefes (con filtros)
export const getInventarioJefe = async (filtros?: InventarioFiltrosAPI): Promise<InventarioDataOutput[]> => {
    console.log("[API getInventarioJefe] Fetching con filtros:", filtros);
    try {
       const response = await api.get<InventarioDataOutput[]>('/bodegaje/inventario/', { params: filtros || {} });
       console.log("[API getInventarioJefe] Inventario recibido:", response.data.length);
       return response.data;
   } catch (error: any) {
       console.error("[API getInventarioJefe] Error fetching:", error.response?.data || error.message);
       throw error;
   }
};

// Obtener inventario para el Cliente autenticado
export const getInventarioEmpresa = async (): Promise<InventarioDataOutput[]> => {
    console.log("[API getInventarioEmpresa] Fetching for current client...");
    try {
        // El backend filtra por el usuario/empresa basado en el token JWT
        const response = await api.get<InventarioDataOutput[]>('/bodegaje/inventario/');
        console.log("[API getInventarioEmpresa] Inventario recibido:", response.data.length);
        return response.data;
    } catch(error: any){
        console.error("[API getInventarioEmpresa] Error fetching:", error);
        throw error;
    }
 };

// Registrar una entrada de inventario
export const registrarEntradaInventario = async (payload: EntradaInventarioPayload): Promise<InventarioDataOutput> => {
    console.log("[API registrarEntradaInventario] Enviando:", payload);
    try {
        const response = await api.post<InventarioDataOutput>('/bodegaje/inventario/entrada/', payload);
        console.log("[API registrarEntradaInventario] Respuesta:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[API registrarEntradaInventario] Error:", error.response?.data || error.message);
        throw error;
    }
};

// Registrar una salida de inventario
export const registrarSalidaInventario = async (payload: SalidaInventarioPayload): Promise<{ detail?: string; inventario?: InventarioDataOutput }> => {
    console.log("[API registrarSalidaInventario] Enviando:", payload);
    try {
        const response = await api.post<{ detail?: string; inventario?: InventarioDataOutput }>('/bodegaje/inventario/salida/', payload);
        console.log("[API registrarSalidaInventario] Respuesta:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("[API registrarSalidaInventario] Error:", error.response?.data || error.message);
        throw error;
    }
};

// Exportar inventario filtrado a Excel
export const exportarInventarioExcel = async (filtros?: InventarioFiltrosAPI): Promise<Blob> => {
    console.log("[API exportarInventarioExcel] Solicitando Excel con filtros:", filtros);
    try {
        const response = await api.get('/bodegaje/inventario/exportar-excel/', {
            params: filtros || {},
            responseType: 'blob',
        });
        if (response.data instanceof Blob && (response.data.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || response.data.type === 'application/octet-stream')) {
             console.log("[API exportarInventarioExcel] Blob recibido:", response.data.size, response.data.type);
            return response.data;
        } else {
             let errorMsg = 'La respuesta del backend no fue un archivo Excel válido.';
            if (response.data instanceof Blob) { try { errorMsg = await response.data.text(); } catch (e) {} }
            throw new Error(errorMsg);
        }
    } catch (error: any) {
        console.error("[API exportarInventarioExcel] Error:", error);
        // Simplificado para devolver el mensaje de error directamente si es posible
        const detail = error.response?.data?.detail || error.message || 'Error desconocido al generar el Excel.';
        throw new Error(detail);
    }
};

// Obtener inventario filtrando por ID de EMPRESA específico (usado en creación pedido salida)
export const getInventarioPorEmpresaId = async (empresaId: number): Promise<InventarioDataOutput[]> => {
    console.log(`[API getInventarioPorEmpresaId] Fetching inventario para Empresa ID: ${empresaId}`);
    try {
        // Asegúrate que el backend filterset use 'empresa' y no 'empresa_id' como query param
        const response = await api.get<InventarioDataOutput[]>('/bodegaje/inventario/', {
            params: { empresa: empresaId } // Usa 'empresa' si así lo espera el FilterSet
        });
        console.log(`[API getInventarioPorEmpresaId] Inventario recibido para Empresa ${empresaId}:`, response.data.length);
        return response.data;
    } catch (error: any) {
        console.error(`[API getInventarioPorEmpresaId] Error fetching inventario Empresa ${empresaId}:`, error);
        throw error;
    }
};

// --- Funciones de Productos ---

export const getProductos = async (): Promise<ProductoDataOutput[]> => {
    try {
        const response = await api.get<ProductoDataOutput[]>('/bodegaje/productos/');
        return response.data;
    } catch(error){ console.error("[API getProductos]", error); throw error; }
};

export const createProducto = async (data: ProductoDataInput): Promise<ProductoDataOutput> => {
    try {
        const response = await api.post<ProductoDataOutput>('/bodegaje/productos/', data);
        return response.data;
    } catch(error){ console.error("[API createProducto]", error); throw error; }
};

export const updateProducto = async (id: number, data: Partial<ProductoDataInput>): Promise<ProductoDataOutput> => {
    try {
        const response = await api.patch<ProductoDataOutput>(`/bodegaje/productos/${id}/`, data);
        return response.data;
    } catch(error){ console.error("[API updateProducto]", error); throw error; }
};

export const deleteProducto = async (id: number): Promise<void> => {
    try {
        await api.delete(`/bodegaje/productos/${id}/`);
    } catch(error){ console.error("[API deleteProducto]", error); throw error; }
};

// --- Funciones de Ubicaciones ---

export const getUbicaciones = async (): Promise<UbicacionDataOutput[]> => {
    try {
        const response = await api.get<UbicacionDataOutput[]>('/bodegaje/ubicaciones/');
        return response.data;
    } catch(error){ console.error("[API getUbicaciones]", error); throw error; }
};

export const createUbicacion = async (data: UbicacionDataInput): Promise<UbicacionDataOutput> => {
    try {
        const response = await api.post<UbicacionDataOutput>('/bodegaje/ubicaciones/', data);
        return response.data;
    } catch(error){ console.error("[API createUbicacion]", error); throw error; }
};

export const updateUbicacion = async (id: number, data: Partial<UbicacionDataInput>): Promise<UbicacionDataOutput> => {
    try {
        const response = await api.patch<UbicacionDataOutput>(`/bodegaje/ubicaciones/${id}/`, data);
        return response.data;
    } catch(error){ console.error("[API updateUbicacion]", error); throw error; }
};

export const deleteUbicacion = async (id: number): Promise<void> => {
    try {
        await api.delete(`/bodegaje/ubicaciones/${id}/`);
    } catch(error){ console.error("[API deleteUbicacion]", error); throw error; }
};

// --- Funciones de Historial Inventario ---

export const getHistorialInventario = async (filtros?: HistorialInventarioFiltros): Promise<MovimientoInventarioData[]> => {
    try {
        const response = await api.get<MovimientoInventarioData[]>('/bodegaje/historial/', { params: filtros || {} });
        return response.data;
    } catch(error){ console.error("[API getHistorialInventario]", error); throw error; }
};

// --- Funciones de CRUD directo de Inventario (COMENTADAS - si ya no las usas) ---
/*
export const createInventario = async (data: InventarioDataInput): Promise<InventarioDataOutput> => {
    try {
        const response = await api.post<InventarioDataOutput>('/bodegaje/inventario/', data);
        return response.data;
    } catch(error){ console.error("[API createInventario]", error); throw error; }
};

export const updateInventario = async (id: number, data: Partial<InventarioUpdateInput>): Promise<InventarioDataOutput> => {
    try {
        const response = await api.patch<InventarioDataOutput>(`/bodegaje/inventario/${id}/`, data);
        return response.data;
    } catch(error){ console.error("[API updateInventario]", error); throw error; }
};

export const deleteInventario = async (id: number): Promise<void> => {
    try {
        await api.delete(`/bodegaje/inventario/${id}/`);
    } catch(error){ console.error("[API deleteInventario]", error); throw error; }
};
*/