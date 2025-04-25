// frontend/src/services/api.ts
import axios from 'axios';
import { PedidoEnLista, PedidoDetalleData, PedidoConductorData, JefeNuevoPedidoDataCompleto} from '../types/pedido'; // Ajusta la ruta
type TipoFotoUpload = 'INICIO_GEN' | 'FIN_MERC' | 'FIN_REC' | 'FIN_GEN';

// Interfaz para los datos que se envían al backend
interface ConfirmacionClientePayload {
    nombre_receptor: string;
    cedula_receptor?: string;
    firma_imagen_base64: string;
    observaciones?: string;
}

// Interfaz para la respuesta esperada del backend (ajusta si devuelve algo)
interface ConfirmacionClienteResponse {
    // Podría devolver el objeto ConfirmacionCliente guardado o solo un mensaje
    detail?: string;
    id?: number;
    fecha_confirmacion?: string;
}

// Interfaz para la respuesta del endpoint de datos QR
interface QRDataResponse {
    confirmation_url: string;
}

// --- Interfaces Generales ---
interface RolData {
    id: number;
    nombre: string;
}

interface EmpresaData {
    id: number;
    nombre: string;
    // Añade otros campos si los devuelve EmpresaSimpleSerializer o EmpresaSerializer
    nit?: string | null;
    direccion?: string | null;
    telefono?: string | null;
}

// Interfaz para la respuesta esperada al subir foto (ajusta según tu serializer)
interface PruebaEntregaData {
    id: number;
    tipo_foto: TipoFotoUpload;
    tipo_foto_display?: string;
    foto_url: string;
    timestamp: string;
    subido_por_info?: string;
}

interface UserData {
    id: number;
    username: string | null;
    email: string | null;
    nombre: string | null;
    apellido: string | null;
    cedula: string;
    rol: RolData | null;
    empresa: EmpresaData | null; // Usa la interfaz EmpresaData definida arriba
    is_active?: boolean;
    is_staff?: boolean;
}

// --- Interfaces para Autenticación ---
interface LoginResponseData {
    access: string;
    refresh?: string;
    user: UserData; // Devuelve los datos completos del usuario al loguear
}

interface UsuarioInputData { // Para Crear/Actualizar Usuario
    cedula: string;
    password?: string; // Requerido al crear
    nombre?: string | null;
    apellido?: string | null;
    email?: string | null;
    username?: string | null; // Opcional, podría generarse desde email/cédula
    rol_id: number; // Requerido
    empresa_id?: number | null; // Requerido si rol es cliente
    is_active?: boolean; // Útil para activar/desactivar
}

// --- Interfaces para Empresa ---
interface EmpresaDataInput { // Para Crear/Actualizar Empresa
    nombre: string; // Requerido
    nit?: string | null;
    direccion?: string | null;
    telefono?: string | null;
}
// Usamos EmpresaData como interfaz de salida para GET /empresas/

// --- Interfaces para Transporte ---
type PedidoEstado = 'pendiente' | 'en_curso' | 'finalizado' | 'cancelado';
interface ItemARetirarInput { // Para enviar al crear pedido BODEGAJE_SALIDA
    producto_id: number;
    cantidad: number;
}

// Para la respuesta de la API de Pedidos (GET /pedidos, GET /mis_pedidos, etc.)
interface PedidoData {
    id: number;
    cliente: string; // Nombre del cliente (StringRelatedField)
    conductor: string | null; // Nombre del conductor (StringRelatedField)
    origen: string;
    destino: string;
    descripcion: string;
    estado: PedidoEstado; // Usa el tipo PedidoEstado
    fecha_creacion: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    // IDs (asegúrate que el serializer los incluya si los necesitas siempre)
    cliente_id: number;
    conductor_id: number | null;
    // Campos adicionales del modelo PedidoTransporte que se serializan
    hora_recogida_programada?: string | null;
    hora_entrega_programada?: string | null;
    tipo_vehiculo_requerido?: string | null;
    tipo_servicio?: string;
    tiempo_bodegaje_estimado?: string | null;
    dimensiones_contenido?: string | null;
    // Items del pedido (si se serializan para lectura, necesitarías otra interfaz)
    // items_pedido?: { id: number; producto: string; cantidad: number }[];
}

