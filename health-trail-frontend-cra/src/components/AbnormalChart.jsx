import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

export default function AbnormalChart({ data }:{ data: {name:string, value:number, min?:number, max?:number}[] }) {
  if (!data?.length) return <div className="text-sm text-gray-500">No abnormal metrics detected.</div>;
  const globalMin = Math.min(...data.map(d=>d.min ?? d.value));
  const globalMax = Math.max(...data.map(d=>d.max ?? d.value));
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="name" angle={-15} textAnchor="end" height={50} />
          <YAxis domain={[globalMin*0.9, globalMax*1.1]} />
          <Tooltip />
          <Bar dataKey="value" />
          <ReferenceLine y={globalMin} strokeDasharray="3 3" />
          <ReferenceLine y={globalMax} strokeDasharray="3 3" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
