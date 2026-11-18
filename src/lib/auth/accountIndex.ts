import { algolia_indices, search_client } from "@/lib/algolia/algolia"
import type { AccountIdentity, User } from "@/lib/auth/types"
import { get_filter_value, is_nonempty_string, is_record } from "@/lib/shared/utils"

/**
 * Busca las cuentas por identificador sin pedir credenciales.
 * @param user Sesión ADMIN.
 * @param user_ids Identificadores de las cuentas que se desean consultar.
 * @returns Cuentas encontradas, o un mapa vacío si no se pueden consultar.
 */
export async function get_indexed_account_identities(user: User | null, user_ids: string[]): Promise<Map<string, AccountIdentity>> {
  const accounts = new Map<string, AccountIdentity>()
  const index_name = algolia_indices.users
  const ids = new Set(user_ids.filter(is_nonempty_string))
  if (user?.role !== "ADMIN" || !index_name || ids.size === 0) return accounts

  const response = await search_client.searchWithHTTPInfo({
    requests: [{
      indexName: index_name,
      query: "",
      filters: [...ids].map((id) => `objectID:${get_filter_value(id)}`).join(" OR "),
      hitsPerPage: ids.size,
      distinct: false,
      analytics: false,
      attributesToRetrieve: ["username", "full_name"],
      attributesToHighlight: [],
      attributesToSnippet: [],
    }],
  }).catch(() => null)
  const result: unknown = response?.data?.results?.[0]
  if (!is_record(result) || !Array.isArray(result.hits)) return accounts

  for (const hit of result.hits) {
    if (is_record(hit) && typeof hit.objectID === "string" && ids.has(hit.objectID) &&
      is_nonempty_string(hit.username) && is_nonempty_string(hit.full_name)) {
      accounts.set(hit.objectID, { username: hit.username.trim(), full_name: hit.full_name.trim() })
    }
  }
  return accounts
}
