import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type CityData = {
  value: string;
  count: number;
};

const COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"];

export const CityChart = ({ data }: { data: CityData[] }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="count"
            nameKey="value"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: "12px", color: "#064e3b" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
