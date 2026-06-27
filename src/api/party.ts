import { supabase } from "../lib/supabase";
import { Party, PartyMember } from "../db/schema";
import * as Crypto from "expo-crypto";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = Crypto.getRandomBytes(6);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

export async function createParty(name: string, description: string | null, hostId: string, isPrivate: boolean = false): Promise<Party> {
  const inviteCode = generateInviteCode();
  const { data, error } = await supabase.from("parties").insert({ name, description, host_id: hostId, invite_code: inviteCode, is_private: isPrivate }).select().single();
  if (error) throw error;
  await supabase.from("party_members").insert({ party_id: data.id, user_id: hostId, role: "host" });
  return data as Party;
}

export async function getPartyById(partyId: string): Promise<Party | null> {
  const { data, error } = await supabase.from("parties").select("*").eq("id", partyId).is("deleted_at", null).single();
  if (error) return null;
  return data as Party;
}

export async function getPartyByInviteCode(inviteCode: string): Promise<Party | null> {
  const { data, error } = await supabase.from("parties").select("*").eq("invite_code", inviteCode.toUpperCase()).is("deleted_at", null).single();
  if (error) return null;
  return data as Party;
}

export async function getUserParties(userId: string): Promise<Party[]> {
  const { data, error } = await supabase.from("party_members").select("party_id").eq("user_id", userId).is("deleted_at", null);
  if (error || !data?.length) return [];
  const partyIds = data.map((m) => m.party_id);
  const { data: parties } = await supabase.from("parties").select("*").in("id", partyIds).is("deleted_at", null).order("created_at", { ascending: false });
  return (parties || []) as Party[];
}

export async function joinParty(partyId: string, userId: string): Promise<PartyMember> {
  const { data, error } = await supabase.from("party_members").insert({ party_id: partyId, user_id: userId, role: "member" }).select().single();
  if (error) throw error;
  return data as PartyMember;
}

export async function leaveParty(partyId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("party_members").update({ deleted_at: new Date().toISOString() }).eq("party_id", partyId).eq("user_id", userId);
  if (error) throw error;
}

export async function getPartyMembers(partyId: string): Promise<PartyMember[]> {
  const { data, error } = await supabase.from("party_members").select("*").eq("party_id", partyId).is("deleted_at", null);
  return (data || []) as PartyMember[];
}

export async function updateParty(partyId: string, updates: Partial<Pick<Party, "name" | "description" | "isPrivate">>): Promise<Party> {
  const { isPrivate, ...rest } = updates;
  const payload = {
    ...rest,
    ...(typeof isPrivate === "boolean" ? { is_private: isPrivate } : {}),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("parties").update(payload).eq("id", partyId).select().single();
  if (error) throw error;
  return data as Party;
}

export async function deleteParty(partyId: string, _deviceId?: string): Promise<void> {
  const { error } = await supabase.from("parties").update({ deleted_at: new Date().toISOString() }).eq("id", partyId);
  if (error) throw error;
}


// Backward-compatible aliases
export const archiveParty = deleteParty;

export async function getMembership(partyId: string, userId: string): Promise<PartyMember | null> {
  const { data, error } = await supabase.from("party_members").select("*").eq("party_id", partyId).eq("user_id", userId).is("deleted_at", null).single();
  if (error) return null;
  return data as PartyMember;
}
