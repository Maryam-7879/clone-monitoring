import React, { useState } from "react";
import { applyOutboundDialplan } from "@/services/api.survey";

type Props = {
  surveyName: string;      // e.g. call_id
  defaultCode?: string;    // e.g. "7790"
};

export default function ApplyDialplanButton({ surveyName, defaultCode = "" }: Props) {
  const [code, setCode] = useState(defaultCode);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string>("");

  const onApply = async () => {
    if (!surveyName || !code) {
      alert("نام نظرسنجی و کد دستوری الزامی است.");
      return;
    }
    try {
      setLoading(true);
      setLog("");
      const output = await applyOutboundDialplan({
        surveyName,
        commandCode: code,
      });
      setLog(String(output || "").trim());
    } catch (err: any) {
      setLog(`خطا در اعمال روی دایال‌پلن:\n${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          className="border rounded px-2 py-1 w-32"
          placeholder="کد دستوری"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
        />
        <button
          onClick={onApply}
          disabled={loading || !code}
          className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-60"
          title="اعمال روی دایال‌پلن"
        >
          {loading ? "در حال اعمال..." : "اعمال روی دایال‌پلن"}
        </button>
      </div>

      {log && (
        <pre className="whitespace-pre-wrap text-xs bg-black text-green-300 p-3 rounded max-h-80 overflow-auto">
{log}
        </pre>
      )}
    </div>
  );
}
