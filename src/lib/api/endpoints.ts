import { postForm } from "./client";

// 1) upload_voice.php -> fields: survey_id, purpose, file
export async function apiUploadVoice(params: { survey_id: string|number; purpose: string; file: File }) {
  const fd = new FormData();
  fd.append("survey_id", String(params.survey_id)); // snake_case
  fd.append("purpose", params.purpose);
  fd.append("file", params.file);
  return postForm<{ audio_key?: string }>("upload_voice.php", fd);
}

// 2) apply_dialplan.php -> fields: surveyId
export async function apiApplyDialplan(params: { surveyId: string|number }) {
  const fd = new FormData();
  fd.append("surveyId", String(params.surveyId));   // camelCase
  return postForm("apply_dialplan.php", fd);
}

// 3) queue_apply.php -> fields: surveyId, queue
export async function apiQueueApply(params: { surveyId: string|number; queue: string|number }) {
  const fd = new FormData();
  fd.append("surveyId", String(params.surveyId));
  fd.append("queue", String(params.queue));
  return postForm("queue_apply.php", fd);
}

// 4) survey_orchestrate_full.php -> fields: survey_id, name, queue, file, apply
export async function apiOrchestrateFull(params: {
  survey_id: string|number; name: string; queue: string|number; file: File; apply?: boolean;
}) {
  const fd = new FormData();
  fd.append("survey_id", String(params.survey_id));
  fd.append("name", params.name);
  fd.append("queue", String(params.queue));
  fd.append("file", params.file);
  if (params.apply !== undefined) fd.append("apply", String(params.apply));
  return postForm("survey_orchestrate_full.php", fd, { timeoutMs: 60000 });
}

// 5) survey_orchestrate_one.php -> fields: name, queue, file
export async function apiOrchestrateOne(params: { name: string; queue: string|number; file: File }) {
  const fd = new FormData();
  fd.append("name", params.name);
  fd.append("queue", String(params.queue));
  fd.append("file", params.file);
  return postForm("survey_orchestrate_one.php", fd, { timeoutMs: 60000 });
}