// Interfaz para los filtros que getUsuarios aceptará
interface GetUsuariosFilters {
    rol?: string | number; // Puede ser el nombre ('cliente') o el ID
    empresa_id?: number | string; // ID de la empresa
    search?: string; // Término de búsqueda general (cedula, nombre, apellido, email)
    is_active?: boolean | string; // 'true', 'false', or 'all'
}

type TipoServicioAPI = 'SIMPLE' | 'BODEGAJE_ENTRADA' | 'BODEGAJE_SALIDA' | 'PASAJEROS' | 'RENTA_VEHICULO';
type TipoTarifaPasajeroAPI = 'TIEMPO' | 'DISTANCIA' | ''; // O define como string si prefieres menos rigidez

// Para la data enviada por el CLIENTE al crear pedido
interface NuevoPedidoClienteData {
    // Campos comunes
    origen?: string | null;
    destino?: string | null;
    descripcion?: string; // Mantenlo opcional (string | undefined)
    hora_recogida_programada?: string | null;
    hora_entrega_programada?: string | null;
    tipo_vehiculo_requerido?: string | null;
    tipo_servicio: TipoServicioAPI; // Usa el tipo actualizado

    // Campos Mercancía/Bodega
    tiempo_bodegaje_estimado?: string | null;
    dimensiones_contenido?: string | null; // Opcional (string | undefined)
    items_a_retirar?: { producto_id: number; cantidad: number; }[] | null;

    // Nuevos Campos Pasajeros
    numero_pasajeros?: number | null;
    tipo_tarifa_pasajero?: TipoTarifaPasajeroAPI | null;
    duracion_estimada_horas?: number | null;
    distancia_estimada_km?: number | null;
}

// Para la data enviada por el JEFE/ADMIN al crear pedido
interface JefeNuevoPedidoData {
    origen: string;
    destino: string;
    descripcion?: string;
    cliente_id: number; // Requerido
    conductor_id?: number | null;
    tipo_servicio: string; // Requerido
    items_a_retirar?: ItemARetirarInput[]; // Para BODEGAJE_SALIDA
    estado?: PedidoEstado; // Opcional al crear
    // Añade otros campos si el Jefe puede especificarlos al crear
    hora_recogida_programada?: string | null;
    hora_entrega_programada?: string | null;
    tipo_vehiculo_requerido?: string | null;
    tiempo_bodegaje_estimado?: string | null;
    dimensiones_contenido?: string | null;
}

// Para la data enviada al ACTUALIZAR pedido (PATCH) por Jefe/Admin
interface PedidoUpdateData {
    origen?: string;
    destino?: string;
    descripcion?: string;
    cliente_id?: number;
    conductor_id?: number | null; // Permite desasignar con null
    estado?: PedidoEstado;
    // Añade otros campos actualizables por Jefe/Admin
    hora_recogida_programada?: string | null;
    hora_entrega_programada?: string | null;
    tipo_vehiculo_requerido?: string | null;
    tipo_servicio?: string;
    tiempo_bodegaje_estimado?: string | null;
    dimensiones_contenido?: string | null;
    // La actualización de items_a_retirar es compleja con PATCH, usualmente no se hace así
}

// Para la respuesta al CREAR un pedido (puede ser más simple)
interface PedidoCreadoResponse {
    id: number;
    estado: string;
    // incluye otros campos si son relevantes al crear
}


// --- Interfaces para Bodegaje ---
interface ProductoDataInput { nombre: string; descripcion?: string; sku: string; } // Para Crear/Actualizar Producto
interface ProductoDataOutput extends ProductoDataInput { id: number; } // Para Leer Producto
interface UbicacionDataInput { nombre: string; descripcion?: string; } // Para Crear/Actualizar Ubicacion
interface UbicacionDataOutput extends UbicacionDataInput { id: number; } // Para Leer Ubicacion
interface InventarioDataInput { producto_id: number; ubicacion_id: number; cantidad: number; empresa_id: number; } // Para Crear Inventario
interface InventarioUpdateInput { cantidad: number; } // Para Actualizar Cantidad Inventario
// --- INTERFAZ CORREGIDA PARA LEER INVENTARIO ---

