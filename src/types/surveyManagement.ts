export interface SurveyQuestion {
  id: string;
  title: string;
  rangeMin: number;
  rangeMax: number;
  audioFile?: File | null;
  audioUrl?: string;
  audioKey?: string;
  order: number;
}

export interface Survey {
  id: string;
  name: string;
  queue: string;
  customDestination?: string;
  isActive: boolean;
  questions: SurveyQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSurveyData {
  name: string;
  queue: string;
  customDestination?: string;
  questions: Omit<SurveyQuestion, 'id'>[];
}

export interface UpdateSurveyData extends Partial<CreateSurveyData> {
  isActive?: boolean;
}

export interface Queue {
  id: string;
  name: string;
  number: string;
}

export interface Extension {
  id: string;
  number: string;
  name?: string;
}

export interface ApplyDialplanResult {
  success: boolean;
  message: string;
  logs: string[];
}
