// frontend/src/components/Cliente/SolicitarEnvio.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { createPedidoTransporteCliente } from '../../services/transporte';
import { getInventarioEmpresa } from '../../services/bodegaje';
import styles from '../../styles/Cliente/SolicitarEnvio.module.css';
import { ClienteToService, NuevoPedidoClienteData, TipoServicio, TipoVehiculo, TipoTarifaPasajero, ItemARetirarInput } from '../../types/pedido'; // Ajusta ruta si es necesario

// --- NUEVO: Listas para selects ---
const ciudadesColombia = [
    // Capitales (Ya incluidas antes, pero aseguramos estén)
    "Arauca", "Armenia", "Barranquilla", "Bogotá, D.C.", "Bucaramanga", "Cali",
    "Cartagena", "Cúcuta", "Florencia", "Ibagué", "Inírida", "Leticia",
    "Manizales", "Medellín", "Mitú", "Mocoa", "Montería", "Neiva", "Pasto",
    "Pereira", "Popayán", "Puerto Carreño", "Quibdó", "Riohacha",
    "San Andrés", "San José del Guaviare", "Santa Marta", "Sincelejo",
    "Tunja", "Valledupar", "Villavicencio", "Yopal",

    // Antioquia
    "Apartadó", "Bello", "Caldas", "Caucasia", "Copacabana", "Envigado",
    "Girardota", "Itagüí", "La Ceja", "La Estrella", "Marinilla", "Puerto Berrío",
    "Rionegro", "Sabaneta", "Santa Fe de Antioquia", "Turbo", "Urrao",

    // Atlántico
    "Baranoa", "Galapa", "Malambo", "Puerto Colombia", "Sabanalarga", "Santo Tomás",
    "Soledad",

    // Bolívar
    "Arjona", "Carmen de Bolívar", "Magangué", "Mompós", "Turbaco",

    // Boyacá
    "Chiquinquirá", "Duitama", "Garagoa", "Paipa", "Puerto Boyacá", "Sogamoso",
    "Villa de Leyva",

    // Caldas
    "Chinchiná", "La Dorada", "Riosucio", "Salamina", "Supía", "Villamaría",

    // Caquetá
    "Belén de los Andaquíes", "Cartagena del Chairá", "San Vicente del Caguán",

    // Cauca
    "Guapi", "Piendamó", "Puerto Tejada", "Santander de Quilichao", "Silvia",

    // Cesar
    "Aguachica", "Agustín Codazzi", "Bosconia", "Chimichagua", "Chiriguaná",
    "Curumaní", "El Copey", "La Jagua de Ibirico", "Pailitas",

    // Chocó
    "Acandí", "Bahía Solano", "Condoto", "Istmina", "Nuquí", "Riosucio", "Tadó",

    // Córdoba
    "Cereté", "Ciénaga de Oro", "Lorica", "Montelíbano", "Planeta Rica", "Puerto Libertador",
    "Sahagún", "San Antero", "Tierralta", "Valencia",

    // Cundinamarca
    "Cajicá", "Chía", "Chocontá", "Cogua", "Cota", "El Rosal", "Facatativá",
    "Funza", "Fusagasugá", "Gachancipá", "Girardot", "Guaduas", "La Calera",
    "La Mesa", "Madrid", "Mosquera", "Nemocón", "Pacho", "Sibaté", "Silvania",
    "Soacha", "Sopó", "Subachoque", "Tabio", "Tenjo", "Tocancipá", "Ubaté",
    "Villeta", "Zipaquirá",

    // Guainía
    "Barranco Minas",

    // Guaviare
    "Calamar", "El Retorno", "Miraflores",

    // Huila
    "Aipe", "Campoalegre", "Garzón", "Gigante", "La Plata", "Palermo", "Pitalito",
    "Rivera", "San Agustín",

    // La Guajira
    "Albania", "Barrancas", "Dibulla", "Fonseca", "Hatonuevo", "Maicao", "Manaure",
    "San Juan del Cesar", "Uribia", "Villanueva",

    // Magdalena
    "Aracataca", "Ciénaga", "El Banco", "Fundación", "Plato", "Pivijay",
    "Santa Ana",

    // Meta
    "Acacías", "Barranca de Upía", "Castilla La Nueva", "Cubarral", "Cumaral",
    "El Castillo", "El Dorado", "Fuente de Oro", "Granada", "Guamal",
    "Mapiripán", "Mesetas", "La Macarena", "Lejanías", "Puerto Concordia",
    "Puerto Gaitán", "Puerto López", "Puerto Lleras", "Restrepo", "San Carlos de Guaroa",
    "San Juan de Arama", "San Martín", "Vista Hermosa",

    // Nariño
    "Barbacoas", "Consacá", "Cumbal", "El Charco", "Guachucal", "Ipiales", "La Cruz",
    "La Unión", "Samaniego", "Sandona", "Tumaco", "Túquerres",

    // Norte de Santander
    "Abrego", "Chinácota", "Convención", "El Zulia", "Los Patios", "Ocaña",
    "Pamplona", "Puerto Santander", "Sardinata", "Tibú", "Villa del Rosario",

    // Putumayo
    "Colón", "Orito", "Puerto Asís", "Puerto Caicedo", "Puerto Guzmán",
    "Puerto Leguízamo", "San Francisco", "San Miguel", "Santiago", "Sibundoy",
    "Valle del Guamuez (La Hormiga)", "Villagarzón",

    // Quindío
    "Buenavista", "Calarcá", "Circasia", "Córdoba", "Filandia", "Génova",
    "La Tebaida", "Montenegro", "Pijao", "Quimbaya", "Salento",

    // Risaralda
    "Apía", "Balboa", "Belén de Umbría", "Dosquebradas", "Guática", "La Celia",
    "La Virginia", "Marsella", "Mistrató", "Pueblo Rico", "Quinchía",
    "Santa Rosa de Cabal", "Santuario",

    // Santander
    "Barbosa", "Barrancabermeja", "Charalá", "Cimitarra", "El Playón", "Floridablanca",
    "Girón", "La Belleza", "Lebrija", "Málaga", "Piedecuesta", "Puerto Wilches",
    "Sabana de Torres", "San Gil", "San Vicente de Chucurí", "Socorro", "Vélez",
    "Zapatoca",

    // Sucre
    "Corozal", "Coveñas", "Ovejas", "Sampués", "San Marcos", "San Onofre",
    "Santiago de Tolú", "Tolú Viejo",

    // Tolima
    "Alpujarra", "Alvarado", "Ambalema", "Anzoátegui", "Ataco", "Cajamarca",
    "Carmen de Apicalá", "Casabianca", "Chaparral", "Coello", "Coyaima", "Cunday",
    "Dolores", "Espinal", "Falan", "Flandes", "Fresno", "Guamo", "Herveo", "Honda",
    "Icononzo", "Lérida", "Líbano", "Mariquita", "Melgar", "Murillo", "Natagaima",
    "Ortega", "Palocabildo", "Planadas", "Prado", "Purificación", "Rioblanco",
    "Roncesvalles", "Rovira", "Saldaña", "San Antonio", "San Luis", "Santa Isabel",
    "Suárez", "Valle de San Juan", "Venadillo", "Villahermosa", "Villarrica",

    // Valle del Cauca
    "Alcalá", "Andalucía", "Ansermanuevo", "Argelia", "Bolívar", "Buenaventura",
    "Buga", "Bugalagrande", "Caicedonia", "Calima (El Darién)", "Candelaria",
    "Cartago", "Dagua", "El Águila", "El Cairo", "El Cerrito", "El Dovio",
    "Florida", "Ginebra", "Guacarí", "Guadalajara de Buga", "Jamundí",
    "La Cumbre", "La Unión", "La Victoria", "Obando", "Palmira", "Pradera",
    "Restrepo", "Riofrío", "Roldanillo", "San Pedro", "Sevilla", "Toro",
    "Trujillo", "Tuluá", "Ulloa", "Versalles", "Vijes", "Yotoco", "Yumbo", "Zarzal",

    // Vaupés
    "Carurú", "Taraira",

    // Vichada
    "Cumaribo", "La Primavera", "Santa Rosalía"
];
ciudadesColombia.sort();

