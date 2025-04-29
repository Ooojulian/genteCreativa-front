import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Ajusta ruta si es diferente
import { loginUser } from '../../services/auth';     // Ajusta ruta si es diferente
import styles from '../../styles/Auth/Login.module.css'; // Ajusta ruta si es diferente
import logoGenteCreativa from '../../assets/images/logo-gente-creativa.png'; // <-- AJUSTA EL NOMBRE DEL ARCHIVO


const Login: React.FC = () => {
    const [password, setPassword] = useState('');
    const [cedula, setCedula] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {

            const data = await loginUser({ cedula, password });


            // Guarda el token y la información del usuario (¡Asegúrate que 'data.user' exista y tenga la estructura correcta!)
            if (data.access && data.user) {
                login(data.access, data.user); // Guarda en contexto y localStorage

                // --- Inicio de la sección de depuración de roles ---
                // Verifica la estructura de data.user y data.user.rol

                // Acceso seguro al nombre del rol usando optional chaining (?.)
                const userRole = data.user?.rol?.nombre;


                if (userRole === 'cliente') {
                    navigate('/cliente/dashboard');
                } else if (userRole === 'conductor') {
                    navigate('/conductor/dashboard');
                } else if (userRole === 'jefe_empresa') {
                    navigate('/jefe/dashboard');
                } else if (userRole === 'jefe_inventario') {
                    navigate('/jefe-inventario/dashboard');
                } else {
                    console.log("Rol no reconocido:", userRole, "Estableciendo error."); // Log rol no reconocido
                    setError('Rol no reconocido o la estructura del usuario es inesperada.');
                }
                // --- Fin de la sección de depuración de roles ---

            } else {
                console.error("Respuesta de la API inválida, falta token o datos de usuario:", data);
                setError("Respuesta inesperada del servidor al iniciar sesión.");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.response?.data?.error || err.message || 'Error al iniciar sesión.';
            setError(errorMessage);
            console.error("Login error:", err.response || err.message || err); // Log de error más detallado
        }
    };

    return (
        <div className={styles.loginPage}> {/* Contenedor principal */}
            {/* Columna Izquierda (Información) */}
            <div className={styles.infoPanel}>
                <h2>Bienvenido a</h2>
                <div className={styles.logoContainer}>
                    <img
                        src={logoGenteCreativa} // Usa la variable importada
                        alt="Logo Gente Creativa" // Texto alternativo descriptivo
                        className={styles.logoImage} // Añade una clase para estilizar
                    />
                </div>
                <p className={styles.infoText}>
                    Plataforma de gestión logística integral. Inicia sesión para continuar.
                </p>
                <div className={styles.footerText}>
                    CREATOR Julian Cristancho | DESIGNER Julian Cristancho
                </div>
            </div>

            {/* Columna Derecha (Formulario) */}
            <div className={styles.formPanel}>
                <div className={styles.loginFormContainer}>
                    <h3>Iniciar Sesión</h3>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="cedula" className={styles.label}>Cédula</label>
                            <input type="text" id="cedula" className={styles.input} value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Ingresa tu cédula" required />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.label}>Contraseña</label>
                            <input type="password" id="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingresa tu contraseña" required />
                        </div>
                        {error && <p className={styles.errorText}>{error}</p>}
                        <div className={styles.buttonGroup}>
                            <button type="submit" className={styles.submitButton}>Iniciar Sesión</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;