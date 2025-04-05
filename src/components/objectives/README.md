# Objectives Module

This module implements the security objectives management functionality for the ISMS Dashboard.

## Features

### 1. Define Objectives
- Create security objectives with statement and priority
- Set priority levels (High, Medium, Low)
- Validate input with react-hook-form and zod

### 2. Manage Objectives
- View all objectives with priority indicators
- Drag-and-drop reordering of objectives
- Edit and delete functionality
- Summary statistics for objectives

## Components

### ObjectiveForm
- Form for creating and editing objectives
- Validation with react-hook-form and zod
- Priority selection with radio buttons
- Error handling and loading states

### ObjectivesList
- List of objectives with drag-and-drop reordering
- Priority indicators with color coding
- Edit and delete functionality
- Summary statistics
- Empty state handling

### ObjectivesDashboard
- Container component that brings everything together
- Manages the overall layout of the objectives page

## Database Schema

The objectives are stored in the `objectives` table with the following structure:

```sql
CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  "order" INTEGER,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Services

### objective-service.ts
- CRUD operations for objectives
- Authentication and authorization checks
- Order management for drag-and-drop functionality

## Usage

The objectives module is accessible from the project navigation menu. Users can:

1. View all objectives for a project
2. Add new objectives with priority levels
3. Reorder objectives by dragging and dropping
4. Edit existing objectives
5. Delete objectives

## Dependencies

- @tanstack/react-query - For data fetching and caching
- @hello-pangea/dnd - For drag-and-drop functionality
- react-hook-form - For form handling
- zod - For validation
- shadcn/ui - For UI components
