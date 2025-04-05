# Stakeholder Management Components

This directory contains components for managing stakeholders in the ISMS Dashboard.

## Components

### StakeholderForm

A form component for adding and editing stakeholders. It includes fields for:
- Name (required)
- Role
- Email
- Phone
- Responsibilities

The form uses react-hook-form with zod for validation.

### StakeholdersTable

A table component that displays all stakeholders for a project. Features include:
- Sorting and filtering
- Edit and delete functionality
- Summary statistics (total stakeholders, with contact info, with responsibilities)

### StakeholdersDashboard

A container component that brings together the stakeholders table and other stakeholder-related components.

## Data Model

Stakeholders are stored in the `stakeholders` table in Supabase with the following structure:

```sql
CREATE TABLE stakeholders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  responsibilities TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Service Functions

The stakeholder service (`src/services/stakeholder-service.ts`) provides the following functions:

- `getStakeholders(projectId)`: Get all stakeholders for a project
- `getStakeholderById(id)`: Get a single stakeholder by ID
- `createStakeholder(projectId, stakeholder)`: Create a new stakeholder
- `updateStakeholder(id, stakeholder)`: Update an existing stakeholder
- `deleteStakeholder(id)`: Delete a stakeholder

## Row-Level Security

The stakeholders table is protected by Row-Level Security (RLS) policies that ensure users can only access and modify their own stakeholders.
