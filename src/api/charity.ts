import { supabase } from "../lib/supabase";
import { Donation } from "../db/schema";

export interface Charity {
  id: string;
  name: string;
  description: string;
  ein: string;
  logoUrl: string;
  category: string;
}

// Mock charity list (replace with Every.org API call in production)
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
