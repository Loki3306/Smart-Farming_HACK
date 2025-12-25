import type { PostType } from '@/services/communityApi';

export const POST_TYPE_CONFIG: Record<PostType, { label: string; emoji: string; color: string }> = {
  success: { label: 'Success Story', emoji: '🌱', color: 'bg-green-50 text-green-700' },
  question: { label: 'Question', emoji: '❓', color: 'bg-blue-50 text-blue-700' },
  problem: { label: 'Problem', emoji: '⚠️', color: 'bg-amber-50 text-amber-700' },
  update: { label: 'Field Update', emoji: '📸', color: 'bg-purple-50 text-purple-700' },
};

export const REACTION_CONFIG = {
  helpful: { emoji: '👍', label: 'Helpful', countText: 'found this helpful' },
  tried: { emoji: '🌱', label: 'Tried', countText: 'tried this' },
  didnt_work: { emoji: '⚠️', label: "Didn't work", countText: "said didn't work" },
  new_idea: { emoji: '💡', label: 'New idea', countText: 'got new ideas' },
};