const tiposViaColombia = [
    "Calle", "Carrera", "Avenida", "Transversal", "Diagonal",
    "Circular", "Autopista", "Vía", "Carretera", "Otro"
];
// --------------------------------

// --- NUEVO: Interfaz para la dirección estructurada ---
interface DireccionDetallada {
    ciudad: string;
    tipoVia: string;
    numeroPrincipal: string; // Para el número de Calle/Carrera, etc.
    numeroSecundario: string; // Para el primer número después del #
    numeroComplementario: string; // Para el número después del -
    detallesAdicionales: string; // Para apto, edificio, barrio, etc.
}

// --- NUEVO: Estado inicial vacío para la dirección ---
const direccionInicial: DireccionDetallada = {
    ciudad: '',
    tipoVia: '',
    numeroPrincipal: '',
    numeroSecundario: '',
    numeroComplementario: '',
    detallesAdicionales: ''
};
// ----------------------------------------------------

const SolicitarEnvio: React.FC = () => {
    // --- Estados del Formulario ---
    const [tipoServicio, setTipoServicio] = useState<TipoServicio>('SIMPLE');
    const [descripcion, setDescripcion] = useState('');
    const [horaRecogida, setHoraRecogida] = useState(''); // Inicio Renta
    const [horaEntrega, setHoraEntrega] = useState('');   // Fin Renta
    const [tipoVehiculo, setTipoVehiculo] = useState<TipoVehiculo>(''); // Vehículo Renta / Recomendado
    const [tiempoBodegaje, setTiempoBodegaje] = useState('');
    const [dimensionesContenido, setDimensionesContenido] = useState('');
    // Pasajeros
    const [numeroPasajeros, setNumeroPasajeros] = useState<string>('');
    const [tipoTarifaPasajero, setTipoTarifaPasajero] = useState<TipoTarifaPasajero>('');
    const [duracionEstimada, setDuracionEstimada] = useState<string>('');
    const [distanciaEstimada, setDistanciaEstimada] = useState<string>('');

    // --- REEMPLAZADOS: Estados de dirección ahora estructurados ---
    const [origenDetallado, setOrigenDetallado] = useState<DireccionDetallada>(direccionInicial);
    const [destinoDetallado, setDestinoDetallado] = useState<DireccionDetallada>(direccionInicial);
    // ------------------------------------------------------------

    // Estados Retiro Bodega
    const [inventarioDisponible, setInventarioDisponible] = useState<ClienteToService[]>([]);
    const [loadingInventario, setLoadingInventario] = useState(false);
    const [errorInventario, setErrorInventario] = useState<string | null>(null);
    const [cantidadesARetirar, setCantidadesARetirar] = useState<Record<number, number>>({});

    // Estados UI
    const [submitting, setSubmitting] = useState(false);
    const [errorApi, setErrorApi] = useState<string | null>(null);
    const [successApi, setSuccessApi] = useState<string | null>(null);

    // --- NUEVO: Handlers para actualizar direcciones estructuradas ---
    const handleOrigenChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setOrigenDetallado(prev => ({ ...prev, [name]: value }));
    };

    const handleDestinoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDestinoDetallado(prev => ({ ...prev, [name]: value }));
    };
    // ------------------------------------------------------------

    // --- Lógica ---
    const limpiarFormulario = useCallback(() => {
        setOrigenDetallado(direccionInicial); // Limpiar origen
        setDestinoDetallado(direccionInicial); // Limpiar destino
        setDescripcion(''); setHoraRecogida('');
        setHoraEntrega(''); setTipoVehiculo(''); setTiempoBodegaje('');
        setDimensionesContenido(''); setCantidadesARetirar({});
        setNumeroPasajeros(''); setTipoTarifaPasajero(''); setDuracionEstimada(''); setDistanciaEstimada('');
        setErrorApi(null); setSuccessApi(null);
        // No reseteamos tipoServicio aquí para mantener la selección
    }, []);

    const fetchInventarioCliente = useCallback(async () => {
        if (tipoServicio !== 'BODEGAJE_SALIDA') {
            setInventarioDisponible([]);
            return;
        }
        setLoadingInventario(true);
        setErrorInventario(null);
        setInventarioDisponible([]);
        try {
            const apiData = await getInventarioEmpresa();
            // --- CORRECCIÓN POTENCIAL: Asegurarse que producto_id_read exista ---
            const processedData = apiData
                .map(item => {
                    // Usa producto_id_read si existe, si no, quizás ID de producto? (Depende de tu API)
                    const prodId = item.producto_id_read;
                    if (prodId === null || prodId === undefined) {
                        console.warn("Item de inventario sin producto_id_read:", item);
                        return null; // O manejar de otra forma
                    }
                    return {
                        id: item.id,
                        producto_nombre: item.producto_nombre || "N/A",
                        ubicacion_nombre: item.ubicacion_nombre || "N/A", // Guardar para mostrar si es necesario
                        cantidad: item.cantidad,
                        producto_id: prodId // Usar el ID leído
                    };
                })
                .filter((item): item is ClienteToService => item !== null && item.cantidad > 0);
            setInventarioDisponible(processedData);
        } catch (err: any) {
            setErrorInventario("No se pudo cargar tu inventario.");
            console.error("Error cargando inventario cliente:", err);
        } finally {
            setLoadingInventario(false);
        }
    }, [tipoServicio]);

    useEffect(() => {
        if (tipoServicio === 'BODEGAJE_SALIDA') {
            fetchInventarioCliente();
        }
    }, [tipoServicio, fetchInventarioCliente]);

    const handleTipoServicioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nuevoTipo = e.target.value as TipoServicio;
        limpiarFormulario(); // Limpia campos específicos del tipo anterior
        setTipoServicio(nuevoTipo);
        // fetchInventario se activará en el useEffect si es BODEGAJE_SALIDA
    };

    const handleCantidadRetirarChange = (producto_id: number, cantidadInput: string) => {
        const cantidad = parseInt(cantidadInput, 10);
        const nuevaCantidad = !isNaN(cantidad) && cantidad >= 0 ? cantidad : 0;
        const itemInventario = inventarioDisponible.find(inv => inv.producto_id === producto_id);
        const maxCantidad = itemInventario ? itemInventario.cantidad : 0;
        setCantidadesARetirar(prev => ({
            ...prev,
            [producto_id]: Math.min(Math.max(0, nuevaCantidad), maxCantidad)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorApi(null); setSuccessApi(null); setSubmitting(true);

        // --- Construir strings de dirección ---
        const construirDireccionString = (dir: DireccionDetallada): string => {
            if (!dir.ciudad || !dir.tipoVia || !dir.numeroPrincipal) return ''; // Retorna vacío si faltan campos clave

            let direccionCompleta = `${dir.ciudad}, ${dir.tipoVia} ${dir.numeroPrincipal}`;
            if (dir.numeroSecundario) {
                direccionCompleta += ` # ${dir.numeroSecundario}`;
            }
            if (dir.numeroComplementario) {
                direccionCompleta += ` - ${dir.numeroComplementario}`;
            }
            if (dir.detallesAdicionales) {
                direccionCompleta += `, ${dir.detallesAdicionales}`;
            }
            // Elimina espacios extra y posible coma al final
            return direccionCompleta.trim().replace(/,\s*$/, "");
        };

        const origenString = construirDireccionString(origenDetallado);
        const destinoString = construirDireccionString(destinoDetallado);
        // ------------------------------------------

        let dataToSend: Partial<NuevoPedidoClienteData> = { tipo_servicio: tipoServicio };
        let valid = true;
        let errors: string[] = [];

        // --- Validaciones por Tipo de Servicio ---
        if (tipoServicio === 'SIMPLE') {
            if (!origenString) { valid = false; errors.push("Origen incompleto o inválido."); }
            if (!destinoString) { valid = false; errors.push("Destino incompleto o inválido."); }
            if (!horaRecogida) { valid = false; errors.push("Hora de Recogida es obligatoria."); }
            if (valid) {
                dataToSend = { ...dataToSend, origen: origenString, destino: destinoString, hora_recogida_programada: horaRecogida, hora_entrega_programada: horaEntrega || null, descripcion: descripcion || undefined, dimensiones_contenido: dimensionesContenido || null, tipo_vehiculo_requerido: tipoVehiculo || null };
            }
        }
        else if (tipoServicio === 'BODEGAJE_ENTRADA') {
            if (!origenString) { valid = false; errors.push("Origen incompleto o inválido."); }
            if (!horaRecogida) { valid = false; errors.push("Hora de Recogida es obligatoria."); }
            if (!tiempoBodegaje) { valid = false; errors.push("Tiempo de Bodegaje Estimado es obligatorio."); }
            if (valid) {
                 dataToSend = { ...dataToSend, origen: origenString, hora_recogida_programada: horaRecogida, tiempo_bodegaje_estimado: tiempoBodegaje, descripcion: descripcion || undefined, dimensiones_contenido: dimensionesContenido || null, tipo_vehiculo_requerido: tipoVehiculo || null };
            }
        }
        else if (tipoServicio === 'BODEGAJE_SALIDA') {
            if (!destinoString) { valid = false; errors.push("Destino incompleto o inválido."); }
            if (!horaEntrega) { valid = false; errors.push("Hora de Entrega es obligatoria."); }
            if (!descripcion) { valid = false; errors.push("Instrucciones Adicionales son obligatorias."); }

            const itemsParaEnviar = Object.entries(cantidadesARetirar)
                .filter(([_, cantidad]) => cantidad > 0)
                .map(([idStr, cantidad]) => ({ producto_id: Number(idStr), cantidad }));

            if (itemsParaEnviar.length === 0) { valid = false; errors.push("Debe seleccionar al menos un producto y cantidad a retirar."); }
            else { /* Validación stock */
                 for (const item of itemsParaEnviar) {
                      const itemInv = inventarioDisponible.find(inv => inv.producto_id === item.producto_id);
                      if (!itemInv || item.cantidad > itemInv.cantidad) {
                          valid = false; errors.push(`Stock insuficiente re-validando prod ID ${item.producto_id}.`); break;
                      }
                  }
             }
             if (valid) {
                dataToSend = { ...dataToSend, destino: destinoString, hora_entrega_programada: horaEntrega, descripcion: descripcion, items_a_retirar: itemsParaEnviar, tipo_vehiculo_requerido: tipoVehiculo || null };
             }
        }
        else if (tipoServicio === 'PASAJEROS') {
            if (!origenString) { valid = false; errors.push("Origen incompleto o inválido."); }
            if (!destinoString) { valid = false; errors.push("Destino incompleto o inválido."); }
            if (!horaRecogida) { valid = false; errors.push("Hora de Recogida/Inicio es obligatoria."); }
            // ... (resto validaciones pasajeros) ...
            const numPasajerosInt = parseInt(numeroPasajeros, 10);
            const duracionFloat = parseFloat(duracionEstimada);
            const distanciaFloat = parseFloat(distanciaEstimada);
            if (isNaN(numPasajerosInt) || numPasajerosInt <= 0) { valid = false; errors.push("Número de pasajeros inválido."); }
            if (!tipoTarifaPasajero) { valid = false; errors.push("Debe seleccionar un tipo de tarifa."); }
            if (tipoTarifaPasajero === 'TIEMPO' && (isNaN(duracionFloat) || duracionFloat <= 0)) { valid = false; errors.push("Duración estimada inválida."); }
            if (tipoTarifaPasajero === 'DISTANCIA' && (isNaN(distanciaFloat) || distanciaFloat <= 0)) { valid = false; errors.push("Distancia estimada inválida."); }

             if (valid) {
                 dataToSend = { ...dataToSend, origen: origenString, destino: destinoString, hora_recogida_programada: horaRecogida, hora_entrega_programada: horaEntrega || null, descripcion: descripcion || undefined, numero_pasajeros: numPasajerosInt, tipo_tarifa_pasajero: tipoTarifaPasajero, duracion_estimada_horas: tipoTarifaPasajero === 'TIEMPO' ? duracionFloat : null, distancia_estimada_km: tipoTarifaPasajero === 'DISTANCIA' ? distanciaFloat : null, tipo_vehiculo_requerido: tipoVehiculo || null };
             }
        }
        else if (tipoServicio === 'RENTA_VEHICULO') {
            if (!horaRecogida) { valid = false; errors.push("Fecha/Hora de Inicio Renta obligatoria."); }
            if (!horaEntrega) { valid = false; errors.push("Fecha/Hora de Fin Renta obligatoria."); }
            if (!tipoVehiculo) { valid = false; errors.push("Debe seleccionar el tipo de vehículo a rentar."); }
            if (horaRecogida && horaEntrega && new Date(horaRecogida) >= new Date(horaEntrega)) { valid = false; errors.push("La fecha/hora de fin debe ser posterior a la de inicio."); }
            if (valid) {
                dataToSend = { ...dataToSend, hora_recogida_programada: horaRecogida, hora_entrega_programada: horaEntrega, tipo_vehiculo_requerido: tipoVehiculo, descripcion: descripcion || undefined };
            }
        }

        // --- Fin Validaciones por Tipo ---

        if (!valid) {
            setErrorApi(errors.join(' '));
            setSubmitting(false);
            return;
        }

        // --- Llamada a la API ---
        try {
            console.log("[SolicitarEnvio] Enviando datos (construidos):", dataToSend);
            const pedidoCreado = await createPedidoTransporteCliente(dataToSend as Required<NuevoPedidoClienteData>);
            setSuccessApi(`¡Pedido #${pedidoCreado.id} creado exitosamente! Tipo: ${tipoServicio}, Estado: ${pedidoCreado.estado}`);
            limpiarFormulario();
        } catch (err: any) {
            console.error("Error API al crear pedido:", err.response?.data || err.message || err);
            const backendError = err.response?.data;
            let errorMsg = "Error desconocido al crear el pedido.";
            if (backendError) {
                if (backendError.detail) { errorMsg = backendError.detail; }
                else if (typeof backendError === 'object') { errorMsg = Object.entries(backendError).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; '); }
                if (!errorMsg) errorMsg = "Error de validación en el servidor.";
            } else if (err.message) { errorMsg = err.message; }
            setErrorApi(errorMsg);
         } finally {
            setSubmitting(false);
         }
    }; // Fin handleSubmit

    // --- Renderizado ---
    return (
        <div className={styles.solicitarFormContainer}>
            <h3>Solicitar Nuevo Servicio</h3>
            <form onSubmit={handleSubmit} className={styles.solicitarForm}>

                {/* === Selector Tipo Servicio === */}
                <div className={styles.inputGroup}>
                    <label htmlFor="tipoServicio" className={styles.label}>Tipo de Servicio Requerido:*</label>
                    <select id="tipoServicio" value={tipoServicio} onChange={handleTipoServicioChange} required className={styles.select}>
                        <option value="SIMPLE">Envío Simple (Mercancía)</option>
                        <option value="BODEGAJE_ENTRADA">Dejar Mercancía en Bodega</option>
                        <option value="BODEGAJE_SALIDA">Retirar Mercancía de Bodega</option>
                        <option value="PASAJEROS">Transporte de Pasajeros</option>
                        <option value="RENTA_VEHICULO">Renta Vehículo con Conductor</option>
                    </select>
                </div>
                <hr className={styles.separator}/>

                {/* === Secciones Condicionales === */}

                {/* --- Sección Recogida (MODIFICADA) --- */}
                 {(tipoServicio === 'SIMPLE' || tipoServicio === 'BODEGAJE_ENTRADA' || tipoServicio === 'PASAJEROS') && (
                    <>
                        <h4>Detalles de Origen / Recogida*</h4>
                        {/* Ciudad Origen */}
                        <div className={styles.inputGroup}>
                            <label htmlFor="origen-ciudad" className={styles.label}>Ciudad:*</label>
                            <select id="origen-ciudad" name="ciudad" value={origenDetallado.ciudad} onChange={handleOrigenChange} required className={styles.select}>
                                <option value="" disabled>-- Selecciona Ciudad --</option>
                                {ciudadesColombia.map(ciudad => <option key={`orig-${ciudad}`} value={ciudad}>{ciudad}</option>)}
                            </select>
                        </div>
                        {/* Dirección Estructurada Origen */}
                        <div className={styles.direccionGrid}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="origen-tipoVia" className={styles.label}>Tipo Vía:*</label>
                                <select id="origen-tipoVia" name="tipoVia" value={origenDetallado.tipoVia} onChange={handleOrigenChange} required className={styles.select}>
                                     <option value="" disabled>-- Tipo --</option>
                                     {tiposViaColombia.map(tipo => <option key={`orig-via-${tipo}`} value={tipo}>{tipo}</option>)}
                                </select>
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="origen-numeroPrincipal" className={styles.label}>Número Ppal:*</label>
                                <input type="text" id="origen-numeroPrincipal" name="numeroPrincipal" value={origenDetallado.numeroPrincipal} onChange={handleOrigenChange} required className={styles.input} placeholder="Ej: 72"/>
                            </div>
                             <span className={styles.direccionSeparator}>#</span>
                             <div className={styles.inputGroup}>
                                <label htmlFor="origen-numeroSecundario" className={styles.label}>Número Sec:</label>
                                <input type="text" id="origen-numeroSecundario" name="numeroSecundario" value={origenDetallado.numeroSecundario} onChange={handleOrigenChange} className={styles.input} placeholder="Ej: 10"/>
                            </div>
                             <span className={styles.direccionSeparator}>-</span>
                            <div className={styles.inputGroup}>
                                <label htmlFor="origen-numeroComplementario" className={styles.label}>Complem:</label>
                                <input type="text" id="origen-numeroComplementario" name="numeroComplementario" value={origenDetallado.numeroComplementario} onChange={handleOrigenChange} className={styles.input} placeholder="Ej: 34"/>
                            </div>
                        </div>
                        {/* Detalles Adicionales Origen */}
                         <div className={styles.inputGroup}>
                            <label htmlFor="origen-detallesAdicionales" className={styles.label}>Detalles Adicionales:</label>
                            <textarea id="origen-detallesAdicionales" name="detallesAdicionales" value={origenDetallado.detallesAdicionales} onChange={handleOrigenChange} className={styles.textarea} rows={2} placeholder="Ej: Apto 501, Edificio Plaza, Barrio Chapinero"/>
                        </div>
                    </>
                 )}
                 {/* Hora Inicio/Recogida */}
                 {(tipoServicio === 'SIMPLE' || tipoServicio === 'BODEGAJE_ENTRADA' || tipoServicio === 'PASAJEROS' || tipoServicio === 'RENTA_VEHICULO') && (
                    <div className={styles.inputGroup}>
                           <label htmlFor="horaRecogida" className={styles.label}>
                               {tipoServicio === 'RENTA_VEHICULO' ? 'Fecha/Hora Inicio Renta:*' : 'Fecha/Hora Programada Recogida:*'}
                           </label>
                           <input type="datetime-local" id="horaRecogida" value={horaRecogida} onChange={(e) => setHoraRecogida(e.target.value)} required className={styles.input} />
                    </div>
                 )}
                 {(tipoServicio === 'SIMPLE' || tipoServicio === 'BODEGAJE_ENTRADA' || tipoServicio === 'PASAJEROS') && <hr className={styles.separator}/>}

                 {/* --- Sección Entrega (MODIFICADA) --- */}
                 {(tipoServicio === 'SIMPLE' || tipoServicio === 'BODEGAJE_SALIDA' || tipoServicio === 'PASAJEROS') && (
                    <>
                        <h4>Detalles de Destino / Entrega*</h4>
                         {/* Ciudad Destino */}
                        <div className={styles.inputGroup}>
                            <label htmlFor="destino-ciudad" className={styles.label}>Ciudad:*</label>
                            <select id="destino-ciudad" name="ciudad" value={destinoDetallado.ciudad} onChange={handleDestinoChange} required className={styles.select}>
                                <option value="" disabled>-- Selecciona Ciudad --</option>
                                {ciudadesColombia.map(ciudad => <option key={`dest-${ciudad}`} value={ciudad}>{ciudad}</option>)}
                            </select>
                        </div>
                        {/* Dirección Estructurada Destino */}
                         <div className={styles.direccionGrid}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="destino-tipoVia" className={styles.label}>Tipo Vía:*</label>
                                <select id="destino-tipoVia" name="tipoVia" value={destinoDetallado.tipoVia} onChange={handleDestinoChange} required className={styles.select}>
                                     <option value="" disabled>-- Tipo --</option>
                                     {tiposViaColombia.map(tipo => <option key={`dest-via-${tipo}`} value={tipo}>{tipo}</option>)}
                                </select>
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="destino-numeroPrincipal" className={styles.label}>Número Ppal:*</label>
                                <input type="text" id="destino-numeroPrincipal" name="numeroPrincipal" value={destinoDetallado.numeroPrincipal} onChange={handleDestinoChange} required className={styles.input} placeholder="Ej: 100"/>
                            </div>
                             <span className={styles.direccionSeparator}>#</span>
                             <div className={styles.inputGroup}>
                                <label htmlFor="destino-numeroSecundario" className={styles.label}>Número Sec:</label>
                                <input type="text" id="destino-numeroSecundario" name="numeroSecundario" value={destinoDetallado.numeroSecundario} onChange={handleDestinoChange} className={styles.input} placeholder="Ej: 20"/>
                            </div>
                             <span className={styles.direccionSeparator}>-</span>
                            <div className={styles.inputGroup}>
                                <label htmlFor="destino-numeroComplementario" className={styles.label}>Complem:</label>
                                <input type="text" id="destino-numeroComplementario" name="numeroComplementario" value={destinoDetallado.numeroComplementario} onChange={handleDestinoChange} className={styles.input} placeholder="Ej: 50"/>
                            </div>
                        </div>
                        {/* Detalles Adicionales Destino */}
                         <div className={styles.inputGroup}>
                            <label htmlFor="destino-detallesAdicionales" className={styles.label}>Detalles Adicionales:</label>
                            <textarea id="destino-detallesAdicionales" name="detallesAdicionales" value={destinoDetallado.detallesAdicionales} onChange={handleDestinoChange} className={styles.textarea} rows={2} placeholder="Ej: Oficina 302, Zona Franca, Bodega 5"/>
                        </div>
                    </>
                 )}
                 {/* Hora Fin/Entrega */}
                 {(tipoServicio === 'SIMPLE' || tipoServicio === 'BODEGAJE_SALIDA' || tipoServicio === 'PASAJEROS' || tipoServicio === 'RENTA_VEHICULO') && (
                    <div className={styles.inputGroup}>
                            <label htmlFor="horaEntrega" className={styles.label}>
                                {tipoServicio === 'RENTA_VEHICULO' ? 'Fecha/Hora Fin Renta:*' : (tipoServicio === 'BODEGAJE_SALIDA' ? 'Fecha/Hora Programada Entrega:*' : 'Fecha/Hora Programada Entrega (Opcional):')}
                            </label>
                            <input type="datetime-local" id="horaEntrega" value={horaEntrega} onChange={(e) => setHoraEntrega(e.target.value)} required={tipoServicio === 'RENTA_VEHICULO' || tipoServicio === 'BODEGAJE_SALIDA'} className={styles.input} />
                    </div>
                 )}
                 {(tipoServicio === 'SIMPLE' || tipoServicio === 'BODEGAJE_SALIDA' || tipoServicio === 'PASAJEROS' || tipoServicio === 'RENTA_VEHICULO') && <hr className={styles.separator}/>}

                {/* --- Sección Bodegaje (ENTRADA) --- */}
                {tipoServicio === 'BODEGAJE_ENTRADA' && (
                    <>
                        <h4>Detalles de Bodegaje</h4>
                        <div className={styles.inputGroup}>
                            <label htmlFor="tiempoBodegaje" className={styles.label}>Tiempo Estimado en Bodega:*</label>
                            <input type="text" id="tiempoBodegaje" value={tiempoBodegaje} onChange={(e) => setTiempoBodegaje(e.target.value)} required className={styles.input} placeholder="Ej: 1 mes, Indefinido" />
                        </div>
                        <div className={styles.inputGroup}>
                           <label htmlFor="dimensionesContenido" className={styles.label}>Dimensiones/Tamaño Total Contenido (Opcional):</label>
                           <input type="text" id="dimensionesContenido" value={dimensionesContenido} onChange={(e) => setDimensionesContenido(e.target.value)} className={styles.input} placeholder="Ej: Caja 50x30x20cm" />
                        </div>
                         <hr className={styles.separator}/>
                    </>
                )}

                {/* --- Sección Retirar de Bodega (SALIDA) --- */}
                 {tipoServicio === 'BODEGAJE_SALIDA' && (
                     <div className={styles.retiroSection}>
                         <h4>Seleccionar Productos a Retirar*</h4>
                         {loadingInventario && <p>Cargando inventario...</p>}
                         {errorInventario && <p className={styles.formError}>{errorInventario}</p>}
                         {!loadingInventario && !errorInventario && (
                             inventarioDisponible.length === 0
                                 ? <p>No tienes inventario disponible en bodega.</p>
                                 : <div className={styles.tablaRetiroContainer}>
                                     <table className={styles.tablaRetiro}>
                                         <thead>
                                            <tr><th>Producto</th><th>Ubicación</th><th>Disp.</th><th>Retirar*</th></tr>
                                        </thead>
                                         <tbody>
                                             {inventarioDisponible.map(item => (
                                                 <tr key={item.producto_id}>
                                                     <td>{item.producto_nombre}</td>
                                                     {/* Muestra ubicación si la tienes en ClienteToService */}
                                                     <td>{item.ubicacion_nombre || 'N/A'}</td>
                                                     <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                                                     <td>
                                                         <input type="number" min="0" max={item.cantidad} value={cantidadesARetirar[item.producto_id] || 0} onChange={(e) => handleCantidadRetirarChange(item.producto_id, e.target.value)} className={styles.inputCantidadRetiro} disabled={item.cantidad === 0} placeholder="0"/>
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                         )}
                          <hr className={styles.separator}/>
                     </div>
                 )}

                 {/* --- Sección: PASAJEROS --- */}
                 {tipoServicio === 'PASAJEROS' && (
                    <>
                        <h4>Detalles del Viaje de Pasajeros</h4>
                        <div className={styles.inputGroup}>
                            <label htmlFor="numeroPasajeros" className={styles.label}>Número de Pasajeros:*</label>
                            <input type="number" id="numeroPasajeros" min="1" step="1" value={numeroPasajeros} onChange={(e) => setNumeroPasajeros(e.target.value)} required className={styles.input} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="tipoTarifaPasajero" className={styles.label}>Tipo de Tarifa:*</label>
                            <select id="tipoTarifaPasajero" value={tipoTarifaPasajero} onChange={(e) => setTipoTarifaPasajero(e.target.value as TipoTarifaPasajero)} required className={styles.select}>
                                <option value="">-- Seleccione --</option> <option value="TIEMPO">Por Tiempo</option> <option value="DISTANCIA">Por Distancia</option>
                            </select>
                        </div>
                        {tipoTarifaPasajero === 'TIEMPO' && ( <div className={styles.inputGroup}> <label htmlFor="duracionEstimada" className={styles.label}>Duración Estimada (Horas):*</label> <input type="number" id="duracionEstimada" min="0.1" step="0.1" value={duracionEstimada} onChange={(e) => setDuracionEstimada(e.target.value)} required className={styles.input} placeholder="Ej: 2.5"/> </div> )}
                        {tipoTarifaPasajero === 'DISTANCIA' && ( <div className={styles.inputGroup}> <label htmlFor="distanciaEstimada" className={styles.label}>Distancia Estimada (Km):*</label> <input type="number" id="distanciaEstimada" min="0.1" step="0.1" value={distanciaEstimada} onChange={(e) => setDistanciaEstimada(e.target.value)} required className={styles.input} placeholder="Ej: 15.3"/> </div> )}
                        <hr className={styles.separator}/>
                    </>
                 )}

                 {/* --- Sección: RENTA VEHÍCULO --- */}
                 {tipoServicio === 'RENTA_VEHICULO' && (
                     <>
                         <h4>Detalles de la Renta</h4>
                         <div className={styles.inputGroup}>
                            <label htmlFor="tipoVehiculoRenta" className={styles.label}>Tipo de Vehículo a Rentar:*</label>
                            <select id="tipoVehiculoRenta" value={tipoVehiculo} onChange={(e) => setTipoVehiculo(e.target.value as TipoVehiculo)} required className={styles.select}>
                                <option value="">-- Seleccione Vehículo --</option> <option value="MOTO">Moto</option> <option value="PEQUENO">Pequeño (Automóvil)</option> <option value="MEDIANO">Mediano (Camioneta)</option> <option value="GRANDE">Grande (Furgón)</option>
                            </select>
                        </div>
                        <hr className={styles.separator}/>
                     </>
                 )}

                 {/* --- Campos Comunes Finales --- */}
                 <h4>Detalles Adicionales</h4>
                  <div className={styles.inputGroup}>
                      <label htmlFor="descripcion" className={styles.label}>
                          { tipoServicio === 'BODEGAJE_SALIDA' ? 'Instrucciones Adicionales (Retiro Bodega):*' : (tipoServicio === 'RENTA_VEHICULO' ? 'Notas/Requisitos Renta (Opcional):' : (tipoServicio === 'PASAJEROS' ? 'Notas Adicionales Pasajeros (Opcional):' : 'Descripción Contenido (Opcional):'))}
                      </label>
                      <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className={styles.textarea} required={tipoServicio === 'BODEGAJE_SALIDA'} />
                  </div>
                  {tipoServicio !== 'RENTA_VEHICULO' && tipoServicio !== 'BODEGAJE_SALIDA' && (
                      <div className={styles.inputGroup}>
                        <label htmlFor="tipoVehiculo" className={styles.label}>Tipo Vehículo Recomendado (Opcional):</label>
                        <select id="tipoVehiculo" value={tipoVehiculo} onChange={(e) => setTipoVehiculo(e.target.value as TipoVehiculo)} className={styles.select}>
                            <option value="">-- No especificar --</option> <option value="MOTO">Moto</option> <option value="PEQUENO">Pequeño (Automóvil)</option> <option value="MEDIANO">Mediano (Camioneta)</option> <option value="GRANDE">Grande (Furgón)</option>
                        </select>
                    </div>
                  )}

                 {/* --- Mensajes y Botón Submit --- */}
                 <hr className={styles.separator} />
                 {errorApi && <p className={styles.formError}>{errorApi}</p>}
                 {successApi && <p className={styles.formSuccess}>{successApi}</p>}
                 <button type="submit" disabled={submitting || (tipoServicio === 'BODEGAJE_SALIDA' && loadingInventario)} className={styles.submitButton}>
                     {submitting ? 'Enviando Solicitud...' : 'Solicitar Servicio'}
                 </button>
            </form>
        </div>
    );

} // Fin SolicitarEnvio

export default SolicitarEnvio;