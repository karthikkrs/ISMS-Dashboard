# Supabase Database Configuration

## Completed Setup

### Tables Created
- **projects**: Main table for ISMS projects
- **boundaries**: Departments, systems, locations in scope
- **objectives**: High-level security objectives
- **stakeholders**: Key individuals or roles
- **sows**: Statement of Work
- **controls**: Master list of standard controls
- **soa**: Statement of Applicability

### Security Configuration
- Row-Level Security (RLS) enabled on all tables
- RLS policies implemented for each table:
  - SELECT policies: Users can only view their own data
  - INSERT policies: Users can only create data for their own projects
  - UPDATE policies: Users can only modify their own data
  - DELETE policies: Users can only delete their own data

### Initial Data
- 20 ISO 27001 controls loaded into the controls table (A.5.1.1 through A.18.1.1)

## Database Schema Relationships
- All child tables reference the projects table with ON DELETE CASCADE
- SOA table links projects to controls with a unique constraint

## Authentication Integration
- Tables are integrated with Supabase Auth through user_id references
- All data access is restricted to authenticated users who own the data
