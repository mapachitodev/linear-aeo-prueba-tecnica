export type ThemeMode = 'light' | 'dark';

export type NavTab = 'dashboard' | 'live' | 'methodology' | 'sensitivity';

export interface BrandMetrics {
  brand: string;
  sample_size_n: number;
  visibility_rate: number;
  avg_position: number;
  position_variance: number;
  position_std_dev: number;
  top_of_mind_rate: number;
  share_of_voice: number;
  entropy_score: number;
  aeo_score: number;
}

export interface ExtractedEntity {
  brand_name: string;
  position_index: number;
  rank: number;
  sentiment: 'Positivo' | 'Neutro' | 'Negativo';
  confidence_score: number;
  context_snippet?: string | null;
}

export interface PromptEvaluationResult {
  iteration_id: string;
  prompt_id: string;
  prompt_text: string;
  category: string;
  language: string;
  model_name: string;
  raw_response: string;
  latency_ms: number;
  is_simulated: boolean;
  target_mentioned: boolean;
  target_rank: number | null;
  target_sentiment: string;
  co_occurring_brands: string[];
  parsed_entities: ExtractedEntity[];
}

export type SurveyRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface SurveyStatus {
  survey_id: string;
  status: SurveyRunStatus;
  created_at: string;
  completed_at: string | null;
  progress: number;
  total: number;
  error: string | null;
  target_brand: string | null;
  brand_metrics: BrandMetrics[] | null;
  results: PromptEvaluationResult[] | null;
  key_findings: string[] | null;
}

export interface SurveyHistoryEntry {
  survey_id: string;
  completed_at: string;
  iterations_per_prompt: number;
  target_metrics: BrandMetrics;
}

export interface EvaluateResponse {
  prompt: string;
  response: string;
  model_used: string;
  is_simulated: boolean;
  latency_ms: number;
  target_mentioned: boolean;
  target_rank: number | null;
  target_sentiment: string;
  other_brands: string[];
  timestamp: string;
}

// Brand display metadata that has no backend equivalent (colors, tier labels).
export const BRAND_COLORS: Record<string, string> = {
  Linear: '#6366f1',
  Jira: '#06b6d4',
  Asana: '#f59e0b',
  Monday: '#8b5cf6',
  Notion: '#10b981',
};

export const TARGET_BRAND = 'Linear';
