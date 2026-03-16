import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { asistentesService } from '../../../services/asistentes';
import RegistroInterno from './internas/RegistroInterno';
import { Loading } from '../../../components/common';

const RegistroMain = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [errorInfo, setErrorInfo] = useState(null);
    const [sesion, setSesion] = useState(null);

    useEffect(() => {
        const fetchSesionInfo = async () => {
            if (!token) {
                setErrorInfo({ title: 'Enlace Inválido', message: 'No se proporcionó un token de capacitación.' });
                setLoading(false);
                return;
            }

            try {
                const info = await asistentesService.obtenerSesionPorToken(token);
                setSesion(info);
            } catch (err) {
                const status = err.response?.status;
                const detail = err.response?.data?.detail || 'Error al cargar la información';

                    setErrorInfo({ title: 'Actividad o evento no encontrado', message: 'El enlace proporcionado no es válido o ha expirado.' });
            } finally {
                setLoading(false);
            }
        };

        fetchSesionInfo();
    }, [token]);

    if (loading) {
        return <Loading text="Verificando información de la sesión..." />;
    }

    if (errorInfo) {
        return (
            <div className="error-page">
                <h1>Actividad no encontrada</h1>
                <p>El enlace proporcionado no es válido o ha expirado.</p>
            </div>
        );
    }

    // Por defecto se usa siempre el formulario estándar
    return <RegistroInterno sesion={sesion} token={token} />;
};

export default RegistroMain;
