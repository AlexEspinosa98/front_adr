"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Cell,
    PieChart,
    Pie,
    type TooltipProps,
} from "recharts";

interface GeneralSummaryChartProps {
    totals: {
        survey_1: number;
        survey_2: number;
        survey_3: number;
        all_types: number;
    };
    propertiesTotals: {
        magdalena: number;
        atlantico: number;
        total_magdalena_atlantico: number;
    };
}

interface ChartData {
    name: string;
    value: number;
    category?: string;
    color: string;
    [key: string]: string | number | undefined;
}

type ChartTooltipProps = TooltipProps<number, string> & {
    payload?: Array<{ payload: ChartData }>;
};

const CustomTooltip = ({
    active,
    payload,
}: ChartTooltipProps) => {
    const data = payload?.[0]?.payload;
    if (active && data) {
        return (
            <div className="rounded-lg border border-emerald-100 bg-white/95 p-3 shadow-lg backdrop-blur-md">
                <p className="text-sm font-medium text-gray-900">
                    {data.name}: <span className="font-bold text-emerald-600">{data.value}</span>
                </p>
            </div>
        );
    }
    return null;
};

export const GeneralSummaryChart = ({
    totals,
    propertiesTotals,
}: GeneralSummaryChartProps) => {
    const visitsData: ChartData[] = [
        {
            name: "Visita 1",
            value: totals.survey_1,
            color: "#34d399", // emerald-400
        },
        {
            name: "Visita 2",
            value: totals.survey_2,
            color: "#10b981", // emerald-500
        },
        {
            name: "Visita 3",
            value: totals.survey_3,
            color: "#059669", // emerald-600
        },
    ];

    const propertiesData: ChartData[] = [
        {
            name: "Magdalena",
            value: propertiesTotals.magdalena,
            color: "#60a5fa", // blue-400
        },
        {
            name: "Atlántico",
            value: propertiesTotals.atlantico,
            color: "#3b82f6", // blue-500
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Visits Chart */}
            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-emerald-900">
                    Distribución de Visitas
                </p>
                <div className="h-[250px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={visitsData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            barSize={40}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#ecfdf5"
                            />
                            <XAxis
                                dataKey="name"
                                stroke="#6ee7b7"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "#065f46" }}
                                dy={10}
                            />
                            <YAxis
                                stroke="#6ee7b7"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "#065f46" }}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: "#f0fdf4" }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {visitsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Properties Chart */}
            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-emerald-900">
                    Propiedades por Departamento
                </p>
                <div className="relative h-[250px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={propertiesData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {propertiesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Legend/Summary Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-900">
                                {propertiesTotals.total_magdalena_atlantico}
                            </p>
                            <p className="text-xs text-emerald-500 font-medium">Total</p>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 -mt-5">
                        {propertiesData.map((entry) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs font-medium text-emerald-700">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
