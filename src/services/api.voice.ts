import axios from 'axios';
import type {
  UploadVoiceRequest,
  ApplyDialplanRequest,
  QueueApplyRequest,
  SurveyOrchestrateFullRequest,
  SurveyOrchestrateOneRequest,
  VoiceApiResponse
} from '../types/voice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/survay/api';

const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0');
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
};

export const uploadVoice = async (
  request: UploadVoiceRequest
): Promise<VoiceApiResponse> => {
  try {
    const formData = createFormData({
      survey_id: request.survey_id,
      purpose: request.purpose,
      upload: request.file
    });

    const response = await axios.post<VoiceApiResponse>(
      `${API_BASE_URL}/upload_voice.php`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Upload failed'
    };
  }
};

export const applyDialplan = async (
  request: ApplyDialplanRequest
): Promise<VoiceApiResponse> => {
  try {
    const formData = createFormData({
      surveyId: request.surveyId
    });

    const response = await axios.post<VoiceApiResponse>(
      `${API_BASE_URL}/apply_dialplan.php`,
      formData
    );

    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Apply dialplan failed'
    };
  }
};

export const queueApply = async (
  request: QueueApplyRequest
): Promise<VoiceApiResponse> => {
  try {
    const formData = createFormData({
      surveyId: request.surveyId,
      queue: request.queue
    });

    const response = await axios.post<VoiceApiResponse>(
      `${API_BASE_URL}/queue_apply.php`,
      formData
    );

    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Queue apply failed'
    };
  }
};

export const surveyOrchestrateFull = async (
  request: SurveyOrchestrateFullRequest
): Promise<VoiceApiResponse> => {
  try {
    const formData = createFormData({
      survey_id: request.survey_id,
      name: request.name,
      queue: request.queue,
      file: request.file,
      apply: request.apply
    });

    const response = await axios.post<VoiceApiResponse>(
      `${API_BASE_URL}/survey_orchestrate_full.php`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Survey orchestration failed'
    };
  }
};

export const surveyOrchestrateOne = async (
  request: SurveyOrchestrateOneRequest
): Promise<VoiceApiResponse> => {
  try {
    const formData = createFormData({
      name: request.name,
      queue: request.queue,
      file: request.file
    });

    const response = await axios.post<VoiceApiResponse>(
      `${API_BASE_URL}/survey_orchestrate_one.php`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Survey orchestration failed'
    };
  }
};
