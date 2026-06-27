import { supabase } from "../lib/supabase";
import { Donation } from "../db/schema";
import type { CharityCategory, CharityOrg } from "../types/charity";

export interface Charity {
  id: string;
  name: string;
  description: string;
  ein: string;
  logoUrl: string;
  category: string;
}

export const CHARITY_ORGS: CharityOrg[] = [
  { id: "1", name: "Red Cross", description: "Emergency relief and disaster response", category: "disaster", emoji: "🧰", impactMetric: "Emergency responses funded", totalRaised: 0, color: "#F97316" },
  { id: "2", name: "UNICEF", description: "Children's rights and emergency relief", category: "children", emoji: "🧒", impactMetric: "Children supported", totalRaised: 0, color: "#EC4899" },
  { id: "3", name: "World Food Programme", description: "Food assistance worldwide", category: "hunger", emoji: "🍽", impactMetric: "Meals funded", totalRaised: 0, color: "#8B5CF6" },
  { id: "4", name: "Doctors Without Borders", description: "Medical humanitarian aid", category: "health", emoji: "⚕", impactMetric: "Care visits funded", totalRaised: 0, color: "#EF4444" },
  { id: "5", name: "World Wildlife Fund", description: "Wildlife conservation and environmental protection", category: "environment", emoji: "🌿", impactMetric: "Habitat acres supported", totalRaised: 0, color: "#10B981" },
  { id: "6", name: "ASPCA", description: "Animal welfare and protection", category: "animals", emoji: "🐾", impactMetric: "Shelter days funded", totalRaised: 0, color: "#F59E0B" },
  { id: "7", name: "Salvation Army", description: "Disaster relief and community support", category: "disaster", emoji: "🏠", impactMetric: "Community services funded", totalRaised: 0, color: "#F97316" },
  { id: "8", name: "Feeding America", description: "Hunger relief network", category: "hunger", emoji: "🥫", impactMetric: "Food bank meals funded", totalRaised: 0, color: "#8B5CF6" },
  { id: "9", name: "St. Jude Children's Research", description: "Pediatric cancer research and treatment", category: "health", emoji: "💛", impactMetric: "Care dollars funded", totalRaised: 0, color: "#EF4444" },
  { id: "10", name: "Khan Academy", description: "Free online education for all", category: "education", emoji: "🎓", impactMetric: "Lessons supported", totalRaised: 0, color: "#3B82F6" },
];

export const CATEGORY_LABELS: Record<CharityCategory, string> = {
  all: "All Causes",
  health: "Health & Medicine",
  education: "Education",
  environment: "Environment",
  animals: "Animals",
  disaster: "Disaster Relief",
  hunger: "Hunger & Food",
  children: "Children",
  arts: "Arts & Culture",
};

export const CATEGORY_COLORS: Record<CharityCategory, string> = {
  all: "#6B7280",
  health: "#EF4444",
  education: "#3B82F6",
  environment: "#10B981",
  animals: "#F59E0B",
  disaster: "#F97316",
  hunger: "#8B5CF6",
  children: "#EC4899",
  arts: "#06B6D4",
};

export function getCharitiesByCategory(category: CharityCategory): CharityOrg[] {
  if (category === "all") return CHARITY_ORGS;
  return CHARITY_ORGS.filter((c) => c.category === category);
}

export function searchCharities(query: string): CharityOrg[] {
  const q = query.toLowerCase().trim();
  if (!q) return CHARITY_ORGS;
  return CHARITY_ORGS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
  );
}

export function getCharityById(id: string): CharityOrg | undefined {
  return CHARITY_ORGS.find((c) => c.id === id);
}

// Mock charity list (legacy — kept for backward compatibility)
export const MOCK_CHARITIES: Charity[] = [
  { id: "1", name: "Red Cross", description: "Emergency relief and disaster response", ein: "53-0196605", logoUrl: "", category: "Disaster Relief" },
  { id: "2", name: "UNICEF", description: "Children's rights and emergency relief", ein: "13-1760110", logoUrl: "", category: "Children" },
  { id: "3", name: "World Food Programme", description: "Food assistance worldwide", ein: "13-1760110", logoUrl: "", category: "Hunger" },
  { id: "4", name: "Doctors Without Borders", description: "Medical humanitarian aid", ein: "13-1754319", logoUrl: "", category: "Health" },
];

export async function donatePlates(userId: string, charity: Charity, platesAmount: number): Promise<Donation> {
  const { data, error } = await supabase.from("donations").insert({
    user_id: userId,
    charity_name: charity.name,
    charity_ein: charity.ein,
    plates_amount: platesAmount,
    usd_value: platesAmount,
    status: "pending",
  }).select().single();
  if (error) throw error;
  return data as Donation;
}

export async function getUserDonations(userId: string): Promise<Donation[]> {
  const { data, error } = await supabase.from("donations").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) return [];
  return (data || []) as Donation[];
}
