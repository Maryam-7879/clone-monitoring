export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UploadResponse {
  filename: string;
  originalName: string;
  path: string;
  size: number;
}

export interface QuestionCreateRequest {
  text: string;
  allowedKeys: string;
  order: number;
  audioFilename?: string;
  isActive: boolean;
  callType: 'inbound' | 'outbound' | 'both';
}

export interface QuestionUpdateRequest extends Partial<QuestionCreateRequest> {
  id: string;
}