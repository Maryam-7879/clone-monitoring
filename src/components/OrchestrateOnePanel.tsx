import React, { useState } from "react";
import { apiOrchestrateOne } from "../lib/api/endpoints";

export default function OrchestrateOnePanel() {
  const [name, setName] = useState("");
  const [queue, setQueue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [log, setLog] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setLog("نام نظرسنجی الزامی است");
    if (!queue.trim()) return setLog("صف الزامی است");
    if (!file) return setLog("فایل صوتی الزامی است");
    if (file.size > 5 * 1024 * 1024) return setLog("حداکثر حجم فایل 5MB است");
    setLog("در حال اجرا...");
    const res = await apiOrchestrateOne({ name, queue, file });
    setLog(res.ok ? "OK" : `ERR: ${res.err}`);
    if (res.ok) {
      setName("");
      setQueue("");
      setFile(null);
      const fileInput = document.getElementById("orchestrate-one-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="border p-2 w-full" placeholder="name" value={name} onChange={e=>setName(e.target.value)} />
      <input className="border p-2 w-full" placeholder="queue (مثلاً 601)" value={queue} onChange={e=>setQueue(e.target.value)} />
      <input id="orchestrate-one-file" type="file" accept=".wav,.ulaw" className="block" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
      <button className="px-3 py-2 rounded bg-teal-600 text-white">Orchestrate One</button>
      <div className="text-sm">{log}</div>
    </form>
  );
}
