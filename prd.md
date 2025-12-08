# Product Requirements Document: Nurse Resource Binder

> **Product Name**: Nurse Resource Binder (TBD – final name can change)  
> **Document Purpose**: Describes the current implementation for rebuilding with a new tech stack  
> **Future Stack Assumptions**: Supabase (Postgres + auth + storage), strongly-typed OOP languages, Railway deployment

---

## 1. Product Overview

### 1.1 Short Summary

Nurse Resource Binder is a web application that enables oncology nurses to maintain an online repository of patient-facing educational resources (PDFs, external links, and typed notes), automatically tag and describe each resource using AI, search and filter resources quickly, and assemble shareable "packets" of selected resources that can be distributed to patients via QR codes or direct links.

### 1.2 Problem Statement

Oncology nurses frequently need to provide patients with educational materials about their conditions, treatments, and care management. Managing, organizing, and distributing these resources across multiple patients with different needs is time-consuming. Nurses need a streamlined way to:

- Upload and organize various resource types (documents, links, notes)
- Quickly find relevant resources through intelligent tagging
- Bundle resources into patient-specific collections
- Share collections easily in clinical settings (via QR codes for quick mobile access)

### 1.3 Target User

**Primary User**: Oncology nurses who provide patient education materials

Single user role with full access to all features. No separate admin/moderator roles exist in the current implementation.

---

## 2. Goals and Non-Goals

### 2.1 Goals (Current Functionality)

1. **Resource Management**
   - Upload PDF files (up to 10MB, max 10 files per batch)
   - Add external links (URLs)
   - Create typed notes
   - Edit resource metadata (title, description, tags)
   - Delete resources

2. **AI-Powered Organization**
   - Auto-generate tags from resource content using OpenAI
   - Auto-generate patient-friendly descriptions
   - Extract text from PDFs for analysis
   - Fetch and analyze webpage content for links
   - Categorize by condition, audience, and topic

3. **Packet Creation and Management**
   - Create named collections of resources ("packets")
   - Add/remove resources from packets
   - Edit packet name and description
   - Delete packets
   - View packet contents

4. **Sharing**
   - Generate unique shareable links for each packet
   - Display QR codes for easy mobile scanning
   - Copy share links to clipboard
   - Public patient-facing view (no authentication required)
   - Secure PDF viewing through content proxy

5. **History Tracking**
   - Log packet sharing events
   - Track share method (QR, link, print)
   - Re-share from history

### 2.2 Non-Goals (Not in Current Implementation)

- User authentication or login system
- Multiple user accounts or team collaboration
- Role-based access control
- Resource file replacement (uploaded PDF files cannot be replaced; only metadata can be edited via PATCH endpoint)
- Packet expiration or access controls
- Analytics or usage tracking
- Print functionality (share method exists in data model but no UI to trigger print)
- Resource reordering within packets
- Bulk resource deletion
- Resource categories/folders beyond tags
- Offline access
- Mobile native apps
- History page navigation (page exists but is not discoverable via bottom nav)

---

## 3. User Roles and Permissions

### 3.1 Nurse User (Single Role)

The current implementation has a single implicit user role with the following capabilities:

| Capability | Access |
|------------|--------|
| Upload resources | Yes |
| View all resources | Yes |
| Edit resource metadata | Yes |
| Delete resources | Yes |
| Create packets | Yes |
| Edit packets | Yes |
| Delete packets | Yes |
| Share packets (QR/link) | Yes |
| View share history | Yes |

### 3.2 Public Viewer (Unauthenticated)

Patients or anyone with a share link can:

| Capability | Access |
|------------|--------|
| View shared packet | Yes |
| View resource titles and descriptions | Yes |
| View resource tags | Yes |
| Open external links | Yes |
| View PDF documents (via secure proxy) | Yes |
| Download PDF documents | Yes |
| Read note content | Yes |
| Access other packets | No |
| See resource IDs or internal paths | No (for PDFs) |

---

## 4. Core Use Cases and User Flows

### 4.1 Upload New Resources

**Entry Point**: Bottom navigation → "Upload"

