import React from 'react';
import { useRecurrence } from './hooks/useRecurrence';
import { useCapacitacionForm } from './hooks/useCapacitacionForm';
import { Button, Toast } from '../../common';
import SuccessModal from './components/SuccessModal';
import RecurrenceSection from './components/RecurrenceSection';
import CapacitacionFields from './components/CapacitacionFields';
import './CrearCapacitacion.css';


const CrearCapacitacion = () => {
  const {
    esRecurrente,
    ocurrenciasProgramadas,
    erroresOcurrencias,
    sesionesExpandidas,
    sesionesConContenido,
    setErroresOcurrencias,
    agregarOcurrencia,
    eliminarOcurrencia,
    handleOcurrenciaChange,
    toggleRecurrente,
    toggleExpandida,
    toggleContenido,
    resetRecurrence
  } = useRecurrence();

  const {
    formData,
    errors,
    submitting,
    toasts,
    linkGenerado,
    showModal,
    nombreFormacion,
    nuevaSesion,
    customTipo,
    handleChange,
    handleSubmit,
    removeToast,
    copiarLink,
    copiarQR,
    descargarQR,
    cerrarModal
  } = useCapacitacionForm();

  const handleFormSubmit = (e) => {
    handleSubmit(e, {
      esRecurrente,
      ocurrenciasProgramadas,
      setErroresOcurrencias
    }, resetRecurrence);
  };

  return (
    <div className="crear-capacitacion">
      <div className="page-header">
        <h1 className="page-title">Crear actividad</h1>
        <p className="page-subtitle">Complete el formulario para generar un enlace de registro</p>
      </div>

      <div className="card">
        <form onSubmit={handleFormSubmit}>
          <CapacitacionFields
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            customTipo={customTipo}
          />

          <RecurrenceSection
            esRecurrente={esRecurrente}
            ocurrenciasProgramadas={ocurrenciasProgramadas}
            erroresOcurrencias={erroresOcurrencias}
            sesionesExpandidas={sesionesExpandidas}
            sesionesConContenido={sesionesConContenido}
            toggleRecurrente={toggleRecurrente}
            agregarOcurrencia={agregarOcurrencia}
            eliminarOcurrencia={eliminarOcurrencia}
            toggleExpandida={toggleExpandida}
            toggleContenido={toggleContenido}
            handleOcurrenciaChange={handleOcurrenciaChange}
          />

          <Button type="submit" loading={submitting} fullWidth>
            Crear formulario
          </Button>
        </form>
      </div>

      <SuccessModal
        show={showModal}
        onClose={cerrarModal}
        nuevaSesion={nuevaSesion}
        linkGenerado={linkGenerado}
        nombreFormacion={nombreFormacion}
        onCopiarLink={copiarLink}
        onCopiarQR={copiarQR}
        onDescargarQR={descargarQR}
      />

      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={toasts.length > 1 ? null : 5000}
          />
        ))}
      </div>
    </div>
  );
};

export default CrearCapacitacion;
