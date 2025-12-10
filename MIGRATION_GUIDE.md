## Frontend
- Routes still import `Home` and `Upload` from `@/pages/Home` and `@/pages/Upload`; the heavy implementations now live under `@/pages/home/*` and `@/pages/upload/*`. Import subcomponents/hooks directly from those folders for new work.
- API helpers were modularized under `@/lib/api/{client,resources,objects,metadata}` and re-exported via `@/lib/api`. Update any deep imports to use the new module if you need a specific concern.
- Shared debounce utility now lives at `@/hooks/useDebouncedValue`.

## Backend
- Resource route logic is now split between `app/services/resource_service.py` and `app/services/resource_metadata_service.py`. Route handlers (`app/routes/resources.py`) should stay thin and call into services.
- Pytest fixtures moved to `tests/fixtures/{database.py,client.py,users.py,resources.py}`; `tests/conftest.py` only loads plugins.
- Resource tests are organized under `tests/resources/` by concern (create, list, search, link/pdf, etc.). Gemini tests live under `tests/gemini/`.

## Testing/Imports
- Replace any imports of `tests.conftest.TestResourceModel` with `tests.fixtures.database.TestResourceModel`.
- For link/PDF search/create tests, target the specific module under `tests/resources/` instead of the previous monolithic `test_resources.py`.

## Packets
- Packets: added packets folder/service/API following resource patterns. Packet creation UI in `pages/home/components/PacketSheet.tsx`, packets listing page in `pages/packets/PacketsPage.tsx`. Backend service in `app/services/packet_service.py`, routes in `app/routes/packets.py`, frontend API in `lib/api/packets.ts`.
