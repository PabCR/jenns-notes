## Storage Bucket Access (pdfs)

### Before
- No documented path for patient/public PDF retrieval.
- Uploads used signed upload URLs via FastAPI with the service role key.

### After
- Bucket remains private; no anonymous storage policy changes.
- New FastAPI endpoint `/api/objects/public/packets/{share_link}/resources/{resource_id}/signed-url` returns a temporary signed download URL after verifying the resource is part of the shared packet.
- Upload flow unchanged: `/api/objects/upload` still issues signed upload URLs with the service role key.