**Flow**:
1. User navigates to Upload page
2. User can add resources via three methods:
   - **PDF Upload**: Click "Select PDFs" → Choose up to 10 PDF files (max 10MB each)
   - **External Link**: Enter URL → Click "Add Link"
   - **Typed Note**: Enter text → Click "Add Note"
3. Resources accumulate in a pending list
4. User clicks "Review & Upload" to proceed to review step
5. In review step, user can:
   - Edit title for each resource
   - Edit description (optional)
   - Click "Auto-fill" to generate AI tags and description
   - Manually add custom tags (press Enter to add)
   - Remove individual tags
   - Remove resources from batch
6. User clicks "Confirm and Save" to finalize
7. Success screen shows count of uploaded resources
8. User can "Upload More" or "View Resources"

### 4.2 Auto-Tag and Describe Resources via AI

**Trigger**: User clicks "Auto-fill" button on a resource during review

**Flow**:
1. Loading spinner appears on button
2. Backend extracts content:
   - **PDF**: Extracts text using pdf-parse library (up to 8000 chars)
   - **Link**: Fetches webpage and extracts text using cheerio (up to 8000 chars)
   - **Note**: Uses note text directly (up to 8000 chars)
3. OpenAI GPT-4o-mini analyzes content with oncology-focused prompt
4. Returns:
   - Patient-friendly description (1-2 sentences)
   - 5-8 relevant tags
   - Primary cancer condition
   - Target audience (Patient/Caregiver/Both)
   - Main topic category
5. Tags and description auto-populate in the form
6. User can manually edit or remove any auto-generated content

### 4.3 Search and Browse Resources

**Entry Point**: Bottom navigation → "Home" (Resources page)

**Flow**:
1. Resources display in a responsive grid (1/2/3 columns based on viewport)
2. Search input at top searches across:
   - Resource title
   - Resource description
   - Resource tags
3. Search is client-side filtering (all resources loaded)
4. Each resource card shows:
   - Title
   - Type icon (PDF/Link/Note)
   - Description (2 line clamp)
   - Tags (first 3 + count of additional)
   - Created date
   - Checkbox for selection
   - View/Visit button (for PDFs and links)
5. Clicking anywhere on card toggles selection
6. Selected cards show primary ring highlight

### 4.4 Build a Packet from Resources

**Entry Point**: Resources page → Select resources → "Create Packet" button

**Flow**:
1. User selects one or more resources by clicking cards or checkboxes
2. Fixed button appears at bottom: "Create Packet (X selected)"
3. User clicks button to open side sheet
4. User enters:
   - Packet name (required)
   - Description (optional)
5. Selected resources displayed with ability to remove
6. User clicks "Create Packet"
7. QR code overlay appears with:
   - Success message
   - Large QR code
   - Shareable URL input
   - Copy link button
8. User clicks "Done" to dismiss

### 4.5 Share a Packet via QR and Public Link

**Entry Points**:
- Resources page: After creating packet (automatic QR display)
- Packets page: Click "Show QR" or copy link button

**Share URL Format**: `{origin}/shared/{shareLink}`

Where `shareLink` is a 10-character nanoid string (e.g., `V1StGXR8_Z`)

**QR Code Generation**:
- Uses `qrcode.react` library (QRCodeSVG component)
- Size: 200x200 pixels
- Error correction level: H (high)

### 4.6 View a Shared Packet as a Patient

**Entry Point**: Scanning QR code or opening share link

**Flow**:
1. Patient accesses `/shared/{shareLink}`
2. Page loads packet metadata and resources
3. Displays:
   - Packet name (large heading)
   - Packet description
   - Resource count badge
   - Creation date
4. Resource cards show:
   - Type icon
   - Title
   - Description
   - Tags
   - Action button based on type
5. **For PDFs**: "Preview Document" button → Opens document viewer
6. **For Links**: "Visit Link" button → Opens URL in new tab
7. **For Notes**: Content displayed inline in muted box
8. Footer disclaimer: "This resource packet was shared by your healthcare provider. If you have questions, please contact your care team."

### 4.7 Review History

**Entry Point**: Not currently in navigation (route exists at implicit path)

**Current Implementation**: History page exists but is not accessible via the bottom navigation. The route functionality is implemented.

**Flow** (if accessed directly):
1. Displays list of share events
2. Each entry shows:
   - Packet name
   - Share method badge (QR/Link/Print)
   - Timestamp
   - "Share Again" button
