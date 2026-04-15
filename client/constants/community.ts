import type { PostType } from "@/services/communityApi";

export const POST_TYPE_CONFIG: Record<
  PostType,
  { label: string; icon: string; emoji: string; color: string }
> = {
  success: {
    label: "Success Story",
    icon: "Sprout",
    emoji: "🌱",
    color: "bg-primary/10 text-primary",
  },
  question: {
    label: "Question",
    icon: "HelpCircle",
    emoji: "❓",
    color: "bg-sky-50 text-sky-700",
  },
  problem: {
    label: "Problem",
    icon: "AlertTriangle",
    emoji: "⚠️",
    color: "bg-amber-50 text-amber-700",
  },
  update: {
    label: "Field Update",
    icon: "Image",
    emoji: "📸",
    color: "bg-secondary/10 text-secondary",
  },
};

export const REACTION_CONFIG = {
  helpful: { icon: "ThumbsUp", label: "Helpful", countText: "found this helpful" },
  tried: { icon: "Sprout", label: "Tried", countText: "tried this" },
  didnt_work: {
    icon: "AlertTriangle",
    label: "Didn't work",
    countText: "said didn't work",
  },
  new_idea: { icon: "Lightbulb", label: "New idea", countText: "got new ideas" },
};
