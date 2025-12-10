## File Organization Patterns
- **Feature folders for pages**: keep page entrypoints thin (`pages/Home.tsx`, `pages/Upload.tsx`) and place real logic under `pages/<feature>/{components,hooks,actions,state}` to separate rendering from orchestration.
- **API modules by responsibility**: place shared fetch helpers in `lib/api/client.ts` and split domain calls into `lib/api/resources.ts`, `objects.ts`, `metadata.ts`, `packets.ts`, then re-export via a barrel for ergonomic imports.
- **Service layer for routes**: keep FastAPI routers focused on validation and dependency wiring; move DB/AI logic into `app/services/*` to simplify testing and reuse.
- **Fixture plugins**: organize pytest fixtures into `tests/fixtures/*` and load them through `tests/conftest.py` to avoid bloated configuration files.
- **Tests by concern**: group endpoint tests by CRUD/search/validation topic under `tests/resources/` (and `tests/gemini/` for AI helpers, `tests/packets/` for packet operations) so each file stays short and focused.

## Packets
- Packets: service layer in `app/services/packet_service.py`, routes in `app/routes/packets.py`, frontend API in `lib/api/packets.ts`. Packet creation UI component in `pages/home/components/PacketSheet.tsx`, packets listing page in `pages/packets/PacketsPage.tsx`.
