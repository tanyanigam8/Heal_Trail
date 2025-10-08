import React, { useState } from "react";
import { api } from "../api";

export default function FileUpload({ onDone }: { onDone: (payload:any)=>void }) {
  const [file, setFile] = useState<File|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  async function upload() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      setLoading(true); setError(null);
      const { data } = await api.post("/api/upload", form, { headers: { "Content-Type": "multipart/form-data" }});
      onDone(data);
    } catch (e:any) {
      setError(e?.response?.data?.detail || e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
      <div><input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} /></div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button disabled={!file||loading} onClick={upload} className="self-start px-4 py-2 bg-blue-600 text-white rounded">
        {loading? 'Analyzing…' : 'Upload & Analyze PDF'}
      </button>
    </div>
  );
}