// Coincide con los campos READ definidos en InventarioSerializer
interface InventarioDataOutput {
    id: number;
    producto_nombre: string;
    //ubicacion_nombre: string;
    producto_id_read?: number;
    cantidad: number;
    //fecha_actualizacion: string;
    fecha_creacion: string; 
    empresa: EmpresaData | null;
}
// --- FIN INTERFAZ CORREGIDA ---

// --- Interfaces para Historial Inventario ---
interface MovimientoInventarioData { // Para Leer Historial
    id: number;
    timestamp: string;
    usuario: string | null; // Nombre usuario o null
    tipo_movimiento: string; // Texto legible del tipo
    producto: string | null; // Nombre producto o null
    ubicacion: string | null; // Nombre ubicación o null
    empresa: EmpresaData | null; // Usa interfaz EmpresaData
    cantidad_anterior: number | null;
    cantidad_nueva: number | null;
    cantidad_cambio: number;
    motivo: string | null;
    inventario_id: number | null;
}

interface HistorialInventarioFiltros { // Para filtrar historial
    year?: number | string;
    month?: number | string;
    day?: number | string;
    producto_id?: number | string;
    ubicacion_id?: number | string;
    empresa_id?: number | string;
}
// --- FIN Interfaces ---

// --- Configuración Axios ---
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api', // URL base de tu API
    // Puedes añadir otros defaults aquí si es necesario
});

