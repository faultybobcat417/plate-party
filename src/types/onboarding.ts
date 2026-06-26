export type OnboardingStep = "welcome" | "intention" | "charities" | "tutorial" | "firstGoal" | "complete";

export type UserIntention =
  | "get_fit"
  | "learn_something"
  | "build_habit"
  | "save_money"
  | "help_others"
  | "have_fun";

export interface IntentionOption {
  id: UserIntention;
  emoji: string;
  title: string;
  description: string;
  suggestedGoals: string[];
  color: string;
}

export const INTENTION_OPTIONS: IntentionOption[] = [
  {
    id: "get_fit",
    emoji: "💪",
    title: "Get Fit",
    description: "Build strength, endurance, and feel your best.",
    suggestedGoals: ["Gym 3x this week", "Run 5K", "10K steps daily"],
    color: "#FF6B35",
  },
  {
    id: "learn_something",
    emoji: "📚",
    title: "Learn Something",
    description: "Read more, study up, or pick up a new skill.",
    suggestedGoals: ["Read 1 book this month", "30 min study daily", "Learn 10 new words"],
    color: "#3498DB",
  },
  {
    id: "build_habit",
    emoji: "🔥",
    title: "Build a Habit",
    description: "Create routines that stick and level up your life.",
    suggestedGoals: ["Wake up at 6am", "No soda for 7 days", "Meditate 10 min daily"],
    color: "#E74C3C",
  },
  {
    id: "save_money",
    emoji: "💰",
    title: "Save Money",
    description: "Cut spending, budget better, and build wealth.",
    suggestedGoals: ["No takeout this week", "Save $50 this month", "Track every expense"],
    color: "#27AE60",
  },
  {
    id: "help_others",
    emoji: "🤝",
    title: "Help Others",
    description: "Turn your personal growth into global impact.",
    suggestedGoals: ["Volunteer 2 hours", "Donate old clothes", "Compliment 3 people daily"],
    color: "#9B59B6",
  },
  {
    id: "have_fun",
    emoji: "🎮",
    title: "Have Fun",
    description: "Play games, win plates, and enjoy the ride.",
    suggestedGoals: ["Win 5 games this week", "Beat your high score", "Try a new game"],
    color: "#F39C12",
  },
];

export function getIntentionById(id: UserIntention): IntentionOption | undefined {
  return INTENTION_OPTIONS.find((i) => i.id === id);
}
