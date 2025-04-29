// frontend/src/types/pedido.ts
// Organizado por Secciones - SIN ELIMINACIONES NI MODIFICACIONES
// Fecha: [Current Date]

// ==================================
// Tipos Primitivos y Enums Reutilizables (TODOS CONSERVADOS)
// ==================================

export type TipoFotoUpload = 'INICIO_GEN' | 'FIN_MERC' | 'FIN_REC' | 'FIN_GEN';
export type TipoServicioAPI = 'SIMPLE' | 'BODEGAJE_ENTRADA' | 'BODEGAJE_SALIDA' | 'PASAJEROS' | 'RENTA_VEHICULO';
export type TipoTarifaPasajeroAPI = 'TIEMPO' | 'DISTANCIA' | ''; // O define como string si prefieres menos rigidez

export type TipoServicio = 'SIMPLE' | 'BODEGAJE_ENTRADA' | 'BODEGAJE_SALIDA' | 'PASAJEROS' | 'RENTA_VEHICULO';
export type TipoVehiculo = 'MOTO' | 'PEQUENO' | 'MEDIANO' | 'GRANDE' | ''; // '' para opcional o no especificado
export type TipoTarifaPasajero = 'TIEMPO' | 'DISTANCIA' | ''; // '' para opcional o no seleccionado
export type PedidoEstado = 'pendiente' | 'en_curso' | 'finalizado' | 'cancelado';
export type TipoFoto = 'INICIO_GEN' | 'FIN_MERC' | 'FIN_REC' | 'FIN_GEN'; // Añade más si existen en el backend
export type TipoMovimientoInventario = 'CREACION' | 'ACTUALIZACION' | 'ELIMINACION' | 'AJUSTE_POS' | 'AJUSTE_NEG';

// ==================================
// Interfaces para Roles (CONSERVADAS TODAS LAS DEFINICIONES)
// ==================================

export interface RolData {
    id: number;
    nombre: string; // 'cliente', 'conductor', etc.
}

// Definición original 2 de RolData
export interface RolData {
    id: number;
    nombre: string;
}

// ==================================
// Interfaces para Empresas (CONSERVADAS TODAS LAS DEFINICIONES)
// ==================================

export interface EmpresaData {
    id: number;
    nombre: string;
    // Campos opcionales que pueden venir de EmpresaSerializer completo
    nit?: string | null;
    direccion?: string | null;
    telefono?: string | null;
}

// Definición original 2 de EmpresaData
export interface EmpresaData {
    id: number;
    nombre: string;
    // Añade otros campos si los devuelve EmpresaSimpleSerializer o EmpresaSerializer
    nit?: string | null;
    direccion?: string | null;
    telefono?: string | null;
}

// Interfaz para Crear/Actualizar Empresa
export interface EmpresaDataInput { // Para Crear/Actualizar Empresa
    nombre: string; // Requerido
    nit?: string | null;
    direccion?: string | null;
    telefono?: string | null;
}

// Interfaz para Filtros de Empresa
export interface EmpresaFiltros {
    search?: string; // Para buscar por nombre o NIT
    // Otros filtros podrían ir aquí, ej: is_active?: boolean;
}

// ==================================
// Interfaces para Usuarios y Autenticación (CONSERVADAS TODAS LAS DEFINICIONES)
// ==================================

// Información básica de usuario
export interface UserDataBase {
    id: number;
    cedula: string;
    nombre: string | null;
    apellido: string | null;
    // Opcional: incluir email/username si se usan comúnmente en display
    email?: string | null;
    username?: string | null;
}

// Información completa del usuario (Definición 1)
export interface UserData { // <-- Nombre elegido: UserData
    id: number;
    username: string | null;
    email: string | null;
    nombre: string | null;
    apellido: string | null;
    cedula: string;
    rol: RolData | null;
    empresa: EmpresaData | null;
    is_active?: boolean;
    is_staff?: boolean;
    //vehiculo_asignado: string | null; // StringRelatedField del backend
    // Considera añadir vehiculo_asignado_id si lo necesitas directamente al leer usuarios
    vehiculo_asignado_id?: number | null;
}

// Información completa del usuario (Definición 2, idéntica a UserData con vehiculo_asignado_id)
export interface UserDataCompleta { // O UserData, la que uses para el estado y listas
    id: number;
    username: string | null;
    email: string | null;
    nombre: string | null;
    apellido: string | null;
    cedula: string;
    rol: RolData | null;
    empresa: EmpresaData | null;
    is_active?: boolean;
    is_staff?: boolean;
    // --- AÑADIR ESTE CAMPO ---
    // Para mostrar el vehículo asignado (viene como string del StringRelatedField)
    //vehiculo_asignado: string | null; // Ejemplo: "XYZ123 (Motocicleta)"
    // --- También podrías necesitar el ID si lo manejas por separado ---
    vehiculo_asignado_id?: number | null; // Opcional aquí, se maneja en el form
}

