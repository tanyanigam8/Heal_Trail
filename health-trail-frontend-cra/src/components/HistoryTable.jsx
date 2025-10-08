export default function HistoryTable({ rows }:{ rows:any[] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h3 className="font-semibold mb-3">Report History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">Uploaded At</th>
              <th className="py-2 pr-4">Doctor Summary (preview)</th>
              <th className="py-2 pr-4">Patient Summary (preview)</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r, i) => (
              <tr key={r.id || i} className="border-b last:border-0">
                <td className="py-2 pr-4">{i+1}</td>
                <td className="py-2 pr-4">{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                <td className="py-2 pr-4 max-w-[360px] truncate" title={r.doctor_summary}>{r.doctor_summary || "—"}</td>
                <td className="py-2 pr-4 max-w-[360px] truncate" title={r.patient_summary}>{r.patient_summary || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
