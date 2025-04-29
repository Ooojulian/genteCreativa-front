// frontend/src/services/empresas.ts
import api from './apiConfig';
import { EmpresaData, EmpresaDataInput, EmpresaFiltros } from '../types/pedido'; // Ajusta ruta

export const getEmpresas = async (filtros?: EmpresaFiltros): Promise<EmpresaData[]> => {
    console.log("[API getEmpresas] Fetching con filtros:", filtros);
    try {
        const response = await api.get<EmpresaData[]>('/gestion/empresas/', { params: filtros || {} });
        return response.data;
    } catch (error: any) { console.error("[API getEmpresas] Error fetching:", error); throw error; }
};

export const createEmpresa = async (empresaData: EmpresaDataInput): Promise<EmpresaData> => {
    console.log("[API createEmpresa] Creando:", empresaData);
    try {
        const response = await api.post<EmpresaData>('/gestion/empresas/', empresaData);
        return response.data;
    } catch (error) { console.error("[API createEmpresa] Error:", error); throw error; }
};

export const updateEmpresa = async (id: number, empresaData: Partial<EmpresaDataInput>): Promise<EmpresaData> => {
     console.log(`[API updateEmpresa] Actualizando ID: ${id}`, empresaData);
     try {
        const response = await api.patch<EmpresaData>(`/gestion/empresas/${id}/`, empresaData);
        return response.data;
    } catch (error) { console.error("[API updateEmpresa] Error:", error); throw error; }
};

export const deleteEmpresa = async (id: number): Promise<void> => {
     console.log(`[API deleteEmpresa] Eliminando ID: ${id}`);
     try { await api.delete(`/gestion/empresas/${id}/`); }
     catch (error) { console.error("[API deleteEmpresa] Error:", error); throw error; }
};