import { config } from './constants';

export const validations = {
  cedula: (value) => {
    const regex = /^\d{6,10}$/;
    if (!value) return 'La cédula es obligatoria';
    if (!regex.test(value)) return 'La cédula debe tener entre 6 y 10 dígitos';
    return null;
  },

  nombre: (value) => {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!value) return 'El nombre es obligatorio';
    if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
    if (!regex.test(value)) return 'El nombre solo puede contener letras y espacios';
    return null;
  },

  cargo: (value) => {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!value) return 'El cargo es obligatorio';
    if (value.trim().length < 2) return 'El cargo debe tener al menos 2 caracteres';
    if (!regex.test(value)) return 'El cargo solo puede contener letras y espacios';
    return null;
  },

  unidad: (value) => {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!value) return 'La unidad es obligatoria';
    if (value.trim().length < 2) return 'La unidad debe tener al menos 2 caracteres';
    if (!regex.test(value)) return 'La unidad solo puede contener letras y espacios';
    return null;
  },

  correo: (value) => {
    const regex = /^[^\s@]+@fundacionsantodomingo\.org$/;
    if (!value) return 'El correo es obligatorio';
    if (!regex.test(value.toLowerCase())) {
      return `El correo debe ser del dominio ${config.allowedDomain}`;
    }
    return null;
  },

  token: (value) => {
    const regex = /^[0-9A-Fa-f]{8}$/;
    if (!value) return 'Token inválido';
    if (!regex.test(value)) return 'Formato de token inválido';
    return null;
  },

  fecha: (value) => {
    if (!value) return 'La fecha es obligatoria';
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return null;
  },

  hora: (value) => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!value) return 'La hora es obligatoria';
    if (!regex.test(value)) return 'Formato de hora inválido (HH:mm)';
    return null;
  },

  tema: (value) => {
    if (!value) return 'El tema es obligatorio';
    if (value.trim().length < 3) return 'El tema debe tener al menos 3 caracteres';
    if (value.trim().length > 200) return 'El tema no puede tener más de 200 caracteres';
    return null;
  },

  facilitador: (value) => {
    if (!value) return 'El facilitador es obligatorio';
    if (value.trim().length < 3) return 'El facilitador debe tener al menos 3 caracteres';
    return null;
  },

  contenido: (value) => {
    if (!value) return 'El contenido es obligatorio';
    if (value.trim().length < 10) return 'El contenido debe tener al menos 10 caracteres';
    return null;
  }
};