3. Share Again creates a new history entry

---

## 5. Screen-by-Screen Requirements

### 5.1 Resources Page (`/`)

**Purpose**: Main resource library view for browsing, searching, and selecting resources to build packets.

**Entry Points**:
- App launch (default route)
- Bottom nav "Home" button
- "View Resources" button after upload

**Layout**:
- Header with page title and description
- Search input with search icon
- Responsive grid of resource cards (1 col mobile, 2 col tablet, 3 col desktop)
- Fixed "Create Packet" button when resources selected
- Bottom navigation bar

**States**:

| State | Behavior |
|-------|----------|
| Loading | 6 skeleton cards in grid |
| Empty (no resources) | Centered icon, message, "Upload Resources" button |
| Empty (search, no results) | Same empty state with "Try adjusting your search" message |
| Normal | Grid of resource cards |
| Selection active | Selected cards highlighted with ring, Create Packet button visible |

**Resource Card Content**:
- Title (2 line clamp)
- Type icon (FileText for PDF, Link icon for links, StickyNote for notes)
- Checkbox (top right)
- Description (2 line clamp, if exists)
- Tags (up to 3 visible + overflow count)
- Created date (bottom left)
- View/Visit button (bottom right, for PDFs and links only)

**User Actions**:
| Action | Outcome |
|--------|---------|
| Type in search | Client-side filter resources |
| Click card | Toggle selection |
| Click checkbox | Toggle selection |
| Click View (PDF) | Open PDF URL in new tab |
| Click Visit (Link) | Open link URL in new tab |
| Click Create Packet | Open packet builder sheet |

**Packet Builder Sheet**:
- Slides in from right
- Width: 540px (sm), 640px (md), 720px (lg)
- Fields:
  - Packet Name (required text input)
  - Description (optional textarea)
  - Selected Resources list with remove buttons
- Create Packet button (disabled until name provided and resources selected)

**QR Code Overlay** (after packet creation):
- Full screen overlay
- Close button (top right)
- "Packet Created!" heading
- "Share this QR code with your patient" description
- QR code in white container
- Share URL input (read-only)
- Copy button with check animation
- Done button

### 5.2 Upload Page (`/upload`)

**Purpose**: Add new resources to the library (PDFs, links, or notes).

**Entry Points**:
- Bottom nav "Upload" button
- "Upload Resources" button from empty resources state

**Layout**:
- Header with page title and description
- Three input cards stacked vertically:
  1. File upload card
  2. Link input card
  3. Note input card
- Pending resources summary bar (when resources added)

**Step 1: Upload (Initial)**

| Card | Content |
|------|---------|
| Upload File | "Select PDFs" button, file type/size limits description |
| Add External Link | URL input, "Add Link" button |
| Type a Note | Textarea (4 rows), "Add Note" button |

**Pending Resources Bar**:
- Shows count of pending resources
- "Ready for review" subtext
- "Review & Upload" button

**Step 2: Review**

**Layout**:
- Header: "Review Uploads" with cancel button
- Subheader: count of resources
- Stacked resource cards
- "Add More Resources" and "Confirm and Save" buttons

**Resource Review Card**:
- Type icon + Title input
- Description input
- Tags displayed as badges with remove buttons
- "Auto-fill" button (triggers AI)
- Custom tag input (Enter to add)
- Remove resource button (X)

**States**:
| State | Behavior |
|-------|----------|
| Generating tags | Spinner on Auto-fill button, "Generating..." text |
| Tags generated | Tags appear as badges |
| Upload pending | Spinner on confirm button, disabled interactions |

**Step 3: Confirm**

**Layout**:
- Centered card
- Success icon (checkmark in circle)
- "X Files Uploaded Successfully" heading
- "Your resources have been added to the library" subtext
- "Upload More" and "View Resources" buttons

**Validations**:
- PDF files only (.pdf, application/pdf)
- Max file size: 10MB per file
- Max files: 10 per batch
- Link URL must be valid URL format
- Note text required before adding

### 5.3 Packets Page (`/packets`)

**Purpose**: View and manage all created packets.

**Entry Points**:
- Bottom nav "Packets" button
- Not linked from other pages directly

