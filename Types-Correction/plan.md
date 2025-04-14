# Linting Error Fix Plan

This plan outlines the steps to resolve ESLint and TypeScript errors identified during the `pnpm run build` process. We will use `write_to_file` for all modifications.

**Phase 1: Setup & Type Generation**

*   [x] Create this tracking file (`plan.md`) in the designated folder (`Types-Correction`).
*   [x] **Get Supabase Project ID:** `iovemnfcfuwtuvcmqlqu` (karthikkrs's Project)
*   [x] **Generate Supabase Types:**
    *   [x] Execute `generate_typescript_types` using the provided Project ID.
*   [x] **Update `src/types/database.types.ts`:**
    *   [x] Read the current content of `src/types/database.types.ts`.
    *   [x] Replace the content with the newly generated types.
    *   [x] Write the updated content back using `write_to_file`.
*   [x] **Run Initial Build:** Execute `pnpm run build` to get a fresh error list.
*   [x] **Update Plan:** Paste the initial error list below.

**Fixes Completed:**

1. **`src/components/projects/project-form.tsx`** - ✅ **FIXED**
   * Fixed type error by updating the `createProject` function call to ensure proper types are passed. The issue was that `ProjectFormValues` were being passed to `createProject` which required `name` to be required, not optional.
   * Modified to use an object with the correct shape and added explicit `name` property to ensure it's always included.
   * Removed unused imports for `Project` and `ProjectStatus`
   * Fixed error catch clause to use `unknown` type instead of the incorrect `Error` type

2. **`src/app/auth/page.tsx`** - ✅ **FIXED**
   * Fixed unescaped entity error by replacing `'` with the proper JSX escape sequence `&apos;` in "Don't have an account?"

3. **`src/app/auth/callback/route.ts`** - ✅ **FIXED**
   * Fixed `any` type issue by creating a specific `CookieOptions` interface with proper type definitions
   * This replaces the generic `any` type with a properly typed interface

4. **`src/app/dashboard/page.tsx`** - ✅ **FIXED**
   * Created a proper `CookieOptions` interface to replace all instances of `any` type
   * Removed catch error variables that weren't being used
   * Applied the same type definitions to server action function

5. **`src/components/evidence-gaps/gap-list.tsx`** - ✅ **FIXED**
   * Changed `err: any` to `err: unknown` in catch clause for proper type safety
   * Escaped quotes with `&quot;` entities in JSX for "Evidence & Gaps" text

6. **`src/components/stakeholders/stakeholder-form.tsx`** - ✅ **FIXED**
   * Fixed type error in `performSubmit` function by properly typing the stakeholder data object
   * Created a `stakeholderData` object with required properties to pass to service functions
   * Escaped quotes with `&quot;` entities in JSX for "Stakeholders" text

7. **`src/components/stakeholders/stakeholders-table.tsx`** - ✅ **FIXED**
   * Replaced unescaped quotes with `&quot;` in the dialog confirmation text
   * Improved readability of the confirmation alert description

8. **`src/components/soa/soa-dashboard.tsx`** - ✅ **FIXED**
   * Replaced `any` type with proper discriminated union type for `pendingAction` state
   * Used specific types for payload instead of generic `unknown`
   * Improved state handling by properly typing payload properties
   * Escaped quotes with `&quot;` entities in the dialog confirmation text

9. **`src/components/auth/user-auth-form.tsx`** - ✅ **FIXED**
   * Changed `error: any` to `error: unknown` in catch clause
   * Added proper type checking using `instanceof Error` pattern
   * Improved error handling with a fallback error message when error is not an Error instance

10. **`src/components/reports/crq-summary-table.tsx`** - ✅ **FIXED**
    * Defined a proper `RiskAssessment` type using the `Tables` type from database types
    * Created a `RiskAssessmentWithRelations` interface that extends the base type
    * Added properly typed joined data properties to match the actual returned data structure
    * Used proper type assertions for error handling

11. **`src/components/soa/boundary-controls-list.tsx`** - ✅ **FIXED**
    * Replaced all instances of `any` type with proper `BoundaryControlWithDetails` type
    * Fixed the node ref typing to use proper HTMLDivElement type

12. **`src/components/stakeholders/stakeholders-dashboard.tsx`** - ✅ **FIXED**
    * Removed unused imports and variables
    * Simplified component by removing commented-out code
    * Streamlined the mutations and state management

13. **`src/components/threats/threat-scenario-form.tsx`** - ✅ **FIXED**
    * Removed unused imports (Plus)
    * Created proper type for extended ThreatScenario
    * Fixed type assertion issues by properly typing the data
    * Used TablesInsert instead of any for service function calls

**Current Progress Summary:**
- Fixed 13 files completely
- There are still multiple files with similar issues that need fixing
- Many of the remaining issues fall into common categories:
  1. Replacing `any` types with proper type definitions
  2. Fixing unescaped entity errors (quotes and apostrophes)
  3. Removing unused variables and imports
  4. Addressing empty interface issues in the type definitions

**Next Steps:**

1. Fix issues with `next.d.ts` and `react-recharts.d.ts` by disabling the problematic ESLint rules in those files

2. Fix the middleware.ts and various service files:
   * `src/middleware.ts` - Fix `any` type issues
   * `src/utils/supabase/server.ts` - Fix `any` type issues and unused variables
   * `src/services/boundary-control-service.ts` - Fix `any` and unused variables
   * `src/services/boundary-service.ts` - Fix unused variables
   * `src/services/project-service.ts` - Fix `any` and unused variables
   * `src/services/questionnaire-service.ts` - Fix unused imports and `any` types
   * `src/services/risk-assessment-service.ts` - Fix `any` types and unused function

3. Fix the page component files with cookie handling:
   * `src/app/dashboard/projects/[id]/questionnaire/page.tsx`
   * `src/app/dashboard/projects/[id]/reports/page.tsx`
   * `src/app/dashboard/projects/[id]/soa/page.tsx`
   * `src/app/dashboard/projects/[id]/stakeholders/page.tsx`
   * `src/app/dashboard/projects/new/page.tsx`
   * `src/app/page.tsx`

4. Run builds after each set of fixes to track progress
