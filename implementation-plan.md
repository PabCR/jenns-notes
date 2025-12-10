# Vertical Implementation Plan
## Nurse Resource Binder

> **Approach**: Build features vertically (end-to-end) rather than horizontally (layer-by-layer). Each feature should be complete and testable before moving to the next.

---

## Implementation Principles

1. **Complete Each Feature Before Moving On**: Each vertical slice includes database, backend API, and frontend UI
2. **Test End-to-End**: Verify the full user flow works before proceeding
3. **Incremental Complexity**: Start with simplest implementation, add complexity gradually
4. **Follow Tech Stack**: Use FastAPI, React+TypeScript, Supabase, Gemini as specified
5. **Maintain Type Safety**: Define Pydantic models and TypeScript types for all data structures

---

## Phase 0: Project Foundation

### Goal
Set up development environment, project structure, and basic infrastructure.

### Progress
- ✅ **0.1 Project Setup** - Complete: React/Vite frontend, FastAPI backend, Tailwind CSS, shadcn/ui, shared types, and .env templates all configured
- ✅ **0.2 Supabase Setup** - Complete: Dev project created, credentials configured, storage bucket set up (20MB limit, private)
- ✅ **0.3 Development Environment** - Structure ready: CORS configured, environment loading set up (needs testing)
- ✅ **0.4 Authentication Foundation** - Complete: Supabase Auth configured, JWT validation in FastAPI, React auth context, login/signup pages, protected routes, automated tests (pytest backend tests, vitest frontend tests, integration tests)

### Tasks

#### 0.1 Project Setup
- [x] Initialize React + TypeScript + Vite project
- [x] Initialize FastAPI project structure
- [x] Configure Tailwind CSS and shadcn/ui
- [x] Set up shared TypeScript types (if using monorepo)
- [x] Configure environment variable management (.env files)

#### 0.2 Supabase Setup
- [x] Create Supabase dev project
- [ ] Create Supabase production project (deferred to Phase 12)
- [x] Configure connection strings
- [x] Set up Supabase Storage bucket for PDFs (20MB limit, private)
- [x] Configure bucket policies (private by default)

#### 0.3 Development Environment
- [x] Set up local FastAPI server (uvicorn) - Structure ready, needs testing
- [x] Set up local React dev server (Vite) - Structure ready, needs testing
- [x] Configure CORS between frontend and backend - Configured in app/main.py
- [x] Set up environment variable loading - python-dotenv configured

#### 0.4 Authentication Foundation
- [x] Configure Supabase Auth (email/password)
- [x] Create FastAPI dependency for JWT validation
- [x] Create React auth context/provider
- [x] Build login/signup pages (basic UI)
- [x] Implement protected route wrapper
- [x] Test authentication flow end-to-end
- [x] Set up automated testing infrastructure (pytest for backend, vitest for frontend)
- [x] Write backend API tests for authentication endpoints
- [x] Write frontend component tests for auth pages
- [x] Write integration tests for complete auth flows

**Deliverable**: User can register, login, and access protected routes. JWT tokens are validated on backend.

---

## Phase 1: Basic Resource Management (Notes Only)

### Goal
Enable users to create, view, edit, and delete text note resources. This establishes the core resource management pattern without file upload complexity.

### Database Schema

```sql
-- Alembic migration: 001_create_resources_table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) >= 1),
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'link', 'note')),
    content TEXT NOT NULL,  -- For notes: actual text content
    tags TEXT[] DEFAULT '{}',
    auto_tagged BOOLEAN DEFAULT FALSE,
    condition TEXT,
    audience TEXT,
    topic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resources_user_id ON resources(user_id);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);
```

### Backend Implementation

#### 1.1 SQLAlchemy Models
- [x] Create `Resource` model with SQLAlchemy
- [x] Define relationship to user (via user_id)
- [x] Add Pydantic schemas:
  - `ResourceCreate` (for POST)
  - `ResourceUpdate` (for PATCH)
  - `ResourceResponse` (for GET)

#### 1.2 API Endpoints
- [x] `POST /api/resources` - Create note resource
  - Validate user authentication
  - Validate title (required, min 1 char)
  - Validate content (required for notes)
  - Store in database
  - Return created resource