**Layout**:
- Header with page title and description
- Responsive grid of packet cards (1/2/3 columns)

**States**:
| State | Behavior |
|-------|----------|
| Loading | 6 skeleton cards |
| Empty | Centered icon, "No packets created yet", "Create Packet" button linking to home |
| Normal | Grid of packet cards |

**Packet Card Content**:
- Packet name (2 line clamp)
- Description (2 line clamp, if exists)
- Resource count
- Created date
- Action buttons:
  - Show QR / Hide QR toggle
  - Share link input + copy button
  - View Packet (links to shared view)
  - Edit button
  - Delete button (destructive variant)

**QR Modal** (when Show QR clicked):
- Dark overlay
- Centered card with:
  - "Share QR Code" title
  - Close button
  - QR code (200x200)
  - Description text

**Edit Dialog**:
- Modal dialog
- Fields:
  - Packet Name (required)
  - Description (optional)
  - Resources selection with checkboxes
- Resources grouped by:
  - "Included in Packet" (originally selected)
  - "Available Resources" (others)
- Cancel and Save Changes buttons

**Delete Confirmation**:
- Browser confirm() dialog
- "Are you sure you want to delete this packet?"

### 5.4 Shared Packet Page (`/shared/:shareLink`)

**Purpose**: Public patient-facing view of a shared packet.

**Entry Points**:
- QR code scan
- Direct URL access
- "View Packet" button from Packets page

**Layout**:
- Full screen (no bottom nav)
- Centered content with max width
- Header section with packet info
- Stacked resource cards
- Footer disclaimer

**URL Parameters**:
- `shareLink`: 10-character nanoid string

**States**:
| State | Behavior |
|-------|----------|
| Loading | Skeleton header and 3 skeleton cards |
| Not found | Centered "Packet not found" message |
| Normal | Packet info and resource list |

**Header Content**:
- Packet name (large, responsive sizing)
- Description (if exists)
- Resource count badge
- "Shared on {date}" timestamp

**Resource Card Variations**:

| Type | Display | Action |
|------|---------|--------|
| PDF | Icon, title, description, tags | "Preview Document" button → Opens document viewer |
| Link | Icon, title, description, tags | "Visit Link" button → Opens in new tab |
| Note | Icon, title, description, tags | Content displayed inline in muted box |

**Security**:
- PDF content URLs not exposed (proxied through API)
- Resource IDs visible for navigation but content secured
- Links and notes content visible directly

**Footer**:
- Border-top separator
- Centered text: "This resource packet was shared by your healthcare provider. If you have questions, please contact your care team."

### 5.5 Document Viewer Page (`/shared/:shareLink/view/:resourceId`)

**Purpose**: Secure PDF preview for shared packet resources.

**Entry Points**:
- "Preview Document" button on shared packet page
- Card click on PDF resource in shared packet

**Layout**:
- Full screen (no navigation)
- Fixed header with back button, title, download button
- PDF rendered in iframe

**URL Parameters**:
- `shareLink`: Packet share link (validates access)
- `resourceId`: Resource ID (validates membership in packet)

**States**:
| State | Behavior |
|-------|----------|
| Loading | Skeleton header, loading spinner centered |
| Error (access denied) | "Access Denied" + explanation + back button |
| Error (not found) | "Document Not Found" + back button |
| Error (wrong type) | "Invalid document type" + back button |
| Normal | Header + PDF iframe |

**Header Content**:
- Back button (arrow icon)
- Document title (truncated)
- Download button

**PDF Rendering**:
- Iframe loading PDF from `/api/packets/shared/:shareLink/resource/:resourceId/content`
- Loading overlay with spinner while iframe loads
- Sandbox attributes: allow-same-origin, allow-scripts, allow-downloads

**Security Flow**:
1. Validate shareLink matches existing packet
2. Validate resourceId is member of packet
3. Validate resource type is PDF
4. Proxy PDF content through API (never expose storage URL)

**Download**:
- Fetches blob from content API
- Creates temporary download link
- Filename: resource title (adds .pdf if not present)
- Fallback: opens content URL in new tab

### 5.6 History Page (`/history` - Hidden Route)

**Purpose**: View log of packet sharing events and re-share.

**Discoverability Issue**: This page is fully implemented but NOT accessible from the bottom navigation (which only shows Home, Upload, Packets). Users can only access it by manually navigating to `/history`. The share history functionality works (events are logged when packets are shared), but the viewing interface is hidden.

**Entry Points**:
- Direct URL access only (`/history`)
- Not linked from any other page in the application

**Layout**:
- Header with page title and description
- Stacked history entry cards

**States**:
| State | Behavior |
|-------|----------|
| Loading | 5 skeleton cards |
| Empty | Centered icon, "No share history yet", "Create Packet" button |
| Normal | List of history cards |

**History Card Content**:
- Packet name
- Share method badge (QR/LINK/PRINT with icon)
- Timestamp with history icon
- "Share Again" button

**Share Methods**:
| Method | Badge Variant | Icon |
|--------|--------------|------|
| qr | default | QrCode |
| link | secondary | Link |
| print | outline | Printer |

**Share Again Action**:
- Creates new share history entry
- Invalidates history query cache
- Shows toast confirmation

### 5.7 Not Found Page (`/*` - catch-all)

**Purpose**: Handle invalid routes.

**Display**:
- Centered card with:
  - Alert circle icon (red)
  - "404 Page Not Found" heading
  - "Did you forget to add the page to the router?" message

**Note**: This appears to be a developer-facing message. For production, should be updated to user-friendly copy with navigation options.

---

## 6. Data Model (Conceptual)

### 6.1 Entities

#### Resources

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | Primary key, auto-generated | |
| title | Text | Required, min 1 char | User-editable |
| description | Text | Optional, nullable | AI-generated or user-provided |
| type | Enum | Required, one of: 'pdf', 'link', 'note' | |
| content | Text | Required | PDF: object storage path, Link: URL, Note: text content |
| tags | Text[] | Default empty array | Searchable |
| autoTagged | Boolean | Default false | True if AI generated tags |
| condition | Text | Optional, nullable | AI-derived cancer type |
| audience | Text | Optional, nullable | AI-derived: Patient/Caregiver/Both |
| topic | Text | Optional, nullable | AI-derived main topic |
| createdAt | Timestamp | Auto-generated | Sorted descending by default |

**Indexes needed**:
- Primary key on `id`
- Consider full-text search on `title`, `description`, `tags`

#### Packets

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | Primary key, auto-generated | |
| name | Text | Required, min 1 char | |
| description | Text | Optional, nullable | |
| resourceIds | Text[] | Required, min 1 element | Array of resource IDs |
| shareLink | Text | Required, unique, auto-generated | 10-char nanoid |
| createdAt | Timestamp | Auto-generated | Sorted descending by default |

**Indexes needed**:
- Primary key on `id`
- Unique index on `shareLink` (for public access lookups)

#### Share History

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | Primary key, auto-generated | |
| packetId | UUID | Required, foreign key to packets | |
| packetName | Text | Required | Denormalized for display |
| shareMethod | Enum | Required, one of: 'qr', 'link', 'print' | |
| sharedAt | Timestamp | Auto-generated | Sorted descending by default |

**Indexes needed**:
- Primary key on `id`
- Index on `packetId` for filtering

### 6.2 Relationships

```
┌──────────────────┐
│     Packets      │
├──────────────────┤
│ id (PK)          │
│ resourceIds[]────┼──────┐
│ shareLink        │      │
└──────────────────┘      │
         │                │
         │ 1:N            │ M:N (via array)
         ▼                ▼
┌──────────────────┐    ┌──────────────────┐
│  Share History   │    │    Resources     │
├──────────────────┤    ├──────────────────┤
│ id (PK)          │    │ id (PK)          │
│ packetId (FK)────┼────│ title            │
│ packetName       │    │ content          │
│ shareMethod      │    │ tags[]           │
└──────────────────┘    └──────────────────┘
```

**Note on resourceIds Array**:
Current implementation stores resource IDs as an array within the packets table. For a relational database like Supabase, consider a join table:

```sql
-- Alternative: packet_resources join table
CREATE TABLE packet_resources (
  packet_id UUID REFERENCES packets(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  position INTEGER, -- for ordering
  PRIMARY KEY (packet_id, resource_id)
);
```

### 6.3 Searchable/Filterable Fields

| Entity | Field | Search Type |
|--------|-------|-------------|
| Resources | title | Text search |
| Resources | description | Text search |
| Resources | tags | Array contains |
| Resources | type | Exact match filter |
| Resources | createdAt | Date range |
| Packets | name | Text search |
| Packets | shareLink | Exact match |
| Share History | shareMethod | Exact match filter |
| Share History | sharedAt | Date range |

---

## 7. External Integrations

### 7.1 OpenAI API

**Purpose**: Auto-generate tags and descriptions for resources

**Model**: `gpt-4o-mini`

**Configuration**:
- Response format: JSON object
- Max completion tokens: 500
- Requires `OPENAI_API_KEY` environment variable

**Input Processing**:
| Resource Type | Content Extraction |
|--------------|-------------------|
| PDF | Text extracted via pdf-parse library, truncated to 8000 chars |
| Link | HTML fetched, parsed with cheerio, text extracted, truncated to 8000 chars |
| Note | Direct content, truncated to 8000 chars |

**Prompt Focus** (oncology-specific):
- Cancer types (Breast Cancer, Lung Cancer, etc.)
- Treatment topics (Chemotherapy, Radiation, Surgery)
- Side effect management (Nausea, Fatigue, Pain Management)
- Support topics (Emotional Support, Nutrition, Exercise)
- Audience classification (Patient, Caregiver, Both)

**Output**:
```typescript
{
  tags: string[];           // 5-8 relevant tags
  description?: string;     // 1-2 sentence patient-friendly description
  condition?: string;       // Primary cancer type
  audience?: string;        // Patient/Caregiver/Both
  topic?: string;           // Main topic category
}
```

**Error Handling**:
- On failure, returns minimal fallback: `{ tags: ["PDF Document" | "External Resource" | "Note"] }`
- Errors logged to console
- User shown toast notification of failure

### 7.2 QR Code Generation

**Library**: `qrcode.react` (QRCodeSVG component)

**Configuration**:
- Size: 200x200 pixels
- Error correction level: H (highest, ~30% recovery)
- Value: Full share URL (`{origin}/shared/{shareLink}`)

**Usage Locations**:
- Resources page (after packet creation)
- Packets page (Show QR button)

### 7.3 Object Storage (File Uploads)

**Provider**: Google Cloud Storage (via Replit sidecar)

**Configuration**:
- Sidecar endpoint: `http://127.0.0.1:1106`
- Environment variables required:
  - `PUBLIC_OBJECT_SEARCH_PATHS`: Comma-separated paths for public objects
  - `PRIVATE_OBJECT_DIR`: Directory for private uploads

**Upload Flow**:
1. Client requests presigned URL via `POST /api/objects/upload`
2. Server generates UUID for object
3. Server requests signed PUT URL from sidecar (15-minute TTL)
4. Client uploads directly to signed URL using Uppy + AWS S3 plugin
5. Object stored at: `{PRIVATE_OBJECT_DIR}/uploads/{uuid}`
6. Resource content field stores: `/objects/uploads/{uuid}`

**Download Flow**:
1. Request to `/objects/{path}`
2. Server retrieves file from storage
3. Streams content with appropriate Content-Type header
4. Cache-Control header set (public/private based on ACL)

**PDF Proxy for Shared Packets**:
1. Request to `/api/packets/shared/:shareLink/resource/:resourceId/content`
2. Validate packet exists
3. Validate resource belongs to packet
4. Fetch PDF from storage
5. Set headers: Content-Type, Content-Disposition (inline), Cache-Control
6. Stream buffer to client

---

## 8. Non-Functional Requirements (As Implemented)

### 8.1 Performance

| Aspect | Implementation |
|--------|---------------|
| Resource loading | All resources fetched at once, client-side filtering |
| Search debouncing | None (immediate filter on keystroke) |
| Pagination | Not implemented |
| Image/PDF lazy loading | Not implemented |
| Caching | TanStack Query default caching (stale-while-revalidate) |
| PDF text extraction | Limited to 8000 characters |
| Webpage fetch | 15-second timeout |

### 8.2 UX Quality and Feedback

