Supabase Database Schema
Here's how we'll create the tables for your ISMS workflow system:
sqlCopy-- Projects table (main table for ISMS projects)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boundaries table (departments, systems, locations in scope)
CREATE TABLE boundaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'department', 'system', 'location'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Objectives table (high-level security objectives)
CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  statement TEXT NOT NULL,
  priority TEXT, -- 'High', 'Medium', 'Low'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stakeholders table (key individuals or roles)
CREATE TABLE stakeholders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  responsibilities TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Statement of Work (SOW) table
CREATE TABLE sows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Controls table (master list of standard controls)
CREATE TABLE controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT NOT NULL, -- e.g., "ISO 27001: A.5.1.1"
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Statement of Applicability (SoA) table
CREATE TABLE soa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  control_id UUID REFERENCES controls(id) NOT NULL,
  is_applicable BOOLEAN DEFAULT TRUE,
  reason_inclusion TEXT,
  reason_exclusion TEXT,
  status TEXT, -- 'Planned', 'Implemented', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, control_id)
);
Row-Level Security (RLS) Policies
Since you're using Supabase Authentication, let's also set up Row-Level Security policies to ensure users can only access their own data:
sqlCopy-- Enable Row Level Security on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sows ENABLE ROW LEVEL SECURITY;
ALTER TABLE soa ENABLE ROW LEVEL SECURITY;

-- Create policies for the projects table
CREATE POLICY "Users can view their own projects" 
ON projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON projects FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for boundaries
CREATE POLICY "Users can view boundaries for their projects" 
ON boundaries FOR SELECT 
USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create boundaries for their projects" 
ON boundaries FOR INSERT 
WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update boundaries for their projects" 
ON boundaries FOR UPDATE 
USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete boundaries for their projects" 
ON boundaries FOR DELETE 
USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Similar policies for objectives, stakeholders, SOWs, and SOA
-- (Code omitted for brevity, follow the same pattern as boundaries)
Initial Control Data
To get started, let's add some example ISO 27001 controls:
sqlCopy-- Insert ISO 27001 controls (a small subset as example)
INSERT INTO controls (reference, description) VALUES
('A.5.1.1', 'Policies for information security'),
('A.6.1.1', 'Information security roles and responsibilities'),
('A.6.1.2', 'Segregation of duties'),
('A.7.1.1', 'Screening'),
('A.7.1.2', 'Terms and conditions of employment'),
('A.8.1.1', 'Inventory of assets'),
('A.8.1.2', 'Ownership of assets'),
('A.8.1.3', 'Acceptable use of assets'),
('A.8.1.4', 'Return of assets'),
('A.9.1.1', 'Access control policy'),
('A.9.2.1', 'User registration and de-registration'),
('A.10.1.1', 'Policy on the use of cryptographic controls'),
('A.11.1.1', 'Physical security perimeter'),
('A.12.1.1', 'Documented operating procedures'),
('A.13.1.1', 'Network controls'),
('A.14.1.1', 'Information security requirements analysis and specification'),
('A.15.1.1', 'Information security policy for supplier relationships'),
('A.16.1.1', 'Responsibilities and procedures'),
('A.17.1.1', 'Planning information security continuity'),
('A.18.1.1', 'Identification of applicable legislation and contractual requirements');