// Interfaz para Input de Usuario
export interface UsuarioInputData {
    cedula: string;
    password?: string;
    nombre?: string | null;
    apellido?: string | null;
    email?: string | null;
    username?: string | null;
    rol_id: number;
    empresa_id?: number | null;
    is_active?: boolean;
    vehiculo_asignado_id?: number | null;
}

// Filtros para obtener lista de usuarios
export interface GetUsuariosFilters {
    rol?: string | number; // Puede ser el nombre ('cliente') o el ID
    empresa_id?: number | string; // ID de la empresa
    search?: string; // Término de búsqueda general (cedula, nombre, apellido, email)
    is_active?: boolean | string; // 'true', 'false', or 'all'
}

// Respuesta de Login (Usa UserData - Definición 3)
export interface UserData { // Usada en LoginResponseData
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

export interface LoginResponseData {
    access: string;
    refresh?: string;
    user: UserData; // Devuelve los datos completos del usuario al loguear
}


// ==================================
// Interfaces para Vehículos (CONSERVADAS TODAS LAS DEFINICIONES)
// ==================================

export interface TipoVehiculoData {
    id: number;
    nombre: string;
    descripcion?: string | null;
    // codigo?: string | null; // Si lo añadiste al modelo/serializer
}

export interface VehiculoInputData {
    placa: string;
    tipo_id: number; // <-- ID del TipoVehiculo
    marca?: string | null;
    modelo?: string | null;
    year?: number | string | null; // Aceptar string desde el input
    activo?: boolean;
}

export interface VehiculoData {
    id: number;
    placa: string;
    // 'tipo' ahora es un objeto anidado (según Opción 1 elegida antes) o null
    tipo: TipoVehiculoData | null;
    // Ya no necesitamos tipo_display porque tenemos el objeto anidado
    marca?: string | null;
    modelo?: string | null;
    year?: number | null;
    activo?: boolean;
}

// ==================================
// Interfaces para Bodegaje (Producto, Ubicacion, Inventario, Movimientos)
// (CONSERVADAS TODAS LAS DEFINICIONES)
// ==================================

// --- Producto ---
export interface ProductoData {
    id: number;
    nombre: string;
    descripcion?: string | null; // Asegúrate que coincida con el serializer
    sku: string;
}

export interface ProductoDataInput { nombre: string; descripcion?: string; sku: string; } // Para Crear/Actualizar Producto
export interface ProductoDataOutput extends ProductoDataInput { id: number; } // Para Leer Producto


// --- Ubicación ---
export interface UbicacionData {
    id: number;
    nombre: string;
    descripcion?: string | null;
}

export interface UbicacionDataInput { nombre: string; descripcion?: string; } // Para Crear/Actualizar Ubicacion
export interface UbicacionDataOutput extends UbicacionDataInput { id: number; } // Para Leer Ubicacion


// --- Inventario ---
export interface InventarioDataOutput { // Definición 1
    id: number;
    producto_nombre: string;
    ubicacion_nombre: string;
    producto_id_read?: number;
    cantidad: number;
    fecha_actualizacion: string;
    fecha_creacion: string;
    empresa: EmpresaData | null;
}

export interface EntradaInventarioPayload {
    producto_id: number;
    ubicacion_id: number;
    empresa_id: number;
    cantidad: number; // Cantidad a añadir (positiva)
    motivo?: string | null;
}

export interface SalidaInventarioPayload {
    producto_id: number;
    ubicacion_id: number;
    empresa_id: number;
    cantidad: number; // Cantidad a retirar (positiva)
    motivo?: string | null;
}

// Para mostrar inventario al Cliente o al Jefe (Definición 2 de InventarioDataOutput)
export interface InventarioDataOutput {
    id: number;
    producto_nombre: string;    // Nombre leído
    producto_id_read?: number;   // ID del producto (asegúrate que el serializer lo incluya si lo necesitas)
    ubicacion_nombre: string; // Ya no se necesita para el cliente/jefe en la lista principal
    cantidad: number;
    fecha_creacion: string;      // Fecha de creación del registro (ISO string)
    empresa: EmpresaData | null; // Empresa dueña (puede ser null?)
}

// Para mostrar inventario al Jefe cuando SELECCIONA para retiro
export interface InventarioClienteItem {
    id: number; // ID del registro de Inventario
    producto_id: number; // ID del Producto (¡Importante!)
    producto_nombre: string;
    cantidad: number; // Cantidad disponible
    // No necesitamos ubicación aquí
}

export interface InventarioDataInput {
    producto_id: number;
    ubicacion_id: number;
    cantidad: number;
    empresa_id: number;
}
export interface InventarioUpdateInput {
    cantidad: number;
}

export interface InventarioFiltrosAPI {
    empresa_id?: number | string; // Mantenemos este si aún lo usas como ID directo en algún sitio
    empresa?: number | string;    // Para el FilterSet (usa este nombre)
    producto?: number | string;   // Para el FilterSet (usa este nombre)
    ubicacion?: number | string;  // Para el FilterSet (usa este nombre)
    // Añade otros filtros si los necesitas
}


// --- Movimientos de Inventario (Historial) ---
export interface MovimientoInventarioData { // Definición 1
    id: number;
    timestamp: string; // ISO Date string
    usuario: string | null; // Nombre/repr del usuario o 'Sistema' o null
    tipo_movimiento: string; // El texto legible 'Creación Inicial', etc.
    producto: string | null; // Nombre producto
    ubicacion: string | null; // Nombre ubicación
    empresa: EmpresaData | null; // Objeto Empresa
    cantidad_anterior: number | null;
    cantidad_nueva: number | null;
    cantidad_cambio: number;
    motivo: string | null;
    inventario_id: number | null; // ID del registro Inventario afectado (si aún existe)
}

export interface MovimientoInventarioData { // Definición 2 (Para Leer Historial)
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

export interface HistorialInventarioFiltros { // Para filtrar historial
    year?: number | string;
    month?: number | string;
    day?: number | string;
    producto_id?: number | string;
    ubicacion_id?: number | string;
    empresa_id?: number | string;
}


// ==================================
// Interfaces Específicas de Pedido Transporte
// (CONSERVADAS TODAS LAS DEFINICIONES)
// ==================================

// --- Items de Pedido ---
export interface ItemARetirarInput { // Definición 1
    producto_id: number;
    cantidad: number;
}

export interface ItemPedidoLeido {
    id: number;
    producto: string; // Nombre del producto (StringRelatedField)
    cantidad: number;
}

// Definición 2 de ItemARetirarInput (idéntica)
export interface ItemARetirarInput { // Para enviar al crear pedido BODEGAJE_SALIDA
    producto_id: number;
    cantidad: number;
}

// --- Pruebas de Entrega (Fotos) ---
export interface PruebaEntregaData { // Definición 1
    id: number;
    pedido_id: number;
    tipo_foto: TipoFotoUpload; // Clave 'INICIO_GEN', etc. Permitir string por si acaso
    tipo_foto_display?: string;   // Texto legible 'Inicio - General', etc.
    foto_url: string | null;     // URL completa de la imagen
    subido_por_info?: string | null; // Quién subió la foto
    timestamp: string;           // ISO Date string de subida
}

// Definición 2 de PruebaEntregaData (ligeramente diferente - usa TipoFotoUpload)
// (Nota: TipoFotoUpload y TipoFoto tienen los mismos valores literales)
export interface PruebaEntregaData { // Usada en la respuesta de subida de foto
    id: number;
    tipo_foto: TipoFotoUpload; // <-- Usa TipoFotoUpload
    tipo_foto_display?: string;
    foto_url: string | null;
    timestamp: string;
    subido_por_info?: string | null;
}


// --- Confirmación del Cliente ---
export interface ConfirmacionClientePayload {
    nombre_receptor: string;
    cedula_receptor?: string;
    firma_imagen_base64: string;
    observaciones?: string;
}

export interface ConfirmacionClienteData {
    id?: number; // Puede no venir siempre
    pedido?: number; // ID del pedido asociado
    token?: string; // Token (útil si se reusa la interfaz)
    nombre_receptor: string;
    cedula_receptor: string | null;
    firma_imagen_base64: string | null; // Data URL de la imagen
    observaciones: string | null;
    fecha_confirmacion: string | null; // ISO Date string
}

export interface ConfirmacionClienteResponse {
    // Podría devolver el objeto ConfirmacionCliente guardado o solo un mensaje
    detail?: string;
    id?: number;
    fecha_confirmacion?: string;
}

export interface QRDataResponse {
    confirmation_url: string;
}


// --- Interfaces Principales para Pedidos (Listas, Detalles) ---

// Para la LISTA de pedidos del JEFE
export interface PedidoEnLista {
    id: number;
    cliente: string;         // Nombre cliente
    cliente_id: number;      // ID cliente
    conductor: string | null;    // Nombre conductor
    conductor_id: number | null; // ID conductor
    origen: string | null;
    destino: string | null;
    estado: PedidoEstado;         // Clave del estado
    estado_display: string;         // Texto legible estado
    tipo_servicio_display: string;  // Texto legible tipo servicio
    fecha_creacion: string;       // ISO String
    // Añadir otros campos si son útiles en la lista (ej. fecha_fin)
    // fecha_fin?: string | null;
}

// Para la LISTA de pedidos ACTIVOS del CONDUCTOR
export interface PedidoConductorData {
    id: number;
    cliente: string; // Necesario mostrar cliente
    // conductor: string | null; // No tan necesario, ya sabe quién es
    origen: string | null;
    destino: string | null;
    descripcion: string | null;
    estado: PedidoEstado;
    fecha_creacion: string;
    fecha_inicio: string | null;
    fecha_fin: string | null; // Útil para saber si ya terminó (aunque estado lo dice)
    // Flags booleanos clave
    requiere_fotos_inicio: boolean;
    requiere_fotos_fin: boolean;
    requiere_confirmacion_cliente: boolean;
    fotos_inicio_completas: boolean;
    fotos_fin_completas: boolean;
    confirmacion_cliente_realizada: boolean;
    // Campos display para UI
    tipo_servicio_display?: string;
    tipo_vehiculo_display?: string;
}

// Para los DETALLES COMPLETOS de un pedido (o HISTORIAL)
export interface PedidoDetalleData {
    id: number;
    // Relaciones (representación y IDs)
    cliente: string;
    conductor: string | null;
    cliente_id: number; // Asegúrate que el serializer lo incluya si lo necesitas para edición
    conductor_id: number | null; // Asegúrate que el serializer lo incluya
    // Campos básicos y de estado
    origen: string | null;
    destino: string | null;
    descripcion: string | null;
    estado: PedidoEstado;
    estado_display: string;
    // Fechas
    fecha_creacion: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    hora_recogida_programada: string | null;
    hora_entrega_programada: string | null;
    // Tipos (clave y display)
    tipo_servicio: TipoServicio;
    tipo_servicio_display: string;
    tipo_vehiculo_requerido: TipoVehiculo | string | null; // Clave MOTO, etc. o string
    tipo_vehiculo_display: string;
    // Campos específicos por tipo
    tiempo_bodegaje_estimado: string | null;
    dimensiones_contenido: string | null;
    items_pedido: ItemPedidoLeido[]; // Array vacío si no aplica
    numero_pasajeros: number | null;
    tipo_tarifa_pasajero: TipoTarifaPasajero | string | null; // Clave TIEMPO/DISTANCIA o string
    tipo_tarifa_pasajero_display: string;
    duracion_estimada_horas: number | string | null; // Podría ser string o number
    distancia_estimada_km: number | string | null;   // Podría ser string o number
    // Flags booleanos de estado de validación
    requiere_fotos_inicio: boolean;
    requiere_fotos_fin: boolean;
    requiere_confirmacion_cliente: boolean;
    fotos_inicio_completas: boolean;
    fotos_fin_completas: boolean;
    confirmacion_cliente_realizada: boolean;
    // Datos anidados de relaciones
    pruebas_entrega: PruebaEntregaData[]; // Array de objetos foto
    confirmacion_cliente: ConfirmacionClienteData | null; // Objeto o null
}

// Interfaz genérica/intermedia para Pedido (Conservada)
export interface PedidoData {
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

// --- Payloads para Crear/Actualizar Pedidos (Conservados con nombres originales) ---

export interface JefeNuevoPedidoDataCompleto {
    origen?: string | null;
    destino?: string | null;
    descripcion?: string;
    cliente_id: number;
    conductor_id?: number | null;
    estado?: PedidoEstado; // Usualmente 'pendiente' al crear
    tipo_servicio: TipoServicio; // Clave del tipo
    hora_recogida_programada?: string | null;
    hora_entrega_programada?: string | null;
    tipo_vehiculo_requerido?: string | null; // Usar string, backend valida
    // Bodega
    tiempo_bodegaje_estimado?: string | null;
    dimensiones_contenido?: string | null;
    items_a_retirar?: ItemARetirarInput[] | null;
    // Pasajeros
    numero_pasajeros?: number | null;
    tipo_tarifa_pasajero?: TipoTarifaPasajero | null; // Usa el tipo definido
    duracion_estimada_horas?: number | null;
    distancia_estimada_km?: number | null;
}

export interface ClienteToService {
    id: number;
    producto_nombre: string;
    ubicacion_nombre: string;
    producto_id: number;
    cantidad: number;
}

export interface NuevoPedidoClienteData {
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

export interface JefeNuevoPedidoData {
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

export interface PedidoUpdateData {
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
export interface PedidoCreadoResponse {
    id: number;
    estado: string;
    // incluye otros campos si son relevantes al crear
}