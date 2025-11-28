
export enum ConfidenceLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export type Outcome = 'pending' | 'correct' | 'incorrect';

export interface Odds {
  home: string;
  draw: string;
  away: string;
}

export interface Scenario {
  name: string;
  probability: string;
  description: string;
}

export interface PredictionDetails {
  result1X2: string;
  correctScore: string;
  overUnder: string;
  btts: string;
  safeBet: string;
  valueRating?: string;
}

export interface MatchAnalysis {
  id?: string;
  matchTitle: string;
  league: string;
  kickOff?: string;
  status?: string; 
  score?: string;
  minute?: string;
  stats: string[];
  tacticalAnalysis?: string[];
  keyStats?: string[];
  riskFlags?: string[];
  scenarios?: Scenario[];
  odds?: Odds;
  prediction: PredictionDetails;
  reasoning: string;
  confidence: ConfidenceLevel;
  outcome?: Outcome;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  url?: string;
  publishedTime?: string;
  category?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  predictions?: MatchAnalysis[];
  news?: NewsItem[];
  sources?: GroundingSource[];
  timestamp: number;
}

export interface AnalysisResponse {
  reply: string;
  matches?: MatchAnalysis[];
  news?: NewsItem[];
  summary?: string; 
}

export interface ApiError {
  message: string;
}
