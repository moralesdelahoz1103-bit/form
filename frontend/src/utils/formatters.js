export const formatters = {
  cedula: (value) => {
    return value.replace(/\D/g, '').slice(0, 10);
  },

  nombre: (value) => {
    return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  },

  fecha: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  fechaCorta: (dateString) => {
    // Si es formato YYYY-MM-DD, convertir directamente sin zona horaria
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    // Fallback para otros formatos
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  },

  hora: (timeString) => {
    return timeString;
  },

  fechaHora: (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};
