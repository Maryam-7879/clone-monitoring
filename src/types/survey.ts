export interface SurveyResult {
  id: number;
  callId: number;
  uniqueId: string;
  callerNumber: string;
  extension: string;
  queue: string;
  agent: string;
  score: number | null;
  talkTime: number | null;
  startedAt: string | null;
  completedAt: string | null;
  callDate: string;
  recordingUrl?: string | null;
  downloadUrl?: string | null;
}

export interface SurveyResultsResponse {
  success: boolean;
  data: {
    items: SurveyResult[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    stats: SurveyStats;
  };
  error: string | null;
}

export interface SurveyFilters {
  from?: string;
  to?: string;
  extension?: string;
  queue?: string;
  agent?: string;
  caller?: string;
  minScore?: number;
  maxScore?: number;
  page?: number;
  pageSize?: number;
}

export interface SurveyStats {
  totalSurveys: number;
  averageScore: number;
  satisfactionRate: number; // امتیاز 4 و 5
  dissatisfactionRate: number; // امتیاز 1 و 2
  averageTalkTime: number;
  scoreDistribution: Record<number, number>;
}

export interface AgentPerformance {
  agent: string;
  extension: string;
  totalSurveys: number;
  averageScore: number;
  satisfactionRate: number;
  averageTalkTime: number;
}