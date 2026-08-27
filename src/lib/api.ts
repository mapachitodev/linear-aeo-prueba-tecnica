import type { EvaluateResponse, SurveyHistoryEntry, SurveyStatus } from '../types';

const BASE = '/api/v1';

// The official audit is always 18 calibrated prompts (backend/app/core/prompts.py)
// times however many repetitions were requested.
const TOTAL_PROMPTS = 18;
const DEFAULT_ITERATIONS = 5;

// POST /survey/run is synchronous now (see backend/app/api/v1/router.py) -
// a serverless deploy target can't guarantee a background task keeps
// running, or that a later poll hits the same instance, once a response
// has been sent. So instead of a survey_id to poll, the whole result comes
// back in one request and gets persisted here, client-side.
const LATEST_KEY = 'searchbrand.latestSurvey';
const HISTORY_KEY = 'searchbrand.surveyHistory';
const HISTORY_LIMIT = 20;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export interface RunSurveyParams {
  iterations_per_prompt?: number;
  temperature?: number;
  model_name?: string;
}

/** Runs the full calibrated audit and resolves once Gemini has answered all
 * of it - can take 1-3 minutes for the default 90 queries. Callers should
 * show a time-based progress estimate (see estimateAuditDurationMs) instead
 * of a real one, since the server no longer reports live progress. */
export async function runSurvey(params: RunSurveyParams = {}): Promise<SurveyStatus> {
  const survey = await request<SurveyStatus>('/survey/run', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  persistSurvey(survey, params.iterations_per_prompt ?? DEFAULT_ITERATIONS);
  return survey;
}

/** Rough duration estimate for the client-side progress bar - not a
 * guarantee, Gemini latency and rate-limit backoff both vary run to run. */
export function estimateAuditDurationMs(iterationsPerPrompt: number = DEFAULT_ITERATIONS): number {
  const totalQueries = TOTAL_PROMPTS * iterationsPerPrompt;
  const msPerQuery = 1500;
  const concurrency = 8;
  return Math.ceil(totalQueries / concurrency) * msPerQuery;
}

export function getLatestSurvey(): SurveyStatus | null {
  try {
    const raw = localStorage.getItem(LATEST_KEY);
    return raw ? (JSON.parse(raw) as SurveyStatus) : null;
  } catch {
    return null;
  }
}

export function getSurveyHistory(): SurveyHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SurveyHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function persistSurvey(survey: SurveyStatus, iterationsPerPrompt: number): void {
  try {
    localStorage.setItem(LATEST_KEY, JSON.stringify(survey));

    const targetMetrics = survey.brand_metrics?.find((m) => m.brand === survey.target_brand);
    if (targetMetrics) {
      const entry: SurveyHistoryEntry = {
        survey_id: survey.survey_id,
        completed_at: survey.completed_at ?? new Date().toISOString(),
        iterations_per_prompt: iterationsPerPrompt,
        target_metrics: targetMetrics,
      };
      const history = [...getSurveyHistory(), entry].slice(-HISTORY_LIMIT);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch {
    // localStorage can throw (private browsing, quota exceeded) - the
    // in-memory survey state from this run still works, it just won't
    // survive a reload or show up in history.
  }
}

export function evaluatePrompt(prompt: string, temperature = 0.7) {
  return request<EvaluateResponse>('/evaluate', {
    method: 'POST',
    body: JSON.stringify({ prompt, temperature }),
  });
}
