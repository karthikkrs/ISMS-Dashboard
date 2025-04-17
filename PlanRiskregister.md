# Plan: Enhance Risk Register with Editable Threat Scenarios & Assessments

**Goal:** Modify the existing Risk Register page (`/dashboard/projects/[id]/risk-register`) to include an editable table displaying both Threat Scenario details and associated Risk Assessment data (SLE, ARO, Severity, etc.).

**Status:** In Progress

**Steps:**

1.  [x] **Create `PlanRiskregister.md`:** Define the initial plan.
2.  [x] **Refactor Data Fetching:** Modify the data fetching logic (in `risk-register-service.ts` and `risk-register/page.tsx`) to retrieve both `risk_assessments` and their linked `threat_scenarios` efficiently using `getEditableRiskAssessments`.
3.  [x] **Update Table Structure (`RiskRegisterTable`):** Modify `src/components/risk/risk-register-table.tsx` to:
    *   Accept the `initialData` prop (`EditableRiskAssessmentItem[]`).
    *   Display relevant columns from both `threat_scenarios` (e.g., name, description) and `risk_assessments` (e.g., SLE, ARO, severity, notes).
4.  [x] **Implement Basic Inline Editing:** Introduce inline editing for key assessment fields (Severity, SLE, ARO). Start with simple text inputs or selects.
5.  [x] **Implement Save/Update Logic:**
    *   Create or update functions in `src/services/risk-assessment-service.ts` to handle saving changes made via inline editing.
    *   Integrate these service calls into the `RiskRegisterTable` component, likely using `useMutation` from `@tanstack/react-query`.
6.  [x] **Add Input Validation:** Implement client-side validation (e.g., ensuring SLE/ARO are numbers) within the editable cells.
7.  [x] **Implement ALE Calculation:** Add logic within the table component to calculate and display the Annualized Loss Expectancy (ALE = SLE * ARO) dynamically as values are edited.
8.  [x] **Refine UX (Optional/Future):** Added features including sorting, filtering by severity, visual indicators for sort state, and statistics.
9.  [x] **Testing & Finalization:** Thoroughly tested the editing, saving, validation, and display logic.
