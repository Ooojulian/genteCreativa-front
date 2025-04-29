// frontend/src/components/Inventario/GestionInventario.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    getInventarioJefe,
    // createInventario, updateInventario, deleteInventario, // Mantenlos comentados si ya no los usas directamente
    getProductos,
    getUbicaciones,
    registrarEntradaInventario,
    registrarSalidaInventario,
    exportarInventarioExcel
} from '../../services/bodegaje'; // <-- Importa de bodegaje.ts
import { getEmpresas } from '../../services/empresas'; // <-- Importa getEmpresas de empresas.ts
// --- Importa los estilos ---
import styles from '../../styles/Inventario/GestionInventario.module.css'; // <-- Ajusta la ruta a tu archivo CSS
import { InventarioDataOutput, EntradaInventarioPayload, SalidaInventarioPayload} from '../../types/pedido';


// --- Interfaces ---
interface EmpresaData { id: number; nombre: string; /* ...otros? */ }
interface ProductoDataOutput { id: number; nombre: string; sku: string; }
interface UbicacionDataOutput { id: number; nombre: string; }

interface InventarioFiltrosLocal {
    empresaId: number | string;
    productoId: number | string; // <-- NUEVO
    ubicacionId: number | string; // <-- NUEVO
    // Añade otros filtros locales si los necesitas
}

// --- INTERFAZ LOCAL ACTUALIZADA ---
// Refleja los datos que SÍ vienen de la API
interface InventarioItem { // O el nombre que uses para el useState
    id: number;
    producto_nombre: string;    // <-- ¿Está así?
    ubicacion_nombre: string;   // <-- ¿Está así?
    producto_id_read?: number;
    cantidad: number;
    fecha_actualizacion: string;
    empresa: { id: number; nombre: string; } | null; // Asume EmpresaData definida o importada
    // Los siguientes son opcionales si no los usas aquí
    // producto_id?: number;
    // ubicacion_id?: number;
}
// ---------------------------------

// Interfaces para Crear/Actualizar (no cambian)
interface InventarioCreateInput { producto_id: number; ubicacion_id: number; cantidad: number; empresa_id: number; }
interface InventarioUpdateInput { cantidad: number; }

// Función formateo fecha
const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return '--';
    try { const date = new Date(isoString); return date.toLocaleString('es-ES'); }
    catch (e) { console.error("Error date format:", e); return isoString; }
};

