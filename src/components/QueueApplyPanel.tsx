import React, { useState } from "react";
import { apiQueueApply } from "../lib/api/endpoints";

export default function QueueApplyPanel() {
  const [surveyId, setSurveyId] = useState("");
  const [queue, setQueue] = useState("");
  const [log, setLog] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLog("در حال ارسال...");
    const res = await apiQueueApply({ surveyId, queue });
    setLog(res.ok ? "OK" : `ERR: ${res.err}`);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="border p-2 w-full" placeholder="surveyId" value={surveyId} onChange={e=>setSurveyId(e.target.value)} />
      <input className="border p-2 w-full" placeholder="queue (مثلاً 601)" value={queue} onChange={e=>setQueue(e.target.value)} />
      <button className="px-3 py-2 rounded bg-amber-600 text-white">Set Queue Continue</button>
      <div className="text-sm">{log}</div>
    </form>
  );
}
