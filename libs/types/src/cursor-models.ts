/**
 * Cursor CLI Model IDs
 * Reference: https://cursor.com/docs
 */
export type CursorModelId =
  | 'auto' // Auto-select best model
  | 'composer-1' // Cursor Composer agent model
  | 'sonnet-4.5' // Claude Sonnet 4.5
  | 'sonnet-4.5-thinking' // Claude Sonnet 4.5 with extended thinking
  | 'opus-4.5' // Claude Opus 4.5
  | 'opus-4.5-thinking' // Claude Opus 4.5 with extended thinking
  | 'opus-4.1' // Claude Opus 4.1
  | 'gemini-3-pro' // Gemini 3 Pro
  | 'gemini-3-flash' // Gemini 3 Flash
  | 'gpt-5.2' // GPT-5.2
  | 'gpt-5.1' // GPT-5.1
  | 'gpt-5.2-high' // GPT-5.2 High
  | 'gpt-5.1-high' // GPT-5.1 High
  | 'gpt-5.1-codex' // GPT-5.1 Codex
  | 'gpt-5.1-codex-high' // GPT-5.1 Codex High
  | 'gpt-5.1-codex-max' // GPT-5.1 Codex Max
  | 'gpt-5.1-codex-max-high' // GPT-5.1 Codex Max High
  | 'grok'; // Grok

/**
 * Cursor model metadata
 */
export interface CursorModelConfig {
  id: CursorModelId;
  label: string;
  description: string;
  hasThinking: boolean;
  tier: 'free' | 'pro';
}

/**
 * Complete model map for Cursor CLI
 */
export const CURSOR_MODEL_MAP: Record<CursorModelId, CursorModelConfig> = {
  auto: {
    id: 'auto',
    label: 'Auto (Recommended)',
    description: 'Automatically selects the best model for each task',
    hasThinking: false,
    tier: 'free',
  },
  'composer-1': {
    id: 'composer-1',
    label: 'Composer 1',
    description: 'Cursor Composer agent model optimized for multi-file edits',
    hasThinking: false,
    tier: 'pro',
  },
  'sonnet-4.5': {
    id: 'sonnet-4.5',
    label: 'Claude Sonnet 4.5',
    description: 'Anthropic Claude Sonnet 4.5 via Cursor',
    hasThinking: false,
    tier: 'pro',
  },
  'sonnet-4.5-thinking': {
    id: 'sonnet-4.5-thinking',
    label: 'Claude Sonnet 4.5 (Thinking)',
    description: 'Claude Sonnet 4.5 with extended thinking enabled',
    hasThinking: true,
    tier: 'pro',
  },
  'opus-4.5': {
    id: 'opus-4.5',
    label: 'Claude Opus 4.5',
    description: 'Anthropic Claude Opus 4.5 via Cursor',
    hasThinking: false,
    tier: 'pro',
  },
  'opus-4.5-thinking': {
    id: 'opus-4.5-thinking',
    label: 'Claude Opus 4.5 (Thinking)',
    description: 'Claude Opus 4.5 with extended thinking enabled',
    hasThinking: true,
    tier: 'pro',
  },
  'opus-4.1': {
    id: 'opus-4.1',
    label: 'Claude Opus 4.1',
    description: 'Anthropic Claude Opus 4.1 via Cursor',
    hasThinking: false,
    tier: 'pro',
  },
  'gemini-3-pro': {
    id: 'gemini-3-pro',
    label: 'Gemini 3 Pro',
    description: 'Google Gemini 3 Pro via Cursor',
    hasThinking: false,
    tier: 'pro',
  },
  'gemini-3-flash': {
    id: 'gemini-3-flash',
    label: 'Gemini 3 Flash',
    description: 'Google Gemini 3 Flash (faster)',
    hasThinking: false,
    tier: 'pro',
  },
  'gpt-5.2': {
    id: 'gpt-5.2',
    label: 'GPT-5.2',
    description: 'OpenAI GPT-5.2 via Cursor',
    hasThinking: false,
    tier: 'pro',
  },
  'gpt-5.1': {
    id: 'gpt-5.1',
    label: 'GPT-5.1',
    description: 'OpenAI GPT-5.1 via Cursor',
    hasThinking: false,
    tier: 'pro',
  },
  'gpt-5.2-high': {
    id: 'gpt-5.2-high',
    label: 'GPT-5.2 High',
    description: 'OpenAI GPT-5.2 with high compute',
    hasThinking: false,
    tier: 'pro',
  },
  'gpt-5.1-high': {
    id: 'gpt-5.1-high',
    label: 'GPT-5.1 High',
    description: 'OpenAI GPT-5.1 with high compute',
    hasThinking: false,
    tier: 'pro',
  },
  'gpt-5.1-codex': {
    id: 'gpt-5.1-codex',
    label: 'GPT-5.1 Codex',
    description: 'OpenAI GPT-5.1 Codex for code generation',
    hasThinking: false,
    tier: 'pro',
  },
  'gpt-5.1-codex-high': {
    id: 'gpt-5.1-codex-high',
    label: 'GPT-5.1 Codex High',
    description: 'OpenAI GPT-5.1 Codex with high compute',
    hasThinking: false,
    tier: 'pro',
  },
  'gpt-5.1-codex-max': {
    id: 'gpt-5.1-codex-max',
    label: 'GPT-5.1 Codex Max',
    description: 'OpenAI GPT-5.1 Codex Max capacity',
    hasThinking: false,
    tier: 'pro',
  },
  'gpt-5.1-codex-max-high': {
    id: 'gpt-5.1-codex-max-high',
    label: 'GPT-5.1 Codex Max High',
    description: 'OpenAI GPT-5.1 Codex Max with high compute',
    hasThinking: false,
    tier: 'pro',
  },
  grok: {
    id: 'grok',
    label: 'Grok',
    description: 'xAI Grok via Cursor',
    hasThinking: false,
    tier: 'pro',
  },
};

/**
 * Helper: Check if model has thinking capability
 */
export function cursorModelHasThinking(modelId: CursorModelId): boolean {
  return CURSOR_MODEL_MAP[modelId]?.hasThinking ?? false;
}

/**
 * Helper: Get display name for model
 */
export function getCursorModelLabel(modelId: CursorModelId): string {
  return CURSOR_MODEL_MAP[modelId]?.label ?? modelId;
}

/**
 * Helper: Get all cursor model IDs
 */
export function getAllCursorModelIds(): CursorModelId[] {
  return Object.keys(CURSOR_MODEL_MAP) as CursorModelId[];
}