// Interceptor para añadir el token a todas las peticiones
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // console.log('Axios Request Config:', config); // Descomenta para debug de request
        return config;
    }, (error) => {
        console.error('Axios Request Error:', error); // Log de errores de request
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de respuesta (opcional pero útil)
api.interceptors.response.use(
    (response) => {
        // console.log('Axios Response OK:', response); // Descomenta para debug de response OK
        return response; // Devuelve la respuesta si es exitosa
    },
    (error) => {
        console.error('Axios Response Error:', error.response || error.message || error); // Log detallado del error
        // Aquí podrías manejar errores globales, como 401 (Unauthorized) para desloguear al usuario
        if (error.response && error.response.status === 401) {
            // Ejemplo: Desloguear si el token ya no es válido
            // logout(); // Necesitarías importar o tener acceso a la función logout del AuthContext
            // window.location.href = '/login'; // Redirigir a login
            console.error('ERROR 401 - Token inválido o expirado.');
        }
        // Rechaza la promesa para que el componente que hizo la llamada pueda manejar el error
        return Promise.reject(error);
    }
);

// --- Funciones API Exportadas ---

// Obtiene inventario filtrando por ID de EMPRESA (para Jefes)
export const getInventarioPorEmpresaId = async (empresaId: number): Promise<InventarioDataOutput[]> => {
    console.log(`[API] Fetching inventario para Empresa ID: ${empresaId}`);
    try {
        // Usa el endpoint existente pero añade el query parameter 'empresa_id'
        const response = await api.get<InventarioDataOutput[]>('/bodegaje/inventario/', {
            params: { empresa_id: empresaId }
        });
        console.log(`[API] Inventario recibido para Empresa ${empresaId}:`, response.data.length);
        return response.data;
    } catch (error: any) {
        console.error(`[API] Error fetching inventario para Empresa ${empresaId}:`, error.response?.data || error.message);
        throw error;
    }
};

export const getHistorialMesCliente = async (year: number, month: number): Promise<PedidoDetalleData[]> => {
    console.log(`[API] Fetching client history for ${year}-${month}`);
    try {
        const response = await api.get<PedidoDetalleData[]>('/transporte/mi_historial/', { params: { year, month } });
        console.log(`[API] Client history received for ${year}-${month}`, response.data.length);
        return response.data;
    } catch (error: any) {
        console.error(`[API] Error fetching client history for ${year}-${month}:`, error.response?.data || error.message);
        // Re-lanza el error para que el componente lo maneje
        throw error;
    }
};

export const submitConfirmacionCliente = async (
    token: string,
    data: ConfirmacionClientePayload
): Promise<ConfirmacionClienteResponse> => {
    // Define la URL completa (asegúrate que la base sea correcta)
    // Puedes obtenerla de una variable de entorno o definirla aquí
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api'; // Ejemplo
    const url = `${API_BASE_URL}/transporte/confirmar/${token}/`;

    try {
        console.log(`[API submitConfirmacionCliente] Enviando POST a ${url} SIN token Auth`);
        // --- USA AXIOS BASE DIRECTAMENTE ---
        // Esto evita usar la instancia 'api' que podría tener el interceptor de Auth.
        const response = await axios.post<ConfirmacionClienteResponse>(url, data, {
            // No necesitas pasar headers aquí, axios NO añadirá 'Authorization' por defecto
        });
        // --- FIN USO AXIOS BASE ---

        console.log(`[API submitConfirmacionCliente] Éxito para Token ${token}`);
        return response.data;
    } catch (error: any) {
        console.error(`[API submitConfirmacionCliente] Error para Token ${token}:`, error.response?.data || error.message);
        // Revisar si el error es por la estructura de AxiosError
        const responseError = error.response?.data || { detail: error.message || "Error desconocido" };
        // Lanza un objeto de error consistente si es posible
        throw { response: { data: responseError } }; // Simula estructura para manejo en componente
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

export const uploadPruebaEntrega = async (
    pedidoId: number,
    tipoFoto: TipoFotoUpload,
    foto: File
): Promise<PruebaEntregaData> => {
    const formData = new FormData();
    // --- CAMBIO: Enviar 'tipo_foto' al backend ---
    formData.append('tipo_foto', tipoFoto); // El backend espera 'tipo_foto'
    formData.append('foto', foto);

    try {
        // La URL no cambia
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


// Autenticación
export const loginUser = async (credentials: any): Promise<LoginResponseData> => {
    const response = await api.post<LoginResponseData>('/auth/login/', credentials);
    // Guarda token y user data en localStorage DENTRO de AuthContext.login, no aquí
    return response.data;
};

// Pedidos Transporte (Cliente)
export const createPedidoTransporteCliente = async (pedidoData: NuevoPedidoClienteData): Promise<any> => {
    console.log("[api.ts] Enviando datos REALES a endpoint SIMPLE TEST:", pedidoData);
    // --- APUNTA TEMPORALMENTE AL ENDPOINT DE PRUEBA ---
    const response = await api.post<any>('/transporte/simple-test/', pedidoData);
    // ---------------------------------------------
    console.log("[api.ts] Respuesta de endpoint SIMPLE TEST:", response.data);
    return response.data;
};

// Pedidos Transporte (Conductor)
export const getPedidos = async (): Promise<PedidoConductorData[]> => { // Pedidos activos para conductor
    const response = await api.get<PedidoConductorData[]>('/transporte/mis_pedidos/');
    return response.data;
};

export const iniciarPedido = async (pedidoId: number): Promise<PedidoData> => {
    const response = await api.patch<PedidoData>(`/transporte/pedidos/${pedidoId}/`, { iniciar: 'confirmado' });
    return response.data;
};

export const finalizarPedido = async (pedidoId: number): Promise<PedidoData> => {
    const response = await api.patch<PedidoData>(`/transporte/pedidos/${pedidoId}/`, { finalizar: 'confirmado' });
    return response.data;
};

export const getHistorialMesConductor = async (year: number, month: number): Promise<PedidoDetalleData[]> => {
    const response = await api.get<PedidoDetalleData[]>('/transporte/historial_mes_conductor/', { params: { year, month } });
    return response.data;
};

// Obtiene lista para Jefe/Admin (GET /transporte/pedidos/)
export const getPedidosJefe = async (): Promise<PedidoEnLista[]> => {
    const response = await api.get<PedidoEnLista[]>('/transporte/pedidos/');
    return response.data;
};

// Obtiene detalles de UN pedido (GET /transporte/pedidos/{id}/)
export const getPedidoDetalle = async (id: number): Promise<PedidoDetalleData> => {
    const response = await api.get<PedidoDetalleData>(`/transporte/pedidos/${id}/`);
    return response.data;
};

export const createPedidoJefe = async (pedidoData: JefeNuevoPedidoDataCompleto): Promise<PedidoData> => { // <-- Usa la interfaz completa
    const response = await api.post<PedidoData>('/transporte/pedidos/', pedidoData); // La URL es correcta
    return response.data;
};

export const updatePedido = async (id: number, pedidoData: Partial<PedidoUpdateData>): Promise<PedidoData> => { // Usa Partial para PATCH
    const response = await api.patch<PedidoData>(`/transporte/pedidos/${id}/`, pedidoData);
    return response.data;
};

export const deletePedido = async (id: number): Promise<void> => {
    await api.delete(`/transporte/pedidos/${id}/`);
};

export const getHistorialGeneral = async (year: number, month: number): Promise<PedidoDetalleData[]> => { // Historial para Jefe/Admin
    const response = await api.get<PedidoDetalleData[]>('/transporte/historial_mes/', { params: { year, month } });
    return response.data;
};

// Empresa (Gestión Jefe/Admin)
export const getEmpresas = async (): Promise<EmpresaData[]> => {
    const response = await api.get<EmpresaData[]>('/gestion/empresas/'); // <-- URL solicitada
    return response.data;
};

export const createEmpresa = async (empresaData: EmpresaDataInput): Promise<EmpresaData> => {
    const response = await api.post<EmpresaData>('/gestion/empresas/', empresaData);
    return response.data;
};

export const updateEmpresa = async (id: number, empresaData: Partial<EmpresaDataInput>): Promise<EmpresaData> => {
    const response = await api.patch<EmpresaData>(`/gestion/empresas/${id}/`, empresaData);
    return response.data;
};

export const deleteEmpresa = async (id: number): Promise<void> => {
    await api.delete(`/gestion/empresas/${id}/`);
};

// Bodegaje (Productos - Gestión Jefe Inv/Empresa)
export const getProductos = async (): Promise<ProductoDataOutput[]> => {
    const response = await api.get<ProductoDataOutput[]>('/bodegaje/productos/');
    return response.data;
};

export const createProducto = async (data: ProductoDataInput): Promise<ProductoDataOutput> => {
    const response = await api.post<ProductoDataOutput>('/bodegaje/productos/', data);
    return response.data;
};

export const updateProducto = async (id: number, data: Partial<ProductoDataInput>): Promise<ProductoDataOutput> => {
    const response = await api.patch<ProductoDataOutput>(`/bodegaje/productos/${id}/`, data);
    return response.data;
};

export const deleteProducto = async (id: number): Promise<void> => {
    await api.delete(`/bodegaje/productos/${id}/`);
};

// Bodegaje (Ubicaciones - Gestión Jefe Inv/Empresa)
export const getUbicaciones = async (): Promise<UbicacionDataOutput[]> => {
    const response = await api.get<UbicacionDataOutput[]>('/bodegaje/ubicaciones/');
    return response.data;
};

export const createUbicacion = async (data: UbicacionDataInput): Promise<UbicacionDataOutput> => {
    const response = await api.post<UbicacionDataOutput>('/bodegaje/ubicaciones/', data);
    return response.data;
};

export const updateUbicacion = async (id: number, data: Partial<UbicacionDataInput>): Promise<UbicacionDataOutput> => {
    const response = await api.patch<UbicacionDataOutput>(`/bodegaje/ubicaciones/${id}/`, data);
    return response.data;
};

export const deleteUbicacion = async (id: number): Promise<void> => {
    await api.delete(`/bodegaje/ubicaciones/${id}/`);
};

// Bodegaje (Inventario - Cliente ve el suyo, Jefes gestionan)
// Usa la interfaz InventarioDataOutput CORREGIDA
export const getInventarioEmpresa = async (): Promise<InventarioDataOutput[]> => { // Para Cliente
    const response = await api.get<InventarioDataOutput[]>('/bodegaje/inventario/');
    return response.data;
};

export const getInventarioJefe = getInventarioEmpresa; // Jefes usan el mismo endpoint base (permisos se aplican en backend)

export const createInventario = async (data: InventarioDataInput): Promise<InventarioDataOutput> => { // Para Jefes
    const response = await api.post<InventarioDataOutput>('/bodegaje/inventario/', data);
    return response.data;
};

export const updateInventario = async (id: number, data: Partial<InventarioUpdateInput>): Promise<InventarioDataOutput> => { // Para Jefes (solo cantidad)
    const response = await api.patch<InventarioDataOutput>(`/bodegaje/inventario/${id}/`, data);
    return response.data;
};

export const deleteInventario = async (id: number): Promise<void> => { // Para Jefes
    await api.delete(`/bodegaje/inventario/${id}/`);
};

// Bodegaje (Historial Inventario - Jefes)
export const getHistorialInventario = async (filtros?: HistorialInventarioFiltros): Promise<MovimientoInventarioData[]> => {
    const response = await api.get<MovimientoInventarioData[]>('/bodegaje/historial/', { params: filtros || {} });
    return response.data;
};

export const getUsuarios = async (filtros?: GetUsuariosFilters): Promise<UserData[]> => {
    console.log("[API] Fetching users with filters:", filtros);
    // Pasa el objeto filtros al parámetro 'params' de la llamada GET
    const response = await api.get<UserData[]>('/gestion/usuarios/', { params: filtros || {} });
    console.log("[API] Users fetched:", response.data.length);
    return response.data;
};

// Funciones para obtener usuarios por rol específico
export const getConductores = async (): Promise<UserData[]> => {
    // --- CORRECCIÓN AQUÍ ---
    const response = await api.get<UserData[]>('/gestion/usuarios/', { params: { rol: 'conductor' } });
    return response.data;
};

export const getClientes = async (): Promise<UserData[]> => {
    const response = await api.get<UserData[]>('/gestion/usuarios/', { params: { rol: 'cliente' } });
    return response.data;
};

// Crear y Actualizar Usuarios
export const createUsuario = async (usuarioData: UsuarioInputData): Promise<UserData> => {
    const response = await api.post<UserData>('/gestion/usuarios/', usuarioData);
    return response.data;
};

export const updateUsuario = async (id: number, usuarioData: Partial<Omit<UsuarioInputData, 'password' | 'cedula'>>): Promise<UserData> => {
    const response = await api.patch<UserData>(`/gestion/usuarios/${id}/`, usuarioData);
    return response.data;
};

export const deleteUsuario = async (id: number): Promise<void> => {
    await api.delete(`/gestion/usuarios/${id}/`);
};

// Roles (Hardcodeado - ¡Mejorar con API real!)
export const getRoles = async (): Promise<RolData[]> => {
    console.warn("Roles hardcodeados en api.ts. Considera crear un endpoint API '/roles/'");
    // Asegúrate que estos IDs coincidan con los IDs REALES en tu base de datos
    return [
        { id: 1, nombre: 'conductor' },
        { id: 2, nombre: 'cliente' },
        { id: 3, nombre: 'jefe_inventario' },
        { id: 4, nombre: 'jefe_empresa' },
        { id: 5, nombre: 'admin' },
    ];
};

// Función para la prueba simple
export const postSimplePedidoTest = async (payload: any): Promise<any> => {
    console.log('[api.ts] Enviando prueba simple POST a /transporte/simple-test/', payload);
    // Apunta a la nueva URL
    const response = await api.post<any>('/transporte/simple-test/', payload);
    console.log('[api.ts] Respuesta de prueba simple:', response.data);
    return response.data;
};

// Exporta la instancia de axios configurada por si se necesita directamente
export default api;