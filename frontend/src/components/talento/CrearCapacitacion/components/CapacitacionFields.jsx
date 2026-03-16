import React from 'react';
import { Input, Select, Radio as RadioGroup, HelpTooltip } from '../../../common';
import { ACTIVITY_HELP_ITEMS } from '../constants/activityDescriptions';

const TIPOS_ACTIVIDAD = ['Capacitación', 'Inducción', 'Formación', 'Otros (eventos)'];
const MODALIDADES = ['Virtual', 'Presencial', 'Híbrida'];
const DIRIGIDO_A_OPTIONS = ['Personal FSD', 'Personal Externo'];
const TIPO_ACTIVIDAD_OPTIONS = ['Interno', 'Externo'];

const CapacitacionFields = ({ formData, handleChange, errors, customTipo }) => {
    return (
        <>
            <Input
                label="Tema / Título"
                name="tema"
                value={formData.tema}
                onChange={handleChange}
                error={errors.tema}
                placeholder="¿Cuál es el tema o título de la actividad?"
                required
            />

            <div className="form-row-3">
                <Select
                    label={
                        <>
                            Actividad
                            <HelpTooltip title="Descripcion de actividades" items={ACTIVITY_HELP_ITEMS} />
                        </>
                    }
                    name="actividad"
                    value={formData.actividad}
                    onChange={handleChange}
                    options={TIPOS_ACTIVIDAD}
                    error={errors.actividad}
                    required
                />
                <RadioGroup
                    label="Tipo de actividad"
                    name="tipo_actividad"
                    options={TIPO_ACTIVIDAD_OPTIONS}
                    value={formData.tipo_actividad}
                    onChange={handleChange}
                    error={errors.tipo_actividad}
                    required
                />
                <Input
                    label="Fecha"
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    error={errors.fecha}
                    required
                />
                {formData.actividad === 'Otros (eventos)' && (
                    <div className="full-width">
                        <Input
                            label="Especifica la actividad"
                            name="actividad_custom"
                            value={customTipo}
                            onChange={handleChange}
                            error={errors.actividad_custom}
                            placeholder="Ej: Taller, Conferencia, Feria..."
                            required
                        />
                    </div>
                )}
            </div>

            <div className="form-row">
                <Select
                    label="Modalidad"
                    name="modalidad"
                    value={formData.modalidad}
                    onChange={handleChange}
                    options={MODALIDADES}
                    error={errors.modalidad}
                    required
                />
                <RadioGroup
                    label="Dirigido a"
                    name="dirigido_a"
                    options={formData.actividad === 'Otros (eventos)' ? [...DIRIGIDO_A_OPTIONS, 'Personal FSD y externo'] : DIRIGIDO_A_OPTIONS}
                    value={formData.dirigido_a}
                    onChange={handleChange}
                    error={errors.dirigido_a}
                    required
                />
            </div>


            <Input
                label={formData.tipo_actividad === 'Externo' ? 'Entidad / Empresa' : 'Facilitador'}
                name="facilitador_entidad"
                value={formData.facilitador_entidad}
                onChange={handleChange}
                error={errors.facilitador_entidad}
                placeholder={formData.tipo_actividad === 'Externo' ? '¿Cuál es la entidad o empresa que imparte la actividad?' : '¿Quién imparte la actividad?'}
                required
            />

            <div className="form-row">
                <Input
                    label="Responsable"
                    name="responsable"
                    value={formData.responsable}
                    onChange={handleChange}
                    error={errors.responsable}
                    placeholder="¿Quién organiza la actividad por parte de la FSD?"
                    required
                />
                <Input
                    label="Cargo del responsable"
                    name="cargo_responsable"
                    value={formData.cargo_responsable}
                    onChange={handleChange}
                    error={errors.cargo_responsable}
                    placeholder="Ej: Coordinador de Talento Humano"
                    required
                />
            </div>

            <div className="form-row">
                <Input
                    label="Hora de inicio"
                    type="time"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleChange}
                    error={errors.hora_inicio}
                    required
                />
                <Input
                    label="Hora de fin"
                    type="time"
                    name="hora_fin"
                    value={formData.hora_fin}
                    onChange={handleChange}
                    error={errors.hora_fin}
                    required
                />
            </div>

            <div className="form-group">
                <label className="input-label">
                    Contenido (mínimo 100 caracteres)<span className="required">*</span>
                </label>
                <textarea
                    name="contenido"
                    value={formData.contenido}
                    onChange={handleChange}
                    className={`textarea ${errors.contenido ? 'input-error' : ''}`}
                    placeholder="Escribe aquí los temas o puntos principales a tratar en la actividad"
                    rows={5}
                />
                {errors.contenido && <span className="error-message">{errors.contenido}</span>}
            </div>
        </>
    );
};

export default CapacitacionFields;
