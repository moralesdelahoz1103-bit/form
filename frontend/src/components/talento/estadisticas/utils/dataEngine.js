import { formatters } from '../../../../utils/formatters';

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Procesa sesiones para generar datos de gráficos basados en una dimensión y una métrica.
 */
export const getChartData = (sesiones, dimension, metrica, options = {}) => {
    const contador = {};
    const pesos = {};

    sesiones.forEach(s => {
        let key = s[dimension] || 'n/a';

        // Manejo especial para dimensión 'mes'
        if (dimension === 'mes' && s.fecha) {
            const fecha = new Date(s.fecha);
            if (options.groupByYear) {
                key = `${fecha.getFullYear()}`;
            } else {
                key = `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
            }
        }

        // Modo oración for keys
        if (typeof key === 'string' && dimension !== 'mes') {
            key = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        }

        if (!contador[key]) {
            contador[key] = 0;
            pesos[key] = 0;
        }

        if (metrica === 'cantidad') {
            contador[key] += 1;
        } else if (metrica === 'asistentes') {
            contador[key] += (s.total_asistentes || 0);
        } else if (metrica === 'asistentes_promedio') {
            contador[key] += (s.total_asistentes || 0);
            pesos[key] += 1;
        } else if (metrica === 'horas') {
            const duracionStr = formatters.calcularDuracion(s.hora_inicio, s.hora_fin);
            let minutos = 0;
            if (duracionStr.includes('h')) {
                const [h, m] = duracionStr.split('h');
                minutos = (parseInt(h) * 60) + (parseInt(m) || 0);
            } else if (duracionStr.includes('min')) {
                minutos = parseInt(duracionStr);
            }
            contador[key] += (minutos / 60);
        }
    });

    // Transformar a formato Recharts
    const data = Object.entries(contador).map(([name, value]) => ({
        name,
        valor: metrica === 'asistentes_promedio'
            ? parseFloat((value / (pesos[name] || 1)).toFixed(1))
            : metrica === 'horas' ? parseFloat(value.toFixed(1)) : value
    }));

    if (dimension === 'mes') {
        // Ordenar cronológicamente
        const monthOrder = {
            'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
            'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
        };

        data.sort((a, b) => {
            const [monthA, yearA] = a.name.split(' ');
            const [monthB, yearB] = b.name.split(' ');

            if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
            return monthOrder[monthA] - monthOrder[monthB];
        });
    } else {
        data.sort((a, b) => b.valor - a.valor);
    }

    return data;
};

const getRawMinutes = (sesiones) => {
    let total = 0;
    sesiones.forEach(s => {
        const duracionStr = formatters.calcularDuracion(s.hora_inicio, s.hora_fin);
        if (duracionStr.includes('h')) {
            const [h, m] = duracionStr.split('h');
            total += (parseInt(h) * 60) + (parseInt(m) || 0);
        } else if (duracionStr.includes('min')) {
            total += parseInt(duracionStr);
        }
    });
    return total;
};

export const calculateKPIs = (sesiones, sesionesPasadas = []) => {
    const totalAsistentes = sesiones.reduce((acc, s) => acc + (s.total_asistentes || 0), 0);
    const totalMinutos = getRawMinutes(sesiones);

    // Desglose por tipo de formación
    let minutosInternos = 0;
    let minutosExternos = 0;

    sesiones.forEach(s => {
        const duracionStr = formatters.calcularDuracion(s.hora_inicio, s.hora_fin);
        let minutos = 0;
        if (duracionStr.includes('h')) {
            const [h, m] = duracionStr.split('h');
            minutos = (parseInt(h) * 60) + (parseInt(m) || 0);
        } else if (duracionStr.includes('min')) {
            minutos = parseInt(duracionStr);
        }

        const tipo = (s.dirigido_a || '').toLowerCase();
        if (tipo.includes('interna')) {
            minutosInternos += minutos;
        } else if (tipo.includes('externa')) {
            minutosExternos += minutos;
        }
    });

    const prevAsistentes = sesionesPasadas.reduce((acc, s) => acc + (s.total_asistentes || 0), 0);
    const prevFormaciones = sesionesPasadas.length;

    const calculateDelta = (current, prev) => {
        if (!prev || prev === 0) return 0;
        return (((current - prev) / prev) * 100).toFixed(1);
    };

    const horasTotal = Math.floor(totalMinutos / 60);
    const minsTotal = totalMinutos % 60;
    const promedioAsistentes = sesiones.length > 0 ? (totalAsistentes / sesiones.length).toFixed(1) : 0;

    return {
        totalFormaciones: sesiones.length,
        totalAsistentes,
        totalHoras: `${horasTotal}h ${minsTotal}m`,
        horasInternas: (minutosInternos / 60).toFixed(1),
        horasExternas: (minutosExternos / 60).toFixed(1),
        promedioAsistentes: parseFloat(promedioAsistentes),
        deltas: {
            formaciones: calculateDelta(sesiones.length, prevFormaciones),
            asistentes: calculateDelta(totalAsistentes, prevAsistentes)
        }
    };
};
