import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- Import BrowserRouter
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
    // Wrap with BrowserRouter FIRST
    <BrowserRouter>
    {/* Then wrap with AuthProvider */}
       <AuthProvider>
            <App />
        </AuthProvider>
    </BrowserRouter>
);  