**Loading States**:
| Location | Implementation |
|----------|---------------|
| Resource grid | Skeleton cards (6 placeholders) |
| Packet grid | Skeleton cards (6 placeholders) |
| History list | Skeleton cards (5 placeholders) |
| Shared packet | Skeleton header + cards |
| Document viewer | Skeleton header + loading spinner |
| Form submissions | Button shows spinner + disabled state |

**Toast Notifications**:
| Event | Type | Message Pattern |
|-------|------|-----------------|
| Upload start | Info | "Uploading..." |
| Files added | Success | "X file(s) ready for review" |
| Upload failed | Destructive | Error description |
| Tags generated | Success | "Added X tag(s)" or "Added X tag(s) and description" |
| Tag generation failed | Destructive | Error message |
| Resource added (link/note) | Success | "Link/Note added" |
| Packet created | (No toast, shows QR instead) | |
| Packet updated | Success | "Your changes have been saved" |
| Packet deleted | Success | "The packet has been removed" |
| Link copied | (Visual checkmark, no toast) | |
| Share again | Success | "A new share record has been created" |

**Form Validation**:
- Required fields show validation messages
- Disabled submit buttons until valid
- Inline validation feedback

**Empty States**:
All major lists have empty state designs with:
- Relevant icon
- Explanatory heading
- Action button to resolve

### 8.3 Reliability and Error Handling

**API Error Handling**:
```typescript
// Pattern used throughout
try {
  const response = await apiRequest(...);
  return await response.json();
} catch (error) {
  console.error("Error description:", error);
  toast({
    title: "Operation failed",
    description: "Please try again.",
    variant: "destructive",
  });
}
```

**Specific Error Cases**:
| Scenario | Handling |
|----------|----------|
| Resource not found | 404 response, "Resource not found" message |
| Packet not found | 404 response, dedicated not-found UI |
| Resource not in packet | 403 response, "Access Denied" UI |
| PDF fetch failure | 500 response, error logged |
| OpenAI API failure | Fallback tags returned |
| File upload failure | Toast with error message |
| Webpage fetch timeout | Error after 15 seconds |

**No Error Boundaries**: Current implementation does not use React error boundaries.

### 8.4 Accessibility

**Implemented**:
- Semantic HTML elements
- ARIA labels via data-testid attributes
- Keyboard navigation (forms, buttons)
- Focus management in dialogs/sheets
- Color contrast via Tailwind/shadcn defaults

**Not explicitly tested/implemented**:
- Screen reader optimization
- Skip links
- ARIA live regions for dynamic content

### 8.5 Responsive Design

**Breakpoints** (Tailwind defaults):
- Mobile: default
- Tablet (md): 768px
- Desktop (xl): 1280px

**Responsive Elements**:
| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Resource grid | 1 column | 2 columns | 3 columns |
| Packet grid | 1 column | 2 columns | 3 columns |
| Page padding | 16px | 24px | 24px |
| Headings | Smaller | Larger | Larger |
| Packet builder sheet | Full width | 540px | 720px |

**Mobile-First Features**:
- Fixed bottom navigation
- Safe area padding for notched devices
- Touch-friendly tap targets
- Full-screen QR display

---

## 9. Risks and Open Questions

### 9.1 Ambiguous Behaviors

1. **History Page Navigation**: The history page exists at `/history` but is not accessible from the bottom navigation. The share history is being recorded but users cannot view it without knowing the direct URL.

2. **Print Share Method**: The share method enum includes "print" but there is no print functionality implemented. History shows print entries but they cannot be created through the UI.

3. **Resource Deletion Impact**: When a resource is deleted, packets containing that resource are not updated. This could lead to packets referencing non-existent resources.

4. **Packet Update on Resource Delete**: No cascade or notification when resources in a packet are removed.

### 9.2 Missing Functionality

1. **No Authentication**: Any user can access the nurse interface. No user isolation or data protection.

2. **No Resource File Replacement**: Resource metadata (title, description, tags) can be edited via PATCH endpoint, but the underlying file/content cannot be replaced. Users must delete and re-upload to change the actual PDF/link/note content. Note: The UI does not expose the PATCH endpoint for resources - it's only available via API.

3. **No Resource Reordering in Packets**: Resources appear in packets in the order they were selected, with no ability to reorder.

4. **No Packet Expiration**: Share links never expire and cannot be revoked.

