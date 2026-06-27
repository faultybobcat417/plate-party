import { type CharityOrg, type CharityCategory } from "../types/charity";

export const CHARITY_ORGS: CharityOrg[] = [
  {
    id: "charity-001",
    name: "Feeding Tomorrow",
    description: "Every plate feeds a child. We provide school meals to underserved communities worldwide.",
    category: "hunger",
    emoji: "🍎",
    impactMetric: "1 plate = 1 school meal",
    totalRaised: 125000,
    color: "#FF6B35",
  },
  {
    id: "charity-002",
    name: "Green Earth Alliance",
    description: "Plant trees with every goal. Reforesting degraded land one sapling at a time.",
    category: "environment",
    emoji: "🌳",
    impactMetric: "10 plates = 1 tree planted",
    totalRaised: 89000,
    color: "#2ECC71",
  },
  {
    id: "charity-003",
    name: "Health First Global",
    description: "Vaccines for underserved communities. Protecting the most vulnerable.",
    category: "health",
    emoji: "💉",
    impactMetric: "50 plates = 1 vaccination",
    totalRaised: 210000,
    color: "#E74C3C",
  },
  {
    id: "charity-004",
    name: "Books for All",
    description: "One book per 10 plates. Building libraries where they are needed most.",
    category: "education",
    emoji: "📚",
    impactMetric: "10 plates = 1 book",
    totalRaised: 67000,
    color: "#3498DB",
  },
  {
    id: "charity-005",
    name: "Paws & Protect",
    description: "Rescue and rehabilitate wildlife. Every plate helps an animal in need.",
    category: "animals",
    emoji: "🐾",
    impactMetric: "100 plates = 1 rescue mission",
    totalRaised: 54000,
    color: "#9B59B6",
  },
  {
    id: "charity-006",
    name: "Rapid Relief",
    description: "Emergency aid within 24 hours. When disaster strikes, we strike back.",
    category: "disaster",
    emoji: "🚨",
    impactMetric: "25 plates = 1 emergency kit",
    totalRaised: 180000,
    color: "#F39C12",
  },
  {
    id: "charity-007",
    name: "Clean Water Now",
    description: "Wells for villages in need. Clean water is a human right.",
    category: "health",
    emoji: "💧",
    impactMetric: "500 plates = 1 water well",
    totalRaised: 320000,
    color: "#1ABC9C",
  },
  {
    id: "charity-008",
    name: "Code the Future",
    description: "Teach coding to underserved youth. Building the next generation of creators.",
    category: "education",
    emoji: "💻",
    impactMetric: "20 plates = 1 hour of instruction",
    totalRaised: 45000,
    color: "#34495E",
  },
  {
    id: "charity-009",
    name: "Ocean Guardians",
    description: "Remove plastic from oceans. Protecting marine life for future generations.",
    category: "environment",
    emoji: "🌊",
    impactMetric: "5 plates = 1 lb plastic removed",
    totalRaised: 78000,
    color: "#00BCD4",
  },
  {
    id: "charity-010",
    name: "Shelter Hope",
    description: "Housing for displaced families. Everyone deserves a roof over their head.",
    category: "disaster",
    emoji: "🏠",
    impactMetric: "200 plates = 1 shelter kit",
    totalRaised: 156000,
    color: "#E67E22",
  },
  {
    id: "charity-011",
    name: "Mental Health Matters",
    description: "Free counseling for those in need. Breaking the stigma, one session at a time.",
    category: "health",
    emoji: "🧠",
    impactMetric: "30 plates = 1 counseling session",
    totalRaised: 98000,
    color: "#8E44AD",
  },
  {
    id: "charity-012",
    name: "Farm to Table",
    description: "Sustainable agriculture training. Teaching communities to feed themselves.",
    category: "hunger",
    emoji: "🌾",
    impactMetric: "15 plates = 1 training session",
    totalRaised: 43000,
    color: "#D4AC0D",
  },
  {
    id: "charity-013",
    name: "Wildlife Warriors",
    description: "Anti-poaching patrols. Protecting endangered species in their natural habitat.",
    category: "animals",
    emoji: "🦏",
    impactMetric: "250 plates = 1 patrol day",
    totalRaised: 112000,
    color: "#27AE60",
  },
  {
    id: "charity-014",
    name: "STEM for Girls",
    description: "Girls in science and tech. Closing the gender gap one experiment at a time.",
    category: "education",
    emoji: "🔬",
    impactMetric: "40 plates = 1 lab kit",
    totalRaised: 61000,
    color: "#E91E63",
  },
  {
    id: "charity-015",
    name: "Rebuild Together",
    description: "Community reconstruction. Helping neighborhoods rise from the rubble.",
    category: "disaster",
    emoji: "🔨",
    impactMetric: "1000 plates = 1 home rebuilt",
    totalRaised: 267000,
    color: "#795548",
  },
];

export const CATEGORY_LABELS: Record<CharityCategory, string> = {
  all: "All",
  education: "Education",
  health: "Health",
  environment: "Environment",
  hunger: "Hunger",
  animals: "Animals",
  disaster: "Disaster",
};

export const CATEGORY_COLORS: Record<CharityCategory, string> = {
  all: "#333",
  education: "#3498DB",
  health: "#E74C3C",
  environment: "#2ECC71",
  hunger: "#FF6B35",
  animals: "#9B59B6",
  disaster: "#F39C12",
};

export function getCharityById(id: string): CharityOrg | undefined {
  return CHARITY_ORGS.find((c) => c.id === id);
}

export function getCharitiesByCategory(category: CharityCategory): CharityOrg[] {
  if (category === "all") return CHARITY_ORGS;
  return CHARITY_ORGS.filter((c) => c.category === category);
}

export function searchCharities(query: string): CharityOrg[] {
  const q = query.toLowerCase();
  return CHARITY_ORGS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
  );
}