- [x] `GET /api/resources` - List all user's resources
  - Filter by user_id
  - Sort by created_at DESC
  - Return array of resources
- [x] `GET /api/resources/:id` - Get single resource
  - Validate ownership
  - Return resource or 404
- [x] `PATCH /api/resources/:id` - Update resource metadata
  - Validate ownership
  - Allow updating: title, description, tags
  - Return updated resource
- [x] `DELETE /api/resources/:id` - Delete resource
  - Validate ownership
  - Delete from database
  - Return 204 No Content

#### 1.3 Error Handling
- [x] 401 Unauthorized for missing/invalid JWT
- [x] 403 Forbidden for resource ownership mismatch
- [x] 404 Not Found for non-existent resources
- [x] 422 Validation Error for invalid input

### Frontend Implementation

#### 1.4 Upload Page - Notes Only
- [x] Create `/upload` route
- [x] Build "Type a Note" card:
  - Textarea (4 rows)
  - "Add Note" button
- [x] Build review step:
  - Title input (pre-filled from first line or "Untitled Note")
  - Description textarea (optional)
  - Tags display (empty initially)
  - Custom tag input (Enter to add)
  - Remove resource button
- [x] Build confirm step:
  - Success message
  - "Upload More" and "View Resources" buttons
- [x] Implement form validation
- [x] Connect to API endpoints
- [x] Add loading states and error handling

#### 1.5 Resources Page - Basic View
- [x] Create `/` (home) route
- [x] Build resource grid (1 column mobile)
- [x] Display note resources:
  - Title
  - Type icon (StickyNote)
  - Description (2 line clamp)
  - Tags (first 3 visible)
  - Created date
- [x] Add empty state (no resources)
- [x] Add loading skeleton cards
- [x] Connect to `GET /api/resources`
- [x] Add bottom navigation (Home, Upload - Packets disabled)

**Deliverable**: User can create text notes, view them in a grid, edit metadata, and delete them. Full CRUD working for notes.

---

## Phase 2: Resource Search & Filtering

### Goal
Enable users to search and filter their resources by title, description, and tags.

### Progress
- ✅ **2.1 Enhanced Search Endpoint** - Complete: Added search and type query parameters with PostgreSQL ILIKE pattern matching
- ✅ **2.2 Search UI** - Complete: Search input with debouncing, clear functionality, and "No results" state
- ✅ **2.3 Enhanced Resource Cards** - Complete: Selection checkboxes, visual highlighting, responsive grid
- ✅ **2.4 Type System Fix** - Complete: Added camelCase serialization aliases to ResourceResponse schema

### Backend Implementation

#### 2.1 Enhanced Search Endpoint
- [x] Extend `GET /api/resources` with query parameters:
  - `search` (optional): Text search across title, description, tags
  - `type` (optional): Filter by resource type
- [x] Implement PostgreSQL full-text search or ILIKE pattern matching
- [x] Return filtered results
- [x] Add comprehensive test coverage (18 test cases in TestSearchResources class)

### Frontend Implementation

#### 2.2 Search UI
- [x] Add search input to Resources page header
- [x] Implement server-side search with 300ms debouncing
- [x] Add search icon (lucide-react)
- [x] Show "No results" empty state when search yields nothing
- [x] Clear search functionality

#### 2.3 Enhanced Resource Cards
- [x] Add checkbox for selection (for future packet creation)
- [x] Add click handler to toggle selection
- [x] Visual highlight for selected cards (blue border and background)
- [x] Improve responsive grid (1 column mobile, 2 columns tablet, 3 columns desktop)

#### 2.4 Type System Alignment
- [x] Updated ResourceResponse schema to serialize snake_case fields to camelCase
- [x] Added serialization aliases: userId, autoTagged, createdAt, updatedAt
- [x] TypeScript types now match API responses

**Deliverable**: User can search resources by text and see filtered results. Resource cards support selection. ✅

---

## Phase 3: Link Resources

### Goal
Enable users to add external link resources in addition to notes.

