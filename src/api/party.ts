import { supabase } from "../lib/supabase";
import { Party, PartyMember, NewUser } from "../db/schema";

// Generate a random 6-character invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createParty(
  name: string,
  description: string | null,
  hostId: string,
  isPrivate: boolean = false
): Promise<Party> {
  const inviteCode = generateInviteCode();

  const { data, error } = await supabase
    .from("parties")
    .insert({
      name,
      description,
      host_id: hostId,
      invite_code: inviteCode,
      is_private: isPrivate,
    })
    .select()
    .single();

  if (error) throw error;

  // Add host as member
  await supabase.from("party_members").insert({
    party_id: data.id,
    user_id: hostId,
    role: "host",
  });

  return data as Party;
}

export async function getPartyById(partyId: string): Promise<Party | null> {
  const { data, error } = await supabase
    .from("parties")
    .select("*")
    .eq("id", partyId)
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data as Party;
}

export async function getPartyByInviteCode(inviteCode: string): Promise<Party | null> {
  const { data, error } = await supabase
    .from("parties")
    .select("*")
    .eq("invite_code", inviteCode.toUpperCase())
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data as Party;
}

export async function getUserParties(userId: string): Promise<Party[]> {
  const { data, error } = await supabase
    .from("party_members")
    .select("party_id")
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error || !data || data.length === 0) return [];

  const partyIds = data.map((m) => m.party_id);

  const { data: parties, error: partiesError } = await supabase
    .from("parties")
    .select("*")
    .in("id", partyIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (partiesError) return [];
  return (parties || []) as Party[];
}

export async function joinParty(partyId: string, userId: string): Promise<PartyMember> {
  const { data, error } = await supabase
    .from("party_members")
    .insert({
      party_id: partyId,
      user_id: userId,
      role: "member",
    })
    .select()
    .single();

  if (error) throw error;
  return data as PartyMember;
}

export async function leaveParty(partyId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("party_members")
    .update({ deleted_at: new Date().toISOString() })
    .eq("party_id", partyId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function getPartyMembers(partyId: string): Promise<PartyMember[]> {
  const { data, error } = await supabase
    .from("party_members")
    .select("*")
    .eq("party_id", partyId)
    .is("deleted_at", null);

  if (error) return [];
  return (data || []) as PartyMember[];
}

export async function updateParty(
  partyId: string,
  updates: Partial<Pick<Party, "name" | "description" | "is_private">>
): Promise<Party> {
  const { data, error } = await supabase
    .from("parties")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", partyId)
    .select()
    .single();

  if (error) throw error;
  return data as Party;
}

export async function deleteParty(partyId: string): Promise<void> {
  const { error } = await supabase
    .from("parties")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", partyId);

  if (error) throw error;
}
