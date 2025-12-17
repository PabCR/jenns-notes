## Row-Level Security

### Before
- RLS disabled on `resources` and `packets`.
- No role-specific policies; all access was enforced in FastAPI.
- Resources could be deleted even if referenced by a packet.

### After
- RLS enabled on `resources` and `packets`.
- Authenticated nurses:
  - `resources`: select all; insert/update/delete only when `user_id = auth.uid()`, delete blocked if referenced.
  - `packets`: select all; insert/update/delete only when `user_id = auth.uid()`.
- Anonymous (patients):
  - `packets`: can select rows with a `share_link` (frontend filters by the provided link).
  - `resources`: can select rows that appear in any packet’s `resource_ids`.
- Trigger `prevent_resource_delete_if_in_packet` blocks deletes when a resource id is present in any packet.
- Trigger function `prevent_resource_delete_if_in_packet` now has `search_path` pinned to `public` to avoid mutable search_path warnings.

### SQL applied in migration 003
- `ALTER TABLE resources ENABLE ROW LEVEL SECURITY;`
- `ALTER TABLE packets ENABLE ROW LEVEL SECURITY;`
- Policies:
  - `auth_resources_select`, `auth_resources_insert`, `auth_resources_update`, `auth_resources_delete`
  - `anon_resources_select_in_packets`
  - `auth_packets_select`, `anon_packets_select_by_share_link`, `auth_packets_insert`, `auth_packets_update`, `auth_packets_delete`
- Trigger: `trg_prevent_resource_delete` using `prevent_resource_delete_if_in_packet()`.