5. **No Bulk Operations**: Cannot select multiple resources for deletion or bulk tagging.

### 9.3 Technical Debt / TODOs

1. **404 Page Message**: "Did you forget to add the page to the router?" is developer-facing, not user-facing.

2. **In-Memory Storage**: Current implementation uses in-memory storage that resets on server restart. Migration to persistent database required.

3. **No Input Sanitization**: Content from notes and descriptions not sanitized before display (XSS risk).

4. **PDF Text Extraction**: Some PDFs (image-based, encrypted) may fail text extraction silently.

5. **No Rate Limiting**: OpenAI API calls and file uploads have no rate limiting.

### 9.4 Open Questions for Rebuild

1. Should there be user authentication? If so, what auth provider?

2. Should packets have expiration dates or access controls?

3. Should resources support versioning or editing after creation?

4. Should there be categories or folders in addition to tags?

5. Should the history page be added to navigation, or is it deprecated?

6. Should there be a print functionality for packets (PDF export)?

7. Should resource ordering within packets be supported?

8. What happens to packets when a contained resource is deleted?

9. Should there be analytics on packet views by patients?

10. Should there be a way to regenerate/change a packet's share link?

---
## Technical Constraints

**Performance:**
- API responses < 500ms for CRUD
- Page load < 2s
- Support 100 concurrent users

**Security:**
- All routes require authentication (except /shared/*)
- Input validation on all forms
- SQL injection protection via ORM

**Browser Support:**
- Modern browsers only (Chrome, Firefox, Safari, Edge)
- Mobile responsive (iOS Safari, Android Chrome)

## Appendix A: API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/resources | List all resources |
| GET | /api/resources/:id | Get single resource |
| POST | /api/resources | Create resource |
| PATCH | /api/resources/:id | Update resource |
| DELETE | /api/resources/:id | Delete resource |
| POST | /api/resources/generate-tags | AI tag generation |
| GET | /api/packets | List all packets |
| GET | /api/packets/:id | Get single packet |
| GET | /api/packets/shared/:shareLink | Get packet by share link |
| GET | /api/packets/shared/resources/:shareLink | Get safe resources for shared packet |
| GET | /api/packets/shared/:shareLink/resource/:resourceId | Get resource metadata from shared packet |
| GET | /api/packets/shared/:shareLink/resource/:resourceId/content | Stream PDF content |
| POST | /api/packets | Create packet |
| PATCH | /api/packets/:id | Update packet |
| DELETE | /api/packets/:id | Delete packet |
| GET | /api/history | List share history |
| POST | /api/share | Create share record |
| POST | /api/objects/upload | Get presigned upload URL |
| GET | /objects/:objectPath | Serve uploaded objects |

---

## Appendix B: File Structure

```
├── client/
│   └── src/
│       ├── pages/
│       │   ├── resources.tsx      # Home/Resources page
│       │   ├── upload.tsx         # Upload page
│       │   ├── packets.tsx        # Packets management
│       │   ├── shared-packet.tsx  # Public packet view
│       │   ├── document-viewer.tsx # PDF viewer
│       │   ├── history.tsx        # Share history (hidden)
│       │   └── not-found.tsx      # 404 page
│       ├── components/
│       │   ├── bottom-nav.tsx     # Navigation bar
│       │   └── ui/                # shadcn components
│       ├── hooks/
│       │   └── use-toast.ts       # Toast notifications
│       ├── lib/
│       │   └── queryClient.ts     # TanStack Query setup
│       └── App.tsx                # Router configuration
├── server/
│   ├── routes.ts                  # API endpoints
│   ├── storage.ts                 # Data storage interface
│   ├── openai.ts                  # AI integration
│   ├── objectStorage.ts           # File storage
│   └── objectAcl.ts               # Access control
└── shared/
    └── schema.ts                  # Data models & validation
```

---

## Appendix C: Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| OPENAI_API_KEY | Yes | OpenAI API authentication |
| PUBLIC_OBJECT_SEARCH_PATHS | Yes* | Object storage public paths |
| PRIVATE_OBJECT_DIR | Yes* | Object storage private directory |

*Required when using object storage features

---

*Document generated from codebase analysis. Last updated based on current implementation state.*
