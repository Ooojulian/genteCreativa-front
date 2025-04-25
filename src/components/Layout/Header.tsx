// frontend/src/components/Layout/Header.tsx
import React from 'react';
import { useAuth } from '../../context/AuthContext'; // Ajusta la ruta si es necesario
import layoutStyles from '../../styles/Layout/DashboardLayout.module.css'; // Ajusta la ruta
import logoGenteCreativa from '../../assets/images/logo-gente-creativa.png'; // Ajusta la ruta y nombre

// Define las props que espera el componente
interface HeaderProps {
    title: string; // El título específico del dashboard
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    const { logout } = useAuth(); // Obtiene la función logout del contexto

    return (
        <div className={layoutStyles.header}>
            {/* Contenedor para logo y título */}
            <div className={layoutStyles.headerLeft}>
                <img
                    src={logoGenteCreativa}
                    alt="Logo Gente Creativa"
                    className={layoutStyles.headerLogo} // Clase específica para el logo en el header
                />
                
            </div>
            <div className={layoutStyles.headerLeft}>
                {/* Título recibido como prop */}
                <h2 className={layoutStyles.headerTitle}>{title}</h2>
            </div>

            {/* Botón de logout */}
            <button onClick={logout} className={layoutStyles.logoutButton}>
                Cerrar sesión
            </button>
        </div>
    );
};

export default Header;