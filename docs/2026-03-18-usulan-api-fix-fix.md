# Admin Kelola Usulan API Fix

## Issues Fixed

1. **Fixed 500 Internal Server Error in `/api/admin/usulan`**
   - Added improved error handling with more detailed error information
   - Fixed parameter handling for filters (status, search, wilayah, periode)
   - Added better logging for API requests
   - **[NEW] Fixed Prisma query error: Removed non-existent `wilayahId` field from User model selection**

2. **Fixed Timeline API Issue**
   - Ran the VS Code task to apply the fix for the timeline/jadwal API route

3. **Added Diagnostics Endpoint**
   - Created a new debugging endpoint at `/api/admin/usulan/debug` to help diagnose issues
   - Provides information about authentication, request parameters, and database connection

4. **Frontend Improvements**
   - Enhanced error reporting in the frontend to display more helpful error messages
   - Improved handling of search queries by trimming whitespace
   - Better logging of API request parameters

## Recent Fix Details (wilayahId Error)

The API route at `/api/admin/usulan` was returning a 500 Internal Server Error because the Prisma query was trying to select a non-existent field `wilayahId` from the `User` model.

### Analysis
1. The error was identified in the `app/api/admin/usulan/route.ts` file.
2. Looking at the Prisma schema, we found that the `User` model doesn't have a `wilayahId` field.
3. Instead, wilayah information should be accessed through the `unitKerja.wilayah` relationship.

### Fix Applied
1. Removed the `wilayahId` field from the `select` statement in the Prisma query.
2. The wilayah filter still works correctly because it's using `unitKerja.wilayah` for filtering.

## New Enhancement: Complete Data Display

### New Requirements
1. Display more complete data in the admin/usulan API:
   - Name, NIP, unit kerja (school)
   - Wilayah information
   - Current golongan and target golongan
   - Periode and timeline information
   
2. Restructure "kelola-usulan" page functionality:
   - Repurpose as "Inbox Usulan" for admin
   - Add a separate "Kelola Dokumen" tab for document management
   
3. Clarify status workflow:
   - "Disetujui operator-sekolah" means approved by school operator account
   - "Disetujui operator" means approved by operator account (not operator-sekolah)
   - After operator approval, the proposal proceeds to admin review

### Enhancements Made

#### API Enhancements (`app/api/admin/usulan/route.ts`):
1. Added support for `inbox` query parameter to filter proposals that need admin attention
2. Enhanced data retrieval to include:
   - Complete pegawai information (name, NIP, jabatan)
   - Unit kerja and wilayah information
   - Current golongan and target golongan
   - Timeline data for proposal tracking
   - Proper status descriptions

#### Helper Functions Added:
1. `getNextGolongan()` - Calculates the target golongan based on current golongan
2. `getStatusDescription()` - Provides detailed status descriptions 
3. `generateProposalTimeline()` - Creates a timeline object for tracking proposal progress

#### Frontend Enhancements (`app/admin/kelola-usulan/page.tsx`):
1. Restructured page with tabs:
   - "Inbox Usulan" - Shows proposals needing admin attention
   - "Kelola Dokumen" - For document management
2. Enhanced table with additional columns:
   - Unit kerja (sekolah)
   - Wilayah
   - Golongan (current → target)
   - Timeline information
3. Improved empty state handling

## How to Test

1. Access the admin kelola usulan page at `/admin/kelola-usulan`
2. Verify that the complete data loads correctly (name, NIP, unit kerja, wilayah, golongan)
3. Test the "Inbox Usulan" tab for viewing proposals needing admin attention
4. Test the "Kelola Dokumen" tab for document management functionality
5. Check pagination functionality
6. Verify that wilayah filtering works correctly
7. Verify that status transitions follow the correct workflow

## Future Improvements

- Consider adding more comprehensive error logging
- Add client-side validation for filters
- Improve the handling of empty result sets
- Ensure all field references match the Prisma schema
