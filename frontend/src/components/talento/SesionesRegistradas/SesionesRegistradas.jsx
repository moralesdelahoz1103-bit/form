import React, { useState } from 'react';
import { Button, Toast, Loading } from '../../common';
import { usePermisos } from '../../../utils/permisos';
import { sesionesService } from '../../../services/sesiones';

// Hooks personalizados
import { useSesionesData } from './hooks/useSesionesData';
import { useSesionEditor } from './hooks/useSesionEditor';
import { useSesionesActions } from './hooks/useSesionesActions';
import { useExportExcel } from './hooks/useExportExcel';

// Componentes de UI
import {
  QRCodeModal,
  DeleteSessionModal,
  DeleteOccurrenceModal,
  SessionsFilters,
  SessionsView,
  SessionDetailModal,
  ExportModal,
} from '../sesiones';

import './SesionesRegistradas.css';

const SesionesRegistradas = () => {
  const [toast, setToast] = useState(null);
  const { esAdministrador } = usePermisos();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userEmail = userInfo.email;

  const {
    sesiones, setSesiones, loading, verGlobal, setVerGlobal,
    currentPage, setCurrentPage, filtros, handleFiltroChange, limpiarFiltros,
    sesionesFiltradas, currentSesiones, totalPages, indexOfFirstItem, indexOfLastItem,
    uniqueOptions
  } = useSesionesData(esAdministrador, userEmail, setToast);

  const {
    modalDetalles, setModalDetalles, modoEdicion, setModoEdicion, datosEdicion,
    setDatosEdicion, erroresEdicion, setErroresEdicion, guardando, customTipoEdicion,
    sesionTabActiva, setSesionTabActiva, mostrarFormOcurrencia, setMostrarFormOcurrencia,
    nuevaOcurrencia, setNuevaOcurrencia, mostrarContenidoNuevaOc, setMostrarContenidoNuevaOc,
    guardandoOcurrencia, setGuardandoOcurrencia, handleEditar, handleCancelarEdicion,
    handleCambioEdicion, handleGuardarEdicion, cerrarModal
  } = useSesionEditor(setSesiones, setToast);

  const {
    modalEliminar, setModalEliminar, eliminando, modalQR, setModalQR,
    modalEliminarOcurrencia, setModalEliminarOcurrencia, handleEliminar,
    copiarLink, copiarQR, descargarQR
  } = useSesionesActions(setSesiones, setToast);

  const {
    showExportModal, setShowExportModal, exportarXLSX
  } = useExportExcel(sesiones, filtros, userEmail, setToast);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading size="md" text="Cargando actividades" />
      </div>
    );
  }

  return (
    <div className="sesiones-registradas">
      <div className="page-header">
        <div>
          <h1 className="page-title">Actividades registradas</h1>
          <p className="page-subtitle">Administra todas las actividades registradas</p>

          {esAdministrador && (
            <div className="admin-view-selector">
              <button
                className={`admin-view-btn ${!verGlobal ? 'active' : ''}`}
                onClick={() => setVerGlobal(false)}
              >
                Mis actividades
              </button>
              <button
                className={`admin-view-btn ${verGlobal ? 'active' : ''}`}
                onClick={() => setVerGlobal(true)}
              >
                Todas
              </button>
            </div>
          )}
        </div>
        <div className="header-actions">
          <Button onClick={() => esAdministrador ? setShowExportModal(true) : exportarXLSX('mine')} variant="primary">Exportar Excel</Button>
        </div>
      </div>

      {sesiones.length === 0 ? (
        <div className="empty-state">
          <p>No hay actividades registradas aún</p>
          <p className="empty-subtitle">Crea tu primera actividad desde el menú "Crear actividad"</p>
        </div>
      ) : (
        <>
          <SessionsFilters
            filtros={filtros}
            handleFiltroChange={handleFiltroChange}
            limpiarFiltros={limpiarFiltros}
            tiposUnicos={uniqueOptions.tipos}
            facilitadoresUnicos={uniqueOptions.facilitadores}
            responsablesUnicos={uniqueOptions.responsables}
            dirigido_a_Unicos={uniqueOptions.dirigido_a}
            modalidadesUnicas={uniqueOptions.modalidades}
          />

          {sesionesFiltradas.length === 0 ? (
            <div className="empty-state">
              <p>No se encontraron resultados</p>
              <p className="empty-subtitle">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            <SessionsView
              currentSesiones={currentSesiones}
              sesiones={sesiones}
              verGlobal={verGlobal}
              copiarLink={copiarLink}
              setModalQR={setModalQR}
              setModalDetalles={setModalDetalles}
              setModalEliminar={setModalEliminar}
              setSesionTabActiva={setSesionTabActiva}
              totalPages={totalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              indexOfFirstItem={indexOfFirstItem}
              indexOfLastItem={indexOfLastItem}
              totalFiltradas={sesionesFiltradas.length}
            />
          )}
        </>
      )}

      {/* Modales */}
      <QRCodeModal
        modalQR={modalQR}
        setModalQR={setModalQR}
        copiarQR={copiarQR}
        descargarQR={descargarQR}
      />

      <DeleteSessionModal
        modalEliminar={modalEliminar}
        setModalEliminar={setModalEliminar}
        handleEliminar={handleEliminar}
        eliminando={eliminando}
      />

      <DeleteOccurrenceModal
        modalEliminarOcurrencia={modalEliminarOcurrencia}
        setModalEliminarOcurrencia={setModalEliminarOcurrencia}
        modalDetalles={modalDetalles}
        setModalDetalles={setModalDetalles}
        setSesiones={setSesiones}
        setToast={setToast}
        sesionesService={sesionesService}
      />

      <SessionDetailModal
        modalDetalles={modalDetalles}
        setModalDetalles={setModalDetalles}
        modoEdicion={modoEdicion}
        setModoEdicion={setModoEdicion}
        sesionTabActiva={sesionTabActiva}
        setSesionTabActiva={setSesionTabActiva}
        datosEdicion={datosEdicion}
        setDatosEdicion={setDatosEdicion}
        erroresEdicion={erroresEdicion}
        setErroresEdicion={setErroresEdicion}
        customTipoEdicion={customTipoEdicion}
        handleEditar={handleEditar}
        handleCancelarEdicion={handleCancelarEdicion}
        handleCambioEdicion={handleCambioEdicion}
        handleGuardarEdicion={handleGuardarEdicion}
        guardando={guardando}
        mostrarFormOcurrencia={mostrarFormOcurrencia}
        setMostrarFormOcurrencia={setMostrarFormOcurrencia}
        nuevaOcurrencia={nuevaOcurrencia}
        setNuevaOcurrencia={setNuevaOcurrencia}
        mostrarContenidoNuevaOc={mostrarContenidoNuevaOc}
        setMostrarContenidoNuevaOc={setMostrarContenidoNuevaOc}
        guardandoOcurrencia={guardandoOcurrencia}
        setGuardandoOcurrencia={setGuardandoOcurrencia}
        setSesiones={setSesiones}
        setToast={setToast}
        setModalQR={setModalQR}
        setModalEliminarOcurrencia={setModalEliminarOcurrencia}
        onCloseModal={cerrarModal}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={exportarXLSX}
      />

      {toast && (
        <div className="toast-container">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
};

export default SesionesRegistradas;