### Progress
- ✅ **3.1 Link Validation** - Complete: URL validation in ResourceCreate schema using urllib.parse, validates http/https protocol
- ✅ **3.2 Upload Page - Add Links** - Complete: "Add External Link" card with URL input, validation, title pre-fill from domain, URL preview in review step
- ✅ **3.3 Resource Cards** - Complete: Link icon (LinkIcon from lucide-react) for link resources, "Visit Link" button opens URLs in new tab
- ✅ **3.4 Test Coverage** - Complete: 18 new tests for URL validation and link resource CRUD operations (70 tests passing total)

### Backend Implementation

#### 3.1 Link Validation
- [x] Add URL validation to `ResourceCreate` schema
- [x] Validate URL format for link type resources (http/https protocol required)
- [x] Store URL in `content` field for link type
- [x] Remove note-only restriction from POST /api/resources endpoint

### Frontend Implementation

#### 3.2 Upload Page - Add Links
- [x] Add "Add External Link" card to upload page:
  - URL input field
  - "Add Link" button
- [x] Validate URL format before adding to pending list
- [x] In review step:
  - Pre-fill title from URL domain or "Untitled Link"
  - Show URL preview
  - Allow editing title and description
- [x] Update resource cards to show Link icon
- [x] Add "Visit Link" button to resource cards (opens in new tab)

**Deliverable**: User can add external links as resources, view them in the grid, and click to visit the URL. ✅

---

## Phase 4: PDF Upload & Storage

### Goal
Enable users to upload PDF files and store them securely in Supabase Storage.

### Database Schema

```sql
-- No schema changes needed - content field stores storage path
-- Example: content = 'uploads/abc123-def456-ghi789.pdf'
```

### Backend Implementation

#### 4.1 Supabase Storage Integration
- [x] Configure Supabase Storage client
- [x] Create presigned URL endpoint: `POST /api/objects/upload`
  - Generate UUID for file
  - Create presigned PUT URL (15-minute TTL)
  - Return URL and file path
- [x] Create file serving endpoint: `GET /objects/:path`
  - Validate file exists
  - Stream file with correct Content-Type
  - Set Cache-Control headers

#### 4.2 PDF Resource Creation
- [x] Update `POST /api/resources` to handle PDF type
- [x] Store storage path in `content` field
- [x] Validate file size (max 10MB - enforced in app, bucket allows 20MB)
- [x] Validate file type (PDF only)

### Frontend Implementation

#### 4.3 Upload Page - PDF Upload
- [x] Add "Select PDFs" button to upload page
- [x] Implement file input (accept .pdf, multiple files, max 10)
- [x] Validate file size (10MB max) and type
- [x] Show file list in pending resources
- [x] Implement direct upload to Supabase Storage:
  - Request presigned URL from backend
  - Upload file directly to Supabase
  - Show upload progress
- [x] In review step:
  - Pre-fill title from filename (remove .pdf extension)
  - Show file size
  - Allow editing title and description
- [x] Update resource cards to show FileText icon
- [x] Add "View" button to resource cards (opens PDF in dialog with react-pdf viewer)

#### 4.4 PDF Viewer Component
- [x] Install react-pdf and pdfjs-dist dependencies
- [x] Create PDFViewer component with react-pdf Document/Page
- [x] Add fetchPDFBlob helper function for authenticated PDF fetching
- [x] Implement loading and error states
- [x] Display PDF in dialog modal instead of new tab
- [x] Add component tests for PDFViewer

**Deliverable**: User can upload PDF files, they are stored in Supabase Storage, and users can view them in an embedded PDF viewer dialog from the resources page.

---

## Phase 5: AI-Powered Tagging (Gemini Integration)

### Goal
Automatically generate tags, descriptions, and metadata for resources using Google Gemini.

### Backend Implementation

