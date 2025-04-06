import { createBrowserClient } from '@supabase/ssr'

// Create a Supabase client for client components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Control = {
  id: string
  reference: string
  description: string
  domain: string // Added domain field
  created_at: string
}

// Get all controls
export const getControls = async (): Promise<Control[]> => {
  try {
    console.log('Fetching all controls')
    
    const { data: controls, error } = await supabase
      .from('controls')
      .select('*')
      .order('reference', { ascending: true })
    
    if (error) {
      console.error('Error fetching controls:', JSON.stringify(error, null, 2))
      
      // Check for specific error types
      if (error.code === '42P01') {
        throw new Error('Database table not found. Please contact support.')
      } else if (error.code === '42501') {
        throw new Error('Permission denied. You may not have the right access level.')
      } else {
        throw new Error(`Failed to fetch controls: ${error.message}`)
      }
    }
    
    console.log(`Found ${controls?.length || 0} controls`)
    return controls as Control[] || []
  } catch (error) {
    console.error('Error in getControls:', error)
    throw error
  }
}

// Get a control by ID
export const getControlById = async (id: string): Promise<Control> => {
  try {
    console.log('Fetching control by ID:', id)
    
    const { data: control, error } = await supabase
      .from('controls')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching control:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to fetch control: ${error.message}`)
    }
    
    if (!control) {
      throw new Error('Control not found')
    }
    
    return control as Control
  } catch (error) {
    console.error('Error in getControlById:', error)
    throw error
  }
}

// Get controls by category
export const getControlsByCategory = async (category: string): Promise<Control[]> => {
  try {
    console.log('Fetching controls by category:', category)
    
    // Extract the category pattern (e.g., "A.5" from "A.5.1.1")
    const categoryPattern = `${category}%`
    
    const { data: controls, error } = await supabase
      .from('controls')
      .select('*')
      .ilike('reference', categoryPattern)
      .order('reference', { ascending: true })
    
    if (error) {
      console.error('Error fetching controls by category:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to fetch controls by category: ${error.message}`)
    }
    
    console.log(`Found ${controls?.length || 0} controls in category ${category}`)
    return controls as Control[] || []
  } catch (error) {
    console.error('Error in getControlsByCategory:', error)
    throw error
  }
}

// Search controls
export const searchControls = async (searchTerm: string): Promise<Control[]> => {
  try {
    console.log('Searching controls with term:', searchTerm)
    
    const { data: controls, error } = await supabase
      .from('controls')
      .select('*')
      .or(`reference.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('reference', { ascending: true })
    
    if (error) {
      console.error('Error searching controls:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to search controls: ${error.message}`)
    }
    
    console.log(`Found ${controls?.length || 0} controls matching search term`)
    return controls as Control[] || []
  } catch (error) {
    console.error('Error in searchControls:', error)
    throw error
  }
}
