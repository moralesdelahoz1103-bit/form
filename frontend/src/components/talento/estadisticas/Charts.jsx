import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#26BC58', '#0C2719', '#244C26', '#257137', '#259547', '#51CB75', '#A8EFAE'];

export const ActividadChart = ({ data }) => (
    <div className="chart-card">
        <h3>Actividades por tipo de actividad</h3>
        <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: 'rgba(38, 188, 88, 0.05)' }}
                    />
                    <Bar dataKey="cantidad" fill="#26BC58" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export const ModalidadChart = ({ data }) => (
    <div className="chart-card">
        <h3>Distribución por modalidad</h3>
        <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export const TendenciaChart = ({ data, title }) => (
    <div className="chart-card chart-full">
        <h3>{title}</h3>
        <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#26BC58" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#26BC58" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="valor" stroke="#26BC58" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export const RankingChart = ({ data, title, dataKey = "valor", color = "#26BC58" }) => (
    <div className="chart-card">
        <h3>{title}</h3>
        <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: 'rgba(38, 188, 88, 0.05)' }}
                    />
                    <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);
