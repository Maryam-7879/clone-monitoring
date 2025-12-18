import React, { useState } from "react";
import { apiOrchestrateFull } from "../lib/api/endpoints";

export default function OrchestrateFullPanel() {
  const [survey_id, setSurveyId] = useState("");
  const [name, setName] = useState("");
  const [queue, setQueue] = useState("");
  const [apply, setApply] = useState(true);
  const [file, setFile] = useState<File|null>(null);
  const [log, setLog] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setLog("فایل انتخاب نشده");
    if (file.size > 5 * 1024 * 1024) return setLog("حداکثر حجم فایل 5MB است");
    setLog("در حال اجرا...");
    const res = await apiOrchestrateFull({ survey_id, name, queue, file, apply });
    setLog(res.ok ? "OK" : `ERR: ${res.err}`);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="border p-2 w-full" placeholder="survey_id" value={survey_id} onChange={e=>setSurveyId(e.target.value)} />
      <input className="border p-2 w-full" placeholder="name" value={name} onChange={e=>setName(e.target.value)} />
      <input className="border p-2 w-full" placeholder="queue" value={queue} onChange={e=>setQueue(e.target.value)} />
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={apply} onChange={e=>setApply(e.target.checked)} />
        apply
      </label>
      <input type="file" accept=".wav,.ulaw" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
      <button className="px-3 py-2 rounded bg-purple-600 text-white">Orchestrate Full</button>
      <div className="text-sm">{log}</div>
    </form>
  );
}
