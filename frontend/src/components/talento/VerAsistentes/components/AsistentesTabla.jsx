import React from 'react';
import { formatters } from '../../../../utils/formatters';

/**
 * Tabla de asistentes con columnas variables según tipo de formación (interna/externa).
 */
const AsistentesTabla = ({ asistentes, tipoFormacion }) => {
    const esExterna = tipoFormacion === 'Externa';

    return (
        <div className="asistentes-table-container">
            <table className="asistentes-table">
                <thead>
                    <tr>
                        <th style={{ paddingLeft: '24px' }}>Cédula</th>
                        <th>Nombre completo</th>
                        <th>Cargo</th>
                        <th>Dirección</th>
                        <th>Correo electrónico</th>
                        <th>Fecha de registro</th>
                    </tr>
                </thead>
                <tbody>
                    {asistentes.map((a) => (
                        <tr key={a.id}>
                            <td style={{ paddingLeft: '24px', fontWeight: '500' }}>{a.cedula}</td>
                            <td>{a.nombre}</td>
                            <td>{a.cargo}</td>
                            <td>{a.unidad}</td>
                            <td className="email-cell">{a.correo}</td>
                            <td>{formatters.fechaHora(a.fecha_registro)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AsistentesTabla;
