import { PromptEvaluationResult } from '../types';

export type Sentiment = 'Positivo' | 'Neutro' | 'Negativo';

export interface SentimentBreakdown {
  sentiment: Sentiment;
  count: number;
  rate: number;
  example?: string;
}

/** Counts how the target brand's mentions split across sentiment buckets,
 * plus one real context snippet per bucket pulled straight from the parsed
 * response - not a canned example. */
export function computeSentimentBreakdown(
  results: PromptEvaluationResult[],
  targetBrand: string
): SentimentBreakdown[] {
  const order: Sentiment[] = ['Positivo', 'Neutro', 'Negativo'];
  const total = results.length;

  return order.map((sentiment) => {
    const matches = results.filter((r) => r.target_sentiment === sentiment);
    const example = matches
      .map((r) => r.parsed_entities.find((e) => e.brand_name.toLowerCase() === targetBrand.toLowerCase())?.context_snippet)
      .find((snippet): snippet is string => !!snippet && snippet.trim().length > 0);

    return {
      sentiment,
      count: matches.length,
      rate: total > 0 ? (matches.length / total) * 100 : 0,
      example,
    };
  });
}

export interface PromptStability {
  promptId: string;
  promptText: string;
  category: string;
  repetitions: number;
  mentionRate: number;
  sentiments: string[];
  isStable: boolean;
}

/** Groups results by prompt_id (i.e. by repetitions of the *same* question
 * within one audit) and flags whether the answer held steady across those
 * repetitions - real run-to-run variance, not a config knob. */
export function computePromptStability(results: PromptEvaluationResult[]): PromptStability[] {
  const groups = new Map<string, PromptEvaluationResult[]>();
  for (const r of results) {
    if (!groups.has(r.prompt_id)) groups.set(r.prompt_id, []);
    groups.get(r.prompt_id)!.push(r);
  }

  return Array.from(groups.entries())
    .map(([promptId, items]) => {
      const mentioned = items.filter((r) => r.target_mentioned).length;
      const sentiments = Array.from(new Set(items.map((r) => r.target_sentiment)));
      const mentionRate = (mentioned / items.length) * 100;
      return {
        promptId,
        promptText: items[0].prompt_text,
        category: items[0].category,
        repetitions: items.length,
        mentionRate,
        sentiments,
        isStable: (mentionRate === 0 || mentionRate === 100) && sentiments.length <= 1,
      };
    })
    .sort((a, b) => Number(a.isStable) - Number(b.isStable));
}

export interface SegmentStat {
  label: string;
  n: number;
  visibilityRate: number;
  avgPosition: number;
}

/** Groups the target brand's own results by an arbitrary key (category,
 * language, ...) and computes visibility/position per group. Pure
 * aggregation over data the backend already returns - no new API calls. */
export function computeSegments(
  results: PromptEvaluationResult[],
  keyFn: (r: PromptEvaluationResult) => string
): SegmentStat[] {
  const groups = new Map<string, PromptEvaluationResult[]>();
  for (const r of results) {
    const key = keyFn(r);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return Array.from(groups.entries())
    .map(([label, items]) => {
      const mentioned = items.filter((r) => r.target_mentioned);
      const ranks = mentioned
        .map((r) => r.target_rank)
        .filter((r): r is number => r !== null && r !== undefined);
      return {
        label,
        n: items.length,
        visibilityRate: (mentioned.length / items.length) * 100,
        avgPosition: ranks.length > 0 ? ranks.reduce((a, b) => a + b, 0) / ranks.length : 0,
      };
    })
    .sort((a, b) => b.visibilityRate - a.visibilityRate);
}
