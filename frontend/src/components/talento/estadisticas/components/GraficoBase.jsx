import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Label, LabelList,
    LineChart, Line
} from 'recharts';

const COLORS = ['#26BC58', '#0C2719', '#244C26', '#257137', '#259547', '#51CB75', '#A8EFAE'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight="600">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const GraficoBase = ({ type, data, dataKey, title, color, visualOptions, xAxisLabel, yAxisLabel }) => {

    if (!data || data.length === 0) {
        return (
            <div className="hero-chart-surface-inner" style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="chart-placeholder">No hay datos suficientes para generar esta visualización</div>
            </div>
        );
    }

    if (type === 'radar' && data.length < 3) {
        return (
            <div className="hero-chart-surface-inner" style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
                <div className="chart-placeholder" style={{ maxWidth: '600px', textAlign: 'center', lineHeight: '1.6' }}>
                    El gráfico de radar requiere al menos 3 categorías para visualizar una forma representativa.
                    Prueba seleccionando otra dimensión como 'Temática' o 'Facilitador' que contengan más variables.
                </div>
            </div>
        );
    }

    const {
        gridType = 'polygon',
        radarOpacity = 0.5,
        barSize = 30,
        borderRadius = 6,
        innerRadius = 0,
        paddingAngle = 0,
        areaOpacity = 0.2
    } = visualOptions;

    // Lógica para determinar si se requiere rotación de etiquetas en el eje X
    // Basado en cantidad de datos o longitud de los nombres
    const maxLabelLength = Math.max(...data.map(d => String(d.name || '').length), 0);
    
    // Solo rotar si hay varios elementos o si son extremadamente largos
    // Para 1 o 2 elementos nunca rotamos para mantener estética
    const needsRotation = (data.length > 8) || (data.length > 2 && maxLabelLength > 15);
    
    // Configuración dinámica del eje X
    const xAxisConfig = {
        interval: data.length > 15 ? 'preserveStartEnd' : 0, // Si son demasiados, dejar que Recharts preserve extremos
        angle: needsRotation ? -35 : 0, // -35 grados se ve más elegante que -45
        textAnchor: needsRotation ? 'end' : 'middle',
        height: needsRotation ? 70 : 40,
        verticalAnchor: 'start'
    };

    // Calcular ancho mínimo solo si hay muchos datos para permitir scroll
    const minWidth = data.length > 12 ? (data.length * 50) : '100%';

    const isIntegerMetric = dataKey === 'cantidad' || dataKey === 'asistentes' || (yAxisLabel && (yAxisLabel.toLowerCase().includes('sesiones') || yAxisLabel.toLowerCase().includes('asistentes')));

    const renderChart = () => {
        const commonLabelStyle = { fontFamily: 'Arial, sans-serif', fill: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' };
        const commonTickStyle = { 
            fontFamily: 'Arial, sans-serif', 
            fill: '#64748b', 
            fontSize: needsRotation ? 10 : 11,
            fontWeight: 500
        };
        const commonDataLabelStyle = { fontFamily: 'Arial, sans-serif', fill: '#475569', fontSize: '10px', fontWeight: '700' };

        switch (type) {
            case 'bar-horizontal':
                return (
                    <BarChart data={data} layout="vertical" margin={{ left: 20, right: 60, top: 10, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={false} allowDecimals={!isIntegerMetric}>
                            <Label value={xAxisLabel} position="insideBottom" offset={-10} style={commonLabelStyle} />
                        </XAxis>
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={130}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ ...commonTickStyle, fill: '#475569', fontWeight: 500 }}
                        >
                            <Label value={yAxisLabel} angle={-90} position="insideLeft" offset={0} style={commonLabelStyle} />
                        </YAxis>
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' }}
                        />
                        <Bar dataKey={dataKey} fill={color} radius={[0, borderRadius, borderRadius, 0]} barSize={barSize}>
                            <LabelList
                                dataKey={dataKey}
                                position="right"
                                offset={10}
                                style={commonDataLabelStyle}
                            />
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            innerRadius={`${innerRadius}%`}
                            outerRadius={130}
                            paddingAngle={paddingAngle}
                            fill="#8884d8"
                            dataKey={dataKey}
                            stroke="none"
                        >
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontFamily: 'Arial, sans-serif' }} />
                    </PieChart>
                );
            case 'radar':
                return (
                    <RadarChart cx="50%" cy="50%" innerRadius="0%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="#e2e8f0" gridType={gridType} />
                        <PolarAngleAxis dataKey="name" tick={{ ...commonTickStyle, fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ ...commonTickStyle, fontSize: 10, fill: '#94a3b8' }} allowDecimals={!isIntegerMetric} />
                        <Radar
                            name={xAxisLabel}
                            dataKey={dataKey}
                            stroke={color}
                            fill={color}
                            fillOpacity={radarOpacity}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' }}
                        />
                    </RadarChart>
                );
            case 'area':
                return (
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            tick={commonTickStyle}
                            tickLine={false}
                            axisLine={false}
                            {...xAxisConfig}
                            dy={needsRotation ? 5 : 10}
                        >
                            <Label value={xAxisLabel} position="insideBottom" offset={needsRotation ? -15 : -25} style={commonLabelStyle} />
                        </XAxis>
                        <YAxis
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={commonTickStyle}
                            allowDecimals={!isIntegerMetric}
                        >
                            <Label value={yAxisLabel} angle={-90} position="insideLeft" offset={10} style={commonLabelStyle} />
                        </YAxis>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' }}
                        />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            fill={color}
                            fillOpacity={areaOpacity}
                            strokeWidth={3}
                        >
                            <LabelList
                                dataKey={dataKey}
                                position="top"
                                offset={10}
                                style={commonDataLabelStyle}
                            />
                        </Area>
                    </AreaChart>
                );
            case 'line':
                return (
                    <LineChart data={data} margin={{ top: 30, right: 30, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            tick={commonTickStyle}
                            tickLine={false}
                            axisLine={false}
                            {...xAxisConfig}
                            dy={needsRotation ? 5 : 10}
                        >
                            <Label value={xAxisLabel} position="insideBottom" offset={needsRotation ? -15 : -25} style={commonLabelStyle} />
                        </XAxis>
                        <YAxis
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={commonTickStyle}
                            allowDecimals={!isIntegerMetric}
                        >
                            <Label value={yAxisLabel} angle={-90} position="insideLeft" offset={10} style={commonLabelStyle} />
                        </YAxis>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' }}
                        />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        >
                            <LabelList
                                dataKey={dataKey}
                                position="top"
                                offset={15}
                                style={commonDataLabelStyle}
                            />
                        </Line>
                    </LineChart>
                );
            default: // bar-vertical
                return (
                    <BarChart data={data} margin={{ top: 30, right: 30, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            tick={commonTickStyle}
                            tickLine={false}
                            axisLine={false}
                            {...xAxisConfig}
                            dy={needsRotation ? 5 : 10}
                        >
                            <Label value={xAxisLabel} position="insideBottom" offset={needsRotation ? -15 : -25} style={commonLabelStyle} />
                        </XAxis>
                        <YAxis
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={commonTickStyle}
                            allowDecimals={!isIntegerMetric}
                        >
                            <Label value={yAxisLabel} angle={-90} position="insideLeft" offset={10} style={commonLabelStyle} />
                        </YAxis>
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' }}
                        />
                        <Bar dataKey={dataKey} fill={color} radius={[borderRadius, borderRadius, 0, 0]} barSize={barSize}>
                            <LabelList
                                dataKey={dataKey}
                                position="top"
                                offset={10}
                                style={commonDataLabelStyle}
                            />
                        </Bar>
                    </BarChart>
                );
        }
    };

    return (
        <div className="hero-chart-surface-inner" style={{ 
            width: '100%', 
            height: '100%', 
            minHeight: '500px',
            overflowX: data.length > 12 ? 'auto' : 'hidden',
            overflowY: 'hidden',
            paddingBottom: needsRotation ? '20px' : '0'
        }}>
            <div style={{ width: '100%', height: '100%', minWidth: minWidth, display: 'block' }}>
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GraficoBase;
