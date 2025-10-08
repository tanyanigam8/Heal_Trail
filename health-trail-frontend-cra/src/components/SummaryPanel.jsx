export default function SummaryPanel({ title, text }: { title: string; text: string; }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="prose max-w-none whitespace-pre-wrap">{text || "—"}</div>
    </div>
  );
}
