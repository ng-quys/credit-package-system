export const FEATURE_CODE = {
  AI_CHAT: 'AI_CHAT',
  AUTO_POST: 'AUTO_POST',
} as const;

export const FEATURE_CREDIT_COST: Record<string, number> = {
  [FEATURE_CODE.AI_CHAT]: 5,
  [FEATURE_CODE.AUTO_POST]: 20,
};
