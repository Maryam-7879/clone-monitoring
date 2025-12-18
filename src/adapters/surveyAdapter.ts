import { SurveyResult, SurveyStats, AgentPerformance } from '../types/survey';

export const calculateSurveyStats = (results: SurveyResult[]): SurveyStats => {
  if (results.length === 0) {
    return {
      totalSurveys: 0,
      averageScore: 0,
      satisfactionRate: 0,
      dissatisfactionRate: 0,
      averageTalkTime: 0,
      scoreDistribution: {},
    };
  }

  const totalSurveys = results.length;
  const totalScore = results.reduce((sum, result) => sum + (typeof result.score === 'number' ? result.score : 0), 0);
  const averageScore = totalScore / totalSurveys;

  const satisfiedCount = results.filter(r => r.score != null && r.score >= 4).length;
  const dissatisfiedCount = results.filter(r => r.score != null && r.score <= 2).length;
  const satisfactionRate = (satisfiedCount / totalSurveys) * 100;
  const dissatisfactionRate = (dissatisfiedCount / totalSurveys) * 100;

  const totalTalkTime = results.reduce((sum, result) => sum + (result.talkTime || 0), 0);
  const averageTalkTime = totalTalkTime / totalSurveys;

  const scoreDistribution: Record<number, number> = {};
  for (let i = 1; i <= 5; i++) {
    scoreDistribution[i] = results.filter(r => r.score === i).length;
  }

  return {
    totalSurveys,
    averageScore,
    satisfactionRate,
    dissatisfactionRate,
    averageTalkTime,
    scoreDistribution,
  };
};

export const calculateAgentPerformance = (results: SurveyResult[]): AgentPerformance[] => {
  if (results.length === 0) return [];

  const agentGroups = results.reduce((groups, result) => {
    const key = `${result.agent}-${result.extension}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(result);
    return groups;
  }, {} as Record<string, SurveyResult[]>);

  return Object.entries(agentGroups).map(([key, agentResults]) => {
    const [agent, extension] = key.split('-');
    const totalSurveys = agentResults.length;
    const totalScore = agentResults.reduce((sum, r) => sum + (typeof r.score === 'number' ? r.score : 0), 0);
    const averageScore = totalScore / totalSurveys;
    const satisfiedCount = agentResults.filter(r => r.score != null && r.score >= 4).length;
    const satisfactionRate = (satisfiedCount / totalSurveys) * 100;
    const totalTalkTime = agentResults.reduce((sum, r) => sum + (r.talkTime || 0), 0);
    const averageTalkTime = totalTalkTime / totalSurveys;

    return {
      agent,
      extension,
      totalSurveys,
      averageScore,
      satisfactionRate,
      averageTalkTime,
    };
  }).sort((a, b) => b.averageScore - a.averageScore);
};

export const formatTalkTime = (seconds?: number | null): string => {
  const totalSeconds = typeof seconds === 'number' ? seconds : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString?: string | null): string => {
  try {
    if (!dateString) return '';
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
  } catch {
    return dateString;
  }
};

export const formatTime = (dateString?: string | null): string => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateString;
  }
};