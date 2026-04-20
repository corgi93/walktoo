import { supabase } from '../client';

// ─── Types ──────────────────────────────────────────────

export interface PackEntitlement {
  id: string;
  packId: string;
  purchasedAt: string;
  revenuecatProductId: string | null;
}

interface PackEntitlementRow {
  id: string;
  pack_id: string;
  purchased_at: string;
  revenuecat_product_id: string | null;
}

// ─── 소유 팩 목록 조회 ──────────────────────────────────

export async function listOwnedPacks(
  coupleId: string,
): Promise<PackEntitlement[]> {
  const { data, error } = await supabase
    .from('couple_pack_entitlements')
    .select('id, pack_id, purchased_at, revenuecat_product_id')
    .eq('couple_id', coupleId)
    .returns<PackEntitlementRow[]>();

  if (error) {
    console.warn('[packs] listOwnedPacks error:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    packId: row.pack_id,
    purchasedAt: row.purchased_at,
    revenuecatProductId: row.revenuecat_product_id,
  }));
}

// ─── 단일 팩 구매 기록 (RPC) ────────────────────────────

export async function markPackPurchased(
  packId: string,
  revenuecatProductId: string,
): Promise<{ success: boolean; reason?: 'no_couple' }> {
  const { data, error } = await supabase.rpc('mark_pack_purchased', {
    p_pack_id: packId,
    p_revenuecat_product_id: revenuecatProductId,
  });

  if (error) {
    console.warn('[packs] mark_pack_purchased error:', error.message);
    return { success: false };
  }

  const result = data as { success: boolean; reason?: 'no_couple' };
  return result;
}

export const packsService = {
  listOwnedPacks,
  markPackPurchased,
};
