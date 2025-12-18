export interface UploadVoiceRequest {
  survey_id: string;
  purpose: string;
  file: File;
}

export interface ApplyDialplanRequest {
  surveyId: string;
}

export interface QueueApplyRequest {
  surveyId: string;
  queue: string;
}

export interface SurveyOrchestrateFullRequest {
  survey_id: string;
  name: string;
  queue: string;
  file: File;
  apply: boolean | string;
}

export interface SurveyOrchestrateOneRequest {
  name: string;
  queue: string;
  file: File;
}

export interface VoiceApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}
