// frontend/src/types/pedido.ts

// ==================================
// Tipos Primitivos y Enums Reutilizables
// ==================================

export type TipoServicio = 'SIMPLE' | 'BODEGAJE_ENTRADA' | 'BODEGAJE_SALIDA' | 'PASAJEROS' | 'RENTA_VEHICULO';
export type TipoVehiculo = 'MOTO' | 'PEQUENO' | 'MEDIANO' | 'GRANDE' | ''; // '' para opcional o no especificado
export type TipoTarifaPasajero = 'TIEMPO' | 'DISTANCIA' | ''; // '' para opcional o no seleccionado
export type PedidoEstado = 'pendiente' | 'en_curso' | 'finalizado' | 'cancelado';
export type TipoFoto = 'INICIO_GEN' | 'FIN_MERC' | 'FIN_REC' | 'FIN_GEN'; // Añade más si existen en el backend
export type TipoMovimientoInventario = 'CREACION' | 'ACTUALIZACION' | 'ELIMINACION' | 'AJUSTE_POS' | 'AJUSTE_NEG';

// ==================================
// Interfaces para Modelos Relacionados (Usuarios, Empresas, etc.)
// ==================================

export interface RolData {
    id: number;
    nombre: string; // 'cliente', 'conductor', etc.
}

export interface EmpresaData {
    id: number;
    nombre: string;
    // Campos opcionales que pueden venir de EmpresaSerializer completo
    nit?: string | null;
    direccion?: string | null;
    telefono?: string | null;
}

// Información básica de usuario que se muestra a menudo
export interface UserDataBase {
    id: number;
    cedula: string;
    nombre: string | null;
    apellido: string | null;
    // Opcional: incluir email/username si se usan comúnmente en display
    email?: string | null;
    username?: string | null;
}

// Información completa del usuario (ej. del login o gestión de usuarios)
export interface UserDataCompleta extends UserDataBase {
    rol: RolData | null;
    empresa: EmpresaData | null;
    is_active?: boolean;
    is_staff?: boolean;
}

// ==================================
// Interfaces para Bodegaje (Producto, Ubicacion, Inventario)
// ==================================

export interface ProductoData {
    id: number;
    nombre: string;
    descripcion?: string | null; // Asegúrate que coincida con el serializer
    sku: string;
}

export interface UbicacionData {
    id: number;
    nombre: string;
    descripcion?: string | null;
}

// Para mostrar inventario al Cliente o al Jefe (resultado de GET /bodegaje/inventario/)
export interface InventarioDataOutput {
    id: number;
    producto_nombre: string;    // Nombre leído
    producto_id_read?: number;   // ID del producto (asegúrate que el serializer lo incluya si lo necesitas)
    // ubicacion_nombre: string; // Ya no se necesita para el cliente/jefe en la lista principal
    cantidad: number;
    fecha_creacion: string;      // Fecha de creación del registro (ISO string)
    empresa: EmpresaData | null; // Empresa dueña (puede ser null?)
}

// Para mostrar inventario al Jefe cuando SELECCIONA para retiro en creación de pedido
export interface InventarioClienteItem {
    id: number; // ID del registro de Inventario
    producto_id: number; // ID del Producto (¡Importante!)
    producto_nombre: string;
    cantidad: number; // Cantidad disponible
    // No necesitamos ubicación aquí
}

// Para registrar movimientos de inventario (resultado de GET /bodegaje/historial/)
export interface MovimientoInventarioData {
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


// ==================================
// Interfaces Específicas de Pedido Transporte
// ==================================

// Para enviar items al crear pedido BODEGAJE_SALIDA
export interface ItemARetirarInput {
    producto_id: number;
    cantidad: number;
}

// Para leer items de un pedido existente (vienen de ItemPedidoReadSerializer)
export interface ItemPedidoLeido {
    id: number;
    producto: string; // Nombre del producto (StringRelatedField)
    cantidad: number;
}

// Para leer datos de PruebaEntrega (vienen de PruebaEntregaSerializer)
export interface PruebaEntregaData {
    id: number;
    pedido_id: number;
    tipo_foto: TipoFoto | string; // Clave 'INICIO_GEN', etc. Permitir string por si acaso
    tipo_foto_display: string;   // Texto legible 'Inicio - General', etc.
    foto_url: string | null;     // URL completa de la imagen
    subido_por_info: string | null; // Quién subió la foto
    timestamp: string;           // ISO Date string de subida
}

// Para leer datos de ConfirmacionCliente (vienen de ConfirmacionClienteSerializer)
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

// --- Interfaces Principales para PEDIDO ---

// 1. Para la LISTA de pedidos del JEFE (GET /transporte/pedidos/)
//    Información resumida para mostrar en tabla/lista.
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

// 2. Para la LISTA de pedidos ACTIVOS del CONDUCTOR (GET /transporte/mis_pedidos/)
//    Incluye flags booleanos necesarios para la lógica de acciones.
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

// 3. Para los DETALLES COMPLETOS de un pedido (GET /transporte/pedidos/{id}/)
//    Usado también para el HISTORIAL (Cliente, Conductor, Jefe).
//    Debe coincidir EXACTAMENTE con la salida de PedidoTransporteSerializer.
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