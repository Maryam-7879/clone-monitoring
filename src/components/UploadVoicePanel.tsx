import React, { useState } from "react";
import { apiUploadVoice } from "../lib/api/endpoints";

export default function UploadVoicePanel() {
  const [surveyId, setSurveyId] = useState("");
  const [purpose, setPurpose] = useState("menu");
  const [file, setFile] = useState<File | null>(null);
  const [log, setLog] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setLog("فایل انتخاب نشده");
    if (file.size > 5 * 1024 * 1024) return setLog("حداکثر حجم فایل 5MB است");
    setLog("در حال ارسال...");
    const res = await apiUploadVoice({ survey_id: surveyId, purpose, file });
    setLog(res.ok ? `OK: ${res.audio_key ?? ""}` : `ERR: ${res.err}`);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="border p-2 w-full" placeholder="survey_id" value={surveyId} onChange={e=>setSurveyId(e.target.value)} />
      <input className="border p-2 w-full" placeholder="purpose (مثلاً menu)" value={purpose} onChange={e=>setPurpose(e.target.value)} />
      <input type="file" accept=".wav,.ulaw" className="block" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
      <button className="px-3 py-2 rounded bg-blue-600 text-white">آپلود</button>
      <div className="text-sm">{log}</div>
    </form>
  );
}
