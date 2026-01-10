import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from "recharts";
import { useState } from "react";

type CityData = {
  value: string;
  count: number;
};

// A more vibrant and distinct palette that maintains a modern, clean aesthetic
const COLORS = [
  "#10b981", // Emerald 500
  "#3b82f6", // Blue 500
  "#f59e0b", // Amber 500
  "#8b5cf6", // Violet 500
  "#ec4899", // Pink 500
  "#06b6d4", // Cyan 500
  "#f97316", // Orange 500
  "#6366f1", // Indigo 500
];

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#1f2937" className="text-sm font-semibold">
        {payload.value}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 12}
        fill={fill}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg border border-slate-100 bg-white/90 p-3 shadow-lg backdrop-blur-sm">
        <p className="text-sm font-semibold text-slate-700">{data.name}</p>
        <p className="text-sm text-emerald-600">
          Visitas: <span className="font-bold">{data.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const CityChart = ({ data }: { data: CityData[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie
            // @ts-ignore
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="75%"
            paddingAngle={4}
            dataKey="count"
            nameKey="value"
            onMouseEnter={onPieEnter}
            cursor="pointer"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                strokeWidth={0}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => <span className="text-xs text-slate-600 font-medium ml-1">{value}</span>}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
