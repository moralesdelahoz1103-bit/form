export const formatters = {
  cedula: (value) => {
    return value.replace(/\D/g, '').slice(0, 10);
  },

  nombre: (value) => {
    return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  },

  fecha: (dateString) => {
    if (!dateString || dateString === 'N/A') return dateString || '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  },

  fechaCorta: (dateString) => {
    if (!dateString || dateString === 'N/A') return dateString || '';
    // Si es formato YYYY-MM-DD, convertir directamente sin zona horaria
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    // Fallback para otros formatos
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('es-ES');
  },

  hora: (timeString) => {
    return timeString;
  },

  fechaHora: (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${y}, ${hh}:${mm}`;
  },

  calcularDuracion: (inicio, fin) => {
    if (!inicio || !fin) return '0h 0m';
    try {
      const [hInicio, mInicio] = inicio.split(':').map(Number);
      const [hFin, mFin] = fin.split(':').map(Number);

      let totalMinutos = (hFin * 60 + mFin) - (hInicio * 60 + mInicio);

      if (totalMinutos < 0) return '0h 0m'; // Opcional: manejar sesiones que pasan de medianoche si fuera necesario

      const horas = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;

      if (horas === 0) return `${minutos} min`;
      if (minutos === 0) return `${horas}h`;
      return `${horas}h ${minutos}m`;
    } catch (error) {
      return '0h 0m';
    }
  }
};
