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

    return (
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
            {/* Visits Chart */}
            <div>
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
        </div>
    );
};