#### 5.1 Gemini Integration
- [x] Install `google-genai` Python SDK (v1.53.0+)
- [x] Configure Gemini API client with API key
- [x] Create content extraction utilities:
  - [x] PDF content handling: Accepts PDF bytes via file upload or downloads from storage (uses Gemini's native PDF support)
  - [x] Webpage content extraction (using `httpx` + `beautifulsoup4`, limit 8000 chars)
  - [x] Note content (direct, limit 8000 chars)
- [x] Create `POST /api/resources/generate-tags` endpoint:
  - [x] Accepts multipart/form-data with:
    - `type`: Resource type ('pdf', 'link', or 'note')
    - `file`: PDF file upload (for PDFs)
    - `content`: Text content or storage path (for links/notes, or PDF fallback)
  - [x] Extract content based on type:
    - PDFs: Send PDF bytes directly to Gemini (uses native PDF support)
    - Links: Extract webpage content server-side
    - Notes: Use content directly
  - [x] Call Gemini API with oncology-focused prompt
  - [x] Return structured JSON:
    ```json
    {
      "tags": string[],
      "description": string,
      "condition": string,
      "audience": string,
      "topic": string
    }
    ```
  - [x] Handle errors gracefully (return error responses for frontend handling)

#### 5.2 Gemini Prompt Engineering
- [x] Design oncology-focused prompt
- [x] Use structured JSON output via JSON Schema (Pydantic model)
- [x] Specify tag count (5-8 tags, max 10)
- [x] Request patient-friendly descriptions (1-2 sentences)
- [x] Include examples of cancer types, treatments, side effects
- [x] Use `gemini-2.5-flash` model with structured outputs

### Frontend Implementation

#### 5.3 Auto-Fill Feature
- [x] Add "Auto-fill with AI" button to resource review cards
- [x] For single resources (note/link/single PDF):
  - [x] Show loading state ("Extracting...")
  - [x] Call `POST /api/resources/generate-tags` with File object (PDFs) or content (links/notes)
  - [x] Populate tags, description, topic fields
  - [x] Handle errors (show error message, keep existing data)
- [x] For multiple PDFs:
  - [x] Add "Auto-fill All" button to extract metadata for all PDFs in batch
  - [x] Add individual "Auto-fill with AI" button per PDF resource
  - [x] Track extraction state per PDF using Set of indices
  - [x] Show progress ("Extracting X of Y...")
- [x] Allow user to edit/remove auto-generated content
- [x] Disable buttons during extraction to prevent duplicate requests

**Deliverable**: User can click "Auto-fill with AI" during resource review to automatically generate tags and descriptions using AI. Supports both single resources and batch processing for multiple PDFs. ✅

---

## Phase 6: Packet Creation & Management

### Goal
Enable users to create named collections of resources ("packets") and manage them.

### Database Schema

```sql
-- Alembic migration: 002_create_packets_and_join_table
CREATE TABLE packets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) >= 1),
    description TEXT,
    share_link TEXT NOT NULL UNIQUE,  -- 10-char nanoid
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE packet_resources (
    packet_id UUID NOT NULL REFERENCES packets(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (packet_id, resource_id)
);

CREATE INDEX idx_packets_user_id ON packets(user_id);
CREATE INDEX idx_packets_share_link ON packets(share_link);
CREATE INDEX idx_packet_resources_packet_id ON packet_resources(packet_id);
CREATE INDEX idx_packet_resources_resource_id ON packet_resources(resource_id);
```

### Backend Implementation

#### 6.1 SQLAlchemy Models
- [ ] Create `Packet` model
- [ ] Create `PacketResource` join table model
- [ ] Define relationships (packet.resources, resource.packets)
- [ ] Add Pydantic schemas:
  - `PacketCreate`
  - `PacketUpdate`
  - `PacketResponse` (with resources array)

#### 6.2 API Endpoints
- [ ] `POST /api/packets` - Create packet
  - Generate 10-character nanoid for share_link
  - Validate at least one resource selected
  - Create packet and packet_resources entries
  - Return created packet with resources
- [ ] `GET /api/packets` - List user's packets
  - Include resource count
  - Sort by created_at DESC
- [ ] `GET /api/packets/:id` - Get single packet
  - Include full resource details
  - Validate ownership
- [ ] `PATCH /api/packets/:id` - Update packet
  - Allow updating name, description, resources
  - Validate ownership
- [ ] `DELETE /api/packets/:id` - Delete packet
  - Cascade delete packet_resources
  - Validate ownership

### Frontend Implementation

#### 6.3 Packet Builder UI
- [x] On Resources page, when resources selected:
  - Show fixed "Create Packet (X selected)" button
- [x] Create side sheet component:
  - Packet name input (required)
  - Description textarea (optional)
  - Selected resources list with remove buttons
  - "Create Packet" button
- [x] After packet creation:
  - Show success message
  - [ ] Display QR code overlay (placeholder for now) - Phase 7
  - [ ] Show shareable URL - Phase 7
  - [ ] "Done" button to dismiss - Phase 7

#### 6.4 Packets Page
- [x] Create `/packets` route
- [x] Build packet grid (responsive)
- [x] Display packet cards:
  - Packet name
  - Description
  - Resource count
  - Created date
  - Action buttons (Edit, Delete - Share coming next)
- [x] Add empty state
- [x] Add loading skeletons
- [x] Update bottom navigation (enable Packets tab)

#### 6.5 Edit Packet Dialog
- [x] Create edit dialog/modal
- [x] Show packet name and description inputs
- [x] Show resources list with checkboxes:
  - "Included in Packet" section (pre-checked)
  - "Available Resources" section (unchecked)
- [x] Save changes button
- [x] Cancel button

**Deliverable**: User can create packets from selected resources, view all packets, edit packet contents, and delete packets.

---

## Phase 7: Packet Sharing (QR Codes & Share Links)

### Goal
Enable users to generate shareable links and QR codes for packets.

### Backend Implementation

#### 7.1 Share Link Generation
- [ ] Ensure share_link is generated on packet creation (already done)
- [ ] Add endpoint: `GET /api/packets/shared/:shareLink`
  - Look up packet by share_link (no auth required)
  - Return packet with resources (public-safe data)
  - Return 404 if not found

### Frontend Implementation

#### 7.2 QR Code Generation
- [ ] Install `qrcode.react` package
- [ ] Create QRCodeSVG component wrapper
- [ ] Configure: 200x200px, error correction level H
- [ ] Generate QR for: `{origin}/shared/{shareLink}`

#### 7.3 Share UI Enhancements
- [ ] After packet creation: Show QR code overlay with:
  - Large QR code
  - Shareable URL input (read-only)
  - Copy link button (with checkmark animation)
  - Done button
- [ ] On Packets page:
  - Add "Show QR" button to each packet card
  - Add share link input + copy button
  - Show QR in modal when "Show QR" clicked
- [ ] Implement clipboard copy functionality
- [ ] Add toast notifications for copy success

**Deliverable**: User can generate QR codes and shareable links for packets, copy links to clipboard, and display QR codes for mobile scanning.

---

## Phase 8: Public Packet View

### Goal
Create patient-facing public view of shared packets (no authentication required).

### Backend Implementation

#### 8.1 Public Endpoints
- [ ] `GET /api/packets/shared/:shareLink` - Get packet by share link
  - No authentication required
  - Return packet metadata and resources
  - Exclude internal fields (user_id, etc.)
- [ ] `GET /api/packets/shared/:shareLink/resource/:resourceId` - Get resource metadata
  - Validate resource belongs to packet
  - Return public-safe resource data

### Frontend Implementation

#### 8.2 Shared Packet Page
- [ ] Create `/shared/:shareLink` route (public, no auth)
- [ ] Build public-facing layout:
  - No bottom navigation
  - Centered content with max width
  - Header with packet name, description, resource count
  - Resource cards (different from authenticated view)
- [ ] Resource card variations:
  - **PDF**: "Preview Document" button
  - **Link**: "Visit Link" button (opens in new tab)
  - **Note**: Content displayed inline in muted box
- [ ] Add footer disclaimer
- [ ] Handle loading state (skeleton)
- [ ] Handle not found state (404 message)

**Deliverable**: Patients can access shared packets via link/QR code, view packet contents, and see resource details without authentication.

---

## Phase 9: Document Viewer (Secure PDF Preview)

### Goal
Enable secure PDF viewing for shared packets without exposing storage URLs.

### Backend Implementation

#### 9.1 PDF Content Proxy
- [ ] Create `GET /api/packets/shared/:shareLink/resource/:resourceId/content` endpoint
  - Validate shareLink matches existing packet
  - Validate resourceId belongs to packet
  - Validate resource type is PDF
  - Fetch PDF from Supabase Storage
  - Stream PDF with headers:
    - `Content-Type: application/pdf`
    - `Content-Disposition: inline; filename="..."`
    - `Cache-Control: public, max-age=3600`
  - Return 403 if access denied, 404 if not found

### Frontend Implementation

#### 9.2 Document Viewer Page
- [ ] Create `/shared/:shareLink/view/:resourceId` route
- [ ] Build full-screen viewer:
  - Fixed header with:
    - Back button
    - Document title (truncated)
    - Download button
  - PDF iframe loading from content proxy endpoint
  - Loading overlay with spinner
- [ ] Implement download functionality:
  - Fetch blob from content API
  - Create temporary download link
  - Trigger download with proper filename
- [ ] Handle error states:
  - Access denied (403)
  - Not found (404)
  - Invalid document type
- [ ] Add sandbox attributes to iframe for security

**Deliverable**: Patients can securely view PDFs from shared packets without exposing storage URLs. PDFs can be downloaded.

---

## Phase 10: Share History Tracking

### Goal
Log packet sharing events and enable users to view and re-share from history.

### Database Schema

```sql
-- Alembic migration: 003_create_share_history_table
CREATE TABLE share_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    packet_id UUID NOT NULL REFERENCES packets(id) ON DELETE CASCADE,
    packet_name TEXT NOT NULL,  -- Denormalized for display
    share_method TEXT NOT NULL CHECK (share_method IN ('qr', 'link', 'print')),
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_share_history_user_id ON share_history(user_id);
CREATE INDEX idx_share_history_packet_id ON share_history(packet_id);
CREATE INDEX idx_share_history_shared_at ON share_history(shared_at DESC);
```

### Backend Implementation

#### 10.1 Share History Endpoints
- [ ] `POST /api/share` - Create share history entry
  - Accept packet_id and share_method
  - Denormalize packet_name for display
  - Create history entry
  - Return created entry
- [ ] `GET /api/history` - List user's share history
  - Filter by user_id
  - Sort by shared_at DESC
  - Return array of history entries

### Frontend Implementation

#### 10.2 Share Event Logging
- [ ] Log share events when:
  - QR code is displayed (share_method: 'qr')
  - Link is copied (share_method: 'link')
  - (Print method reserved for future)
- [ ] Call `POST /api/share` after share actions

#### 10.3 History Page
- [ ] Create `/history` route
- [ ] Build history list:
  - History entry cards showing:
    - Packet name
    - Share method badge (QR/Link/Print with icon)
    - Timestamp
    - "Share Again" button
- [ ] Add empty state
- [ ] Add loading skeletons
- [ ] Implement "Share Again" functionality:
  - Creates new history entry
  - Shows QR/share UI for that packet
- [ ] Add to bottom navigation (optional - PRD notes it's hidden)

**Deliverable**: System logs all packet sharing events. Users can view share history and re-share packets from history.

---

## Phase 11: Polish & Enhancement

### Goal
Improve UX, add missing features, and address edge cases.

### Tasks

#### 11.1 UX Improvements
- [ ] Add toast notifications for all user actions
- [ ] Improve loading states (skeletons, spinners)
- [ ] Add error boundaries (React)
- [ ] Improve empty states with helpful messaging
- [ ] Add form validation feedback
- [ ] Improve responsive design testing

#### 11.2 Resource Management Enhancements
- [ ] Add "View" button functionality for PDFs (opens in new tab)
- [ ] Improve resource card layout and spacing
- [ ] Add resource type filtering
- [ ] Add date range filtering (if needed)

#### 11.3 Packet Management Enhancements
- [ ] Improve packet card design
- [ ] Add packet search/filtering
- [ ] Improve edit dialog UX
- [ ] Add confirmation dialogs for destructive actions

#### 11.4 Security & Validation
- [ ] Add input sanitization (XSS protection)
- [ ] Add rate limiting to API endpoints
- [ ] Validate all user inputs on backend
- [ ] Add CORS configuration
- [ ] Review and secure all API endpoints

#### 11.5 Error Handling
- [ ] Improve error messages (user-friendly)
- [ ] Add retry logic for failed API calls
- [ ] Handle network errors gracefully
- [ ] Add 404 page (user-friendly, not developer message)

#### 11.6 Performance
- [ ] Optimize database queries (add indexes if needed)
- [ ] Implement pagination if resource count grows large
- [ ] Add caching where appropriate
- [ ] Optimize bundle size

---

## Phase 12: Deployment & Production Setup

### Goal
Deploy application to production environments.

### Tasks

#### 12.1 Backend Deployment (Fly.io)
- [ ] Create Dockerfile for FastAPI
- [ ] Configure fly.toml
- [ ] Set up environment secrets in Fly.io
- [ ] Deploy to Fly.io
- [ ] Configure domain (if needed)
- [ ] Test production API endpoints

#### 12.2 Frontend Deployment (Vercel)
- [ ] Configure Vercel project
- [ ] Set up environment variables
- [ ] Configure build settings
- [ ] Deploy to Vercel
- [ ] Configure custom domain (if needed)
- [ ] Test production frontend

#### 12.3 Supabase Production
- [ ] Set up production Supabase project
- [ ] Run migrations in production
- [ ] Configure production storage bucket
- [ ] Update connection strings
- [ ] Test production database

#### 12.4 Monitoring & Analytics
- [ ] Set up PostHog (frontend and backend)
- [ ] Configure error tracking
- [ ] Set up usage analytics
- [ ] Test monitoring in production

#### 12.5 Documentation
- [ ] Update README with setup instructions
- [ ] Document environment variables
- [ ] Document deployment process
- [ ] Add API documentation (FastAPI auto-generates)

---

## Implementation Checklist Summary

### Core Features
- [x] Phase 0: Foundation & Authentication ✅
  - [x] 0.1 Project Setup ✅
  - [x] 0.2 Supabase Setup ✅
  - [x] 0.3 Development Environment ✅
  - [x] 0.4 Authentication Foundation ✅ (includes automated tests)
- [x] Phase 1: Basic Resource Management (Notes) ✅ (backend + frontend complete, 37 tests passing)
- [x] Phase 2: Resource Search & Filtering ✅ (backend + frontend complete, search/filter with 18 new tests, resource selection)
- [x] Phase 3: Link Resources ✅ (backend + frontend complete, URL validation, link creation UI, 18 new tests, 70 tests passing total)
- [x] Phase 4: PDF Upload & Storage ✅ (backend + frontend complete, presigned URLs, direct upload, file serving, PDF resource creation)
- [x] Phase 5: AI-Powered Tagging ✅ (backend + frontend complete, Gemini integration with structured outputs, file upload support, batch processing)
- [ ] Phase 6: Packet Creation & Management
- [ ] Phase 7: Packet Sharing (QR & Links)
- [ ] Phase 8: Public Packet View
- [ ] Phase 9: Document Viewer
- [ ] Phase 10: Share History Tracking
- [ ] Phase 11: Polish & Enhancement
- [ ] Phase 12: Deployment & Production

---

## Notes

### Vertical Development Benefits
- Each phase delivers working functionality
- Early feedback on user flows
- Easier debugging (smaller scope)
- Can demo progress incrementally

### Dependencies Between Phases
- Phases 1-4 build resource management incrementally
- Phase 5 depends on all resource types (notes, links, PDFs)
- Phase 6 depends on resource management being complete
- Phases 7-9 build sharing features incrementally
- Phase 10 depends on sharing being implemented

### Testing Strategy
- Test each phase end-to-end before moving to next
- **Automated tests**: Add tests for critical features as you build them
  - Backend: Use pytest for API endpoint tests (pytest, pytest-asyncio, pytest-mock)
  - Frontend: Use vitest + @testing-library/react for component tests
  - Integration: Test complete user flows end-to-end
  - ✅ Phase 0: Automated test infrastructure implemented (pytest + vitest configured)
- Manual testing of user flows
- API testing with tools like Postman/Insomnia
- Frontend testing in browser
- Consider adding automated tests for new features in each phase (optional but recommended)

### Future Considerations
- Resource file replacement (currently not supported)
- Resource reordering in packets
- Packet expiration
- Bulk operations
- Analytics on packet views
- Print functionality for packets

---

*This plan follows the functionality described in the PRD and uses the tech stack specified in tech-stack.md. Implementation details should follow official documentation for each technology.*

