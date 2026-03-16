export const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DIMENSION_LABELS = {
    facilitador_entidad: 'Facilitador',
    responsable: 'Responsable',
    cargo_responsable: 'Cargo del responsable',
    dirigido_a: 'Tipo de formación',
    actividad: 'Tipo de actividad',
    modalidad: 'Modalidad',
    mes: 'Análisis mensual'
};

export const METRIC_LABELS = {
    horas: 'Horas impartidas',
    cantidad: 'Sesiones',
    asistentes: 'Total asistentes',
    asistentes_promedio: 'Promedio asistentes'
};

export const DIMENSION_METRICS_MAP = {
    facilitador_entidad: [
        { label: METRIC_LABELS.horas, value: 'horas' },
        { label: METRIC_LABELS.cantidad, value: 'cantidad' },
        { label: METRIC_LABELS.asistentes, value: 'asistentes' },
        { label: METRIC_LABELS.asistentes_promedio, value: 'asistentes_promedio' }
    ],
    responsable: [
        { label: METRIC_LABELS.cantidad, value: 'cantidad' },
        { label: METRIC_LABELS.asistentes, value: 'asistentes' }
    ],
    cargo_responsable: [
        { label: METRIC_LABELS.asistentes, value: 'asistentes' },
        { label: METRIC_LABELS.cantidad, value: 'cantidad' }
    ],
    dirigido_a: [
        { label: METRIC_LABELS.asistentes, value: 'asistentes' },
        { label: METRIC_LABELS.horas, value: 'horas' },
        { label: METRIC_LABELS.cantidad, value: 'cantidad' }
    ],
    actividad: [
        { label: METRIC_LABELS.cantidad, value: 'cantidad' },
        { label: METRIC_LABELS.asistentes, value: 'asistentes' }
    ],
    modalidad: [
        { label: METRIC_LABELS.asistentes, value: 'asistentes' },
        { label: METRIC_LABELS.cantidad, value: 'cantidad' }
    ],
    mes: [
        { label: METRIC_LABELS.asistentes, value: 'asistentes' },
        { label: METRIC_LABELS.horas, value: 'horas' },
        { label: METRIC_LABELS.cantidad, value: 'cantidad' }
    ]
};