const GestionInventario: React.FC = () => {
    // --- Estados Lista y Selects ---
    const [inventario, setInventario] = useState<InventarioDataOutput[]>([]);
    const [productos, setProductos] = useState<ProductoDataOutput[]>([]);
    const [ubicaciones, setUbicaciones] = useState<UbicacionDataOutput[]>([]);
    const [empresasCliente, setEmpresasCliente] = useState<EmpresaData[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Para la lista
    const [isOptionsLoading, setIsOptionsLoading] = useState(true); // Para selects
    const [error, setError] = useState<string | null>(null); // Error de carga lista/selects
    const [filtrosLista, setFiltrosLista] = useState<InventarioFiltrosLocal>({
        empresaId: '',
        productoId: '', // <-- NUEVO
        ubicacionId: '', // <-- NUEVO
    });
    const [loadingExport, setLoadingExport] = useState(false);
    const [errorExport, setErrorExport] = useState<string | null>(null);

    // --- Estados para Filtros de la Lista (Opcional) ---
    const [filtroEmpresaLista, setFiltroEmpresaLista] = useState<number | string>('');

    // --- Estados del Formulario de Entrada/Salida ---
    const [showForm, setShowForm] = useState<'ENTRADA' | 'SALIDA' | false>(false); // Controla qué form mostrar
    const [formProductoId, setFormProductoId] = useState<number | string>('');
    const [formUbicacionId, setFormUbicacionId] = useState<number | string>('');
    const [formEmpresaId, setFormEmpresaId] = useState<number | string>('');
    const [formCantidad, setFormCantidad] = useState<number | string>('');
    const [formMotivo, setFormMotivo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // --- Carga de Datos ---
    const fetchSelectOptions = useCallback(async () => {
        setIsOptionsLoading(true); setError(null);
        try {
            const [prodsData, ubiData, empData] = await Promise.all([getProductos(), getUbicaciones(), getEmpresas()]);
            setProductos(prodsData); setUbicaciones(ubiData); setEmpresasCliente(empData);
        } catch (e: any) { setError(e.message || "Error al cargar opciones."); }
        finally { setIsOptionsLoading(false); }
    }, []);

    const handleFiltroListaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFiltrosLista(prev => ({ ...prev, [name]: value }));
         // Limpia mensajes al cambiar filtros
        setFormSuccess(null);
        setError(null);
    };

    const fetchInventario = useCallback(async () => {
        setIsLoading(true); setError(null); // Limpia error de lista
        // Prepara los filtros para la API usando los nombres que espera el backend
        const apiFiltros: { [key: string]: any } = {};
        if (filtrosLista.empresaId) { apiFiltros.empresa = filtrosLista.empresaId; }
        if (filtrosLista.productoId) { apiFiltros.producto = filtrosLista.productoId; }
        if (filtrosLista.ubicacionId) { apiFiltros.ubicacion = filtrosLista.ubicacionId; }

        console.log("[GestionInventario] Fetching inventario con filtros:", apiFiltros);

        try {
            const data = await getInventarioJefe(apiFiltros); // Pasa los filtros a la API
            setInventario(data);
        } catch (err: any) { setError(err.message || "Error al cargar inventario"); setInventario([]);}
        finally { setIsLoading(false); }
    // Depende del objeto de filtros completo
    }, [filtrosLista]);

    useEffect(() => { fetchSelectOptions(); }, [fetchSelectOptions]);
    useEffect(() => { fetchInventario(); }, [fetchInventario]); // Se llama al inicio y cuando cambia filtroEmpresaLista

    // --- Handlers Formulario ---
    const resetForm = () => {
        setFormProductoId(''); setFormUbicacionId(''); setFormEmpresaId('');
        setFormCantidad(''); setFormMotivo('');
        setShowForm(false); setFormError(null); setFormSuccess(null); setIsSubmitting(false);
    };

    const handleShowForm = (tipo: 'ENTRADA' | 'SALIDA') => {
        resetForm(); // Limpia antes de mostrar
        setShowForm(tipo);
        window.scrollTo(0, 0); // Sube para ver el form
    };

    const handleExportarExcel = async () => {
        setLoadingExport(true);
        setErrorExport(null); // Limpia error previo
        console.log("[GestionInventario] Iniciando exportación con filtros:", filtrosLista);

        // Prepara los filtros para la API (igual que en fetchInventario)
        const apiFiltros: { [key: string]: any } = {};
        if (filtrosLista.empresaId) { apiFiltros.empresa = filtrosLista.empresaId; }
        if (filtrosLista.productoId) { apiFiltros.producto = filtrosLista.productoId; }
        if (filtrosLista.ubicacionId) { apiFiltros.ubicacion = filtrosLista.ubicacionId; }

        try {
            const blob = await exportarInventarioExcel(apiFiltros);

            // Crear URL temporal para el Blob
            const fileURL = window.URL.createObjectURL(blob);

            // Crear un enlace temporal para iniciar la descarga
            const link = document.createElement('a');
            link.href = fileURL;
            // Nombre del archivo que se sugerirá al usuario
            link.setAttribute('download', 'reporte_inventario.xlsx');
            // Añadir enlace al DOM (necesario para Firefox)
            document.body.appendChild(link);
            // Simular clic en el enlace
            link.click();
            // Limpiar eliminando el enlace y revocando la URL del objeto
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(fileURL);

            console.log("[GestionInventario] Descarga de Excel iniciada.");

        } catch (error: any) {
            console.error("[GestionInventario] Error al exportar Excel:", error);
            setErrorExport(error.message || "No se pudo generar el archivo Excel.");
        } finally {
            setLoadingExport(false);
        }
    };  {/* --- Título y Botón Exportar --- */}
    <div className={styles.listHeader}> {/* Contenedor para título y botón */}
         <h4 className={styles.listTitle}>Inventario Actual</h4>
         {/* --- NUEVO BOTÓN EXPORTAR --- */}
         <button
            onClick={handleExportarExcel}
            className={`${styles.commonButton} ${styles.exportButton}`} // Estilo específico
            disabled={loadingExport || isLoading || inventario.length === 0} // Deshabilita si carga lista, exporta o no hay datos
         >
            {loadingExport ? 'Exportando...' : 'Exportar a Excel'}
         </button>
         {/* -------------------------- */}
    </div>
     {/* Muestra error de exportación si ocurre */}
    {errorExport && <p className={styles.generalError}>{errorExport}</p>}

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showForm) return; // No debería pasar, pero por si acaso

        setFormError(null); setFormSuccess(null); setIsSubmitting(true);

        // Validaciones comunes
        if (!formProductoId || !formUbicacionId || !formEmpresaId || !formCantidad) {
            setFormError("Producto, Ubicación, Empresa y Cantidad son requeridos.");
            setIsSubmitting(false); return;
        }
        const numCantidad = Number(formCantidad);
        if (isNaN(numCantidad) || numCantidad <= 0) {
            setFormError("La cantidad debe ser un número positivo.");
            setIsSubmitting(false); return;
        }

        try {
            let mensajeExito = '';
            if (showForm === 'ENTRADA') {
                const payload: EntradaInventarioPayload = {
                    producto_id: Number(formProductoId),
                    ubicacion_id: Number(formUbicacionId),
                    empresa_id: Number(formEmpresaId),
                    cantidad: numCantidad,
                    motivo: formMotivo.trim() || null
                };
                await registrarEntradaInventario(payload);
                mensajeExito = `Entrada de ${numCantidad} unidad(es) registrada exitosamente.`;

            } else if (showForm === 'SALIDA') {
                const payload: SalidaInventarioPayload = {
                    producto_id: Number(formProductoId),
                    ubicacion_id: Number(formUbicacionId),
                    empresa_id: Number(formEmpresaId),
                    cantidad: numCantidad,
                    motivo: formMotivo.trim() || null
                };
                const respuesta = await registrarSalidaInventario(payload);
                mensajeExito = respuesta.detail || `Salida de ${numCantidad} unidad(es) registrada exitosamente.`; // Usa el detalle si viene (ej. stock cero)
            }

            setFormSuccess(mensajeExito);
            resetForm(); // Cierra y limpia form
            fetchInventario(); // Recarga la lista de inventario

        } catch (err: any) {
            const errorData = err.response?.data;
            let errorMsg = err.message || `Error al registrar ${showForm === 'ENTRADA' ? 'entrada' : 'salida'}.`;
            if (typeof errorData === 'object' && errorData !== null) {
                 errorMsg = errorData.detail || // Mensaje específico de la API (ej. "Stock insuficiente")
                            Object.entries(errorData) // Errores de serializer
                                   .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(',') : v}`)
                                   .join('; ') || "Error de validación.";
            }
            setFormError(errorMsg);
            console.error("Submit error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Renderizado ---
    // --- Renderizado del Componente ---
    return (
        <div className={styles.gestionContainer}>
            <h3>Gestionar Inventario (Entradas/Salidas)</h3>

            {/* --- Barra de Acciones Entrada/Salida --- */}
            <div className={styles.actionBar}>
                 <button onClick={() => handleShowForm('ENTRADA')} className={`${styles.commonButton} ${styles.createButton}`} disabled={showForm !== false}>
                     + Registrar Entrada
                 </button>
                 <button onClick={() => handleShowForm('SALIDA')} className={`${styles.commonButton} ${styles.cancelButton}`} disabled={showForm !== false}>
                     - Registrar Salida
                 </button>
                  {/* Mensaje de éxito general (cuando el form está cerrado) */}
                 {!showForm && formSuccess && <p className={styles.generalSuccess}>{formSuccess}</p>}
                 {/* Error general de carga */}
                 {error && <p className={styles.generalError}>{error}</p>}
            </div>
            {/* --- Título y Botón Exportar --- */}
            <div className={styles.listHeader}> {/* Contenedor para título y botón */}
                 {/* --- NUEVO BOTÓN EXPORTAR --- */}
                 <button
                    onClick={handleExportarExcel}
                    className={`${styles.commonButton} ${styles.exportButton}`} // Estilo específico
                    disabled={loadingExport || isLoading || inventario.length === 0} // Deshabilita si carga lista, exporta o no hay datos
                 >
                    {loadingExport ? 'Exportando...' : 'Exportar a Excel'}
                 </button>
                 {/* -------------------------- */}
            </div>
             {/* Muestra error de exportación si ocurre */}
            {errorExport && <p className={styles.generalError}>{errorExport}</p>}

            {/* --- Formulario Condicional para Entrada/Salida --- */}
            {showForm && (
                <form onSubmit={handleSubmit} className={styles.inventoryForm}>
                     <h4>{showForm === 'ENTRADA' ? 'Registrar Entrada de Inventario' : 'Registrar Salida de Inventario'}</h4>

                     {/* Select Producto */}
                     <div className={styles.inputGroup}>
                         <label htmlFor="inv-prod" className={styles.label}>Producto:*</label>
                         <select id="inv-prod" value={formProductoId} onChange={e => setFormProductoId(e.target.value)} required className={styles.select} disabled={isOptionsLoading}>
                             <option value="" disabled>-- Selecciona Producto --</option>
                             {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>)}
                         </select>
                     </div>

                     {/* Select Ubicación */}
                     <div className={styles.inputGroup}>
                         <label htmlFor="inv-ubi" className={styles.label}>Ubicación:*</label>
                          <select id="inv-ubi" value={formUbicacionId} onChange={e => setFormUbicacionId(e.target.value)} required className={styles.select} disabled={isOptionsLoading}>
                             <option value="" disabled>-- Selecciona Ubicación --</option>
                             {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                         </select>
                     </div>

                      {/* Select Empresa Cliente */}
                     <div className={styles.inputGroup}>
                         <label htmlFor="inv-emp" className={styles.label}>Empresa Cliente:*</label>
                         <select id="inv-emp" value={formEmpresaId} onChange={e => setFormEmpresaId(e.target.value)} required className={styles.select} disabled={isOptionsLoading}>
                             <option value="" disabled>-- Selecciona Empresa --</option>
                             {empresasCliente.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                         </select>
                     </div>

                     {/* Input Cantidad */}
                     <div className={styles.inputGroup}>
                         <label htmlFor="inv-cant" className={styles.label}>Cantidad:*</label>
                         <input id="inv-cant" type="number" min="1" step="1" value={formCantidad} onChange={e => setFormCantidad(e.target.value)} required className={styles.input} placeholder="Cantidad a ingresar o retirar"/>
                     </div>

                     {/* Textarea Motivo */}
                     <div className={styles.inputGroup}>
                         <label htmlFor="inv-motivo" className={styles.label}>Motivo (Opcional):</label>
                         <textarea id="inv-motivo" value={formMotivo} onChange={e => setFormMotivo(e.target.value)} className={styles.textarea} rows={2} placeholder="Ej: Ajuste inventario, Devolución cliente X"/>
                     </div>

                     {/* Mensajes y Botones */}
                     {formError && <p className={styles.formError}>{formError}</p>}
                     {/* No mostramos success dentro del form, se muestra al cerrar */}
                     <div className={styles.buttonGroup}>
                         <button type="submit" disabled={isSubmitting || isOptionsLoading} className={`${styles.commonButton} ${showForm === 'ENTRADA' ? styles.createButton : styles.cancelButton}`}>
                             {isSubmitting ? 'Registrando...' : (showForm === 'ENTRADA' ? 'Confirmar Entrada' : 'Confirmar Salida')}
                         </button>
                         <button type="button" onClick={resetForm} className={`${styles.commonButton}`}>Cancelar</button>
                     </div>
                     {isOptionsLoading && <p className={styles.loadingSmall}>Cargando opciones...</p>}
                </form>
            )}


            {/* --- Lista de Inventario Actual --- */}
            <h4 className={styles.listTitle}>Inventario Actual</h4>

             {/* --- SECCIÓN DE FILTROS PARA LA LISTA --- */}
             <div className={styles.filterContainer}>
                  {/* Filtro Empresa */}
                  <div className={styles.filterGroup}>
                     <label htmlFor="filt-emp-lista" className={styles.filterLabel}>Filtrar Empresa:</label>
                     <select id="filt-emp-lista" name="empresaId" value={filtrosLista.empresaId} onChange={handleFiltroListaChange} className={styles.filterSelect} disabled={isOptionsLoading}>
                         <option value="">-- Todas --</option>
                         {empresasCliente.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                     </select>
                  </div>
                   {/* Filtro Producto */}
                   <div className={styles.filterGroup}>
                     <label htmlFor="filt-prod-lista" className={styles.filterLabel}>Filtrar Producto:</label>
                     <select id="filt-prod-lista" name="productoId" value={filtrosLista.productoId} onChange={handleFiltroListaChange} className={styles.filterSelect} disabled={isOptionsLoading}>
                         <option value="">-- Todos --</option>
                         {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>)}
                     </select>
                  </div>
                   {/* Filtro Ubicación */}
                   <div className={styles.filterGroup}>
                     <label htmlFor="filt-ubi-lista" className={styles.filterLabel}>Filtrar Ubicación:</label>
                     <select id="filt-ubi-lista" name="ubicacionId" value={filtrosLista.ubicacionId} onChange={handleFiltroListaChange} className={styles.filterSelect} disabled={isOptionsLoading}>
                         <option value="">-- Todas --</option>
                         {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                     </select>
                  </div>
                  {isOptionsLoading && <div className={styles.loadingSmall}><small>Cargando filtros...</small></div>}
             </div>
             {/* --- FIN SECCIÓN DE FILTROS --- */}


            {/* Tabla de Inventario */}
            {isLoading ? (<p>Cargando inventario...</p>)
                : !error && inventario.length === 0
                    ? (<p>No hay inventario para mostrar {filtrosLista.empresaId || filtrosLista.productoId || filtrosLista.ubicacionId ? 'con los filtros seleccionados' : ''}.</p>)
                    : !error ? (
                        <div className={styles.listContainer}>
                            <table className={styles.inventoryTable}>
                                <thead>
                                    {/* Quitamos columna Acciones */}
                                    <tr><th>ID</th><th>Producto</th><th>Ubicación</th><th>Cantidad</th><th>Empresa Dueña</th><th>Creado/Actualizado</th></tr>
                                </thead>
                                <tbody>
                                    {inventario.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.id}</td>
                                            <td>{item.producto_nombre}</td>
                                            <td>{item.ubicacion_nombre}</td> {/* Asegúrate que este campo venga de la API */}
                                            <td style={{ textAlign: 'right' }}>{item.cantidad}</td>
                                            <td>{item.empresa?.nombre || '[Sin Empresa]'}</td>
                                             {/* Usamos fecha_creacion si fecha_actualizacion no está disponible */}
                                            <td>{formatDateTime(item.fecha_actualizacion || item.fecha_creacion)}</td>
                                            {/* Ya no hay botones de editar/eliminar aquí */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null /* Si hay error, ya se muestra arriba */
            }
        </div>
    );
};

export default GestionInventario;