'use client';
/* eslint-disable react/no-unescaped-entities */

import React, { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, 
  AlertCircle, 
  Save, 
  X, 
  Pencil, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronRight,
  Trash2
} from 'lucide-react';
import { EditableRiskAssessmentItem } from '@/services/risk-register-service';
import { updateRiskAssessment, deleteRiskAssessment } from '@/services/risk-assessment-service';
import { Tables, TablesUpdate } from '@/types/database.types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define the props interface
interface RiskRegisterTableProps {
  projectId: string;
  initialData?: EditableRiskAssessmentItem[];
  isLoading?: boolean;
  error?: Error | null;
}

export function RiskRegisterTable({
  projectId,
  initialData = [],
  isLoading = false,
  error = null,
}: RiskRegisterTableProps) {
  // Get the query client for invalidating queries
  const queryClient = useQueryClient();

  // Helper function to calculate ALE
  const calculateAle = (sle: number | null, aro: number | null): number | null => {
    if (sle === null || aro === null) return null;
    return sle * aro;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  
  // Track expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Use a more specific type for form data, matching editable fields
  const [editFormData, setEditFormData] = useState<Partial<Pick<Tables<'risk_assessments'>, 
    'severity' | 'sle' | 'aro' | 'assessment_notes' |
    'sle_direct_operational_costs' | 'sle_technical_remediation_costs' | 
    'sle_data_related_costs' | 'sle_compliance_legal_costs' | 'sle_reputational_management_costs'
  >>>({});
  
  // Track validation errors
  const [validationErrors, setValidationErrors] = useState<{
    sle?: string;
    aro?: string;
    severity?: string;
    sle_breakdown?: string;
  }>({});
  
  // Add severity filter state
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  
  // Add sorting state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Save status and error message
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Track if core fields have been saved during current edit session
  const [isSleSavedForEdit, setIsSleSavedForEdit] = useState<boolean>(false);

  // Reset error message when editing starts/stops
  useEffect(() => {
    setErrorMessage(null);
  }, [editingRowId]);

  // Calculate breakdown sum
  const calculateBreakdownSum = useCallback(() => {
    const values = [
      editFormData.sle_direct_operational_costs,
      editFormData.sle_technical_remediation_costs,
      editFormData.sle_data_related_costs,
      editFormData.sle_compliance_legal_costs,
      editFormData.sle_reputational_management_costs
    ];
    
    return values
      .filter(val => val !== undefined && val !== null)
      .reduce((acc, val) => acc + Number(val), 0);
  }, [editFormData]);

  // Check if breakdown values exist
  const hasBreakdownValues = useCallback(() => {
    return [
      editFormData.sle_direct_operational_costs,
      editFormData.sle_technical_remediation_costs,
      editFormData.sle_data_related_costs,
      editFormData.sle_compliance_legal_costs,
      editFormData.sle_reputational_management_costs
    ].some(val => val !== undefined && val !== null && val !== 0);
  }, [editFormData]);

  // Real-time validation effect for SLE breakdown
  useEffect(() => {
    // Only run validation when in step 2 (after core values saved)
    if (isSleSavedForEdit && editingRowId) {
      // Calculate and validate breakdown sum against SLE total
      const sle = editFormData.sle ? Number(editFormData.sle) : 0;
      const breakdownSum = calculateBreakdownSum();
      
      // Update validation message in real-time
      if (sle > 0 && hasBreakdownValues()) {
        if (Math.abs(sle - breakdownSum) > 0.01) {
          setValidationErrors(prev => ({
            ...prev,
            sle_breakdown: `SLE breakdown total (${breakdownSum.toFixed(2)}) must equal SLE (${sle.toFixed(2)})`
          }));
        } else {
          // Clear validation error if values match
          setValidationErrors(prev => ({
            ...prev,
            sle_breakdown: undefined
          }));
        }
      } else {
        // Clear error if SLE is 0 or no breakdown values exist
        setValidationErrors(prev => ({
          ...prev,
          sle_breakdown: undefined
        }));
      }
    }
  }, [
    editFormData.sle_direct_operational_costs,
    editFormData.sle_technical_remediation_costs,
    editFormData.sle_data_related_costs,
    editFormData.sle_compliance_legal_costs,
    editFormData.sle_reputational_management_costs,
    isSleSavedForEdit,
    editingRowId,
    editFormData.sle,
    calculateBreakdownSum, // Added dependency
    hasBreakdownValues // Added dependency
  ]);

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filtered data
  const filteredData = initialData.filter((item) => {
    const threatName = item.threat_scenarios?.name ?? '';
    const threatDesc = item.threat_scenarios?.description ?? '';
    const matchesSearch = searchTerm === '' || 
      threatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threatDesc.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = !severityFilter || 
      (item.severity === severityFilter);
    
    return matchesSearch && matchesSeverity;
  });
  
  // Sorted data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    // Helper function for null-safe comparison
    const compareValues = <T extends string | number | null | undefined>(valA: T, valB: T) => {
      if (valA === null && valB === null) return 0;
      if (valA === null) return sortDirection === 'asc' ? -1 : 1;
      if (valB === null) return sortDirection === 'asc' ? 1 : -1;
      
      return valA < valB 
        ? (sortDirection === 'asc' ? -1 : 1)
        : valA > valB 
          ? (sortDirection === 'asc' ? 1 : -1)
          : 0;
    };
    
    // Sort by different fields
    switch (sortField) {
      case 'name':
        return compareValues(
          a.threat_scenarios?.name?.toLowerCase(),
          b.threat_scenarios?.name?.toLowerCase()
        );
      case 'severity':
        const severityOrder = { high: 3, medium: 2, low: 1, null: 0 };
        const valA = a.severity ? severityOrder[a.severity as keyof typeof severityOrder] : 0;
        const valB = b.severity ? severityOrder[b.severity as keyof typeof severityOrder] : 0;
        return compareValues(valA, valB);
      case 'sle':
        return compareValues(a.sle, b.sle);
      case 'aro':
        return compareValues(a.aro, b.aro);
      case 'ale':
        return compareValues(
          calculateAle(a.sle, a.aro),
          calculateAle(b.sle, b.aro)
        );
      default:
        return 0;
    }
  });

  // Handle sort click
  const handleSortClick = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Edit handlers
  const handleEditClick = useCallback((item: EditableRiskAssessmentItem) => {
    setEditingRowId(item.id);
    setSaveStatus('idle');
    setErrorMessage(null);
    setValidationErrors({});
    setIsSleSavedForEdit(false); // Reset the SLE saved state when starting edit
    
    // Initialize form data with current item values
    setEditFormData({
      severity: item.severity,
      sle: item.sle,
      aro: item.aro,
      assessment_notes: item.assessment_notes,
      sle_direct_operational_costs: item.sle_direct_operational_costs,
      sle_technical_remediation_costs: item.sle_technical_remediation_costs,
      sle_data_related_costs: item.sle_data_related_costs,
      sle_compliance_legal_costs: item.sle_compliance_legal_costs,
      sle_reputational_management_costs: item.sle_reputational_management_costs,
    });

    // Always expand the row when editing to show breakdown fields
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      newSet.add(item.id);
      return newSet;
    });
  }, []);

  const handleCancelClick = useCallback(() => {
    setEditingRowId(null);
    setEditFormData({});
    setSaveStatus('idle');
    setErrorMessage(null);
    setValidationErrors({});
  }, []);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TablesUpdate<'risk_assessments'> }) => 
      updateRiskAssessment(id, data),
    // Don't automatically exit edit mode on success - let each operation decide
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editableRiskAssessments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['riskRegisterAggregated', projectId] });
      setErrorMessage(null);
    },
    onError: (error: Error & { message?: string }) => {
      console.error('Error updating risk assessment:', error);
      
      let message = 'Failed to save changes.';
      if (error.message) {
        message = error.message;
      }
      
      if (error.message?.includes('sle_breakdown_matches_total')) {
        message = 'SLE breakdown values must add up to the total SLE amount.';
        setValidationErrors(prev => ({
          ...prev,
          sle_breakdown: 'SLE breakdown values must add up to the total SLE.'
        }));
      }
      
      setErrorMessage(message);
      setSaveStatus('error');
    }
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRiskAssessment(id),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['editableRiskAssessments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['riskRegisterAggregated', projectId] });
      toast.success('Risk assessment deleted successfully');
    },
    onError: (error: Error & { message?: string }) => {
      console.error('Error deleting risk assessment:', error);
      toast.error('Failed to delete risk assessment');
    }
  });

  // Validation function - validates data based on current edit stage
  const validateFormData = useCallback((validateBreakdown = false) => {
    const errors: {
      sle?: string;
      aro?: string;
      severity?: string;
      sle_breakdown?: string;
    } = {};
    
    // Always validate core fields
    
    // Validate SLE
    if (editFormData.sle !== undefined && editFormData.sle !== null) {
      if (isNaN(Number(editFormData.sle))) {
        errors.sle = "Must be a valid number";
      } else if (Number(editFormData.sle) < 0) {
        errors.sle = "Cannot be negative";
      }
    }
    
    // Validate ARO
    if (editFormData.aro !== undefined && editFormData.aro !== null) {
      if (isNaN(Number(editFormData.aro))) {
        errors.aro = "Must be a valid number";
      } else if (Number(editFormData.aro) < 0) {
        errors.aro = "Cannot be negative";
      } else if (Number(editFormData.aro) > 365) {
        errors.aro = "Value seems too high";
      }
    }
    
    // Validate severity
    if (editFormData.severity !== undefined && editFormData.severity !== null && editFormData.severity !== '') {
      if (!['low', 'medium', 'high'].includes(editFormData.severity)) {
        errors.severity = "Invalid severity value";
      }
    }
    
    // Only validate SLE breakdown if we're in the second step or if explicitly requested
    if (isSleSavedForEdit || validateBreakdown) {
      // Validate SLE breakdown sum equals SLE total
      const sle = editFormData.sle ? Number(editFormData.sle) : 0;
      const hasBreakdown = hasBreakdownValues();
      
      if (sle > 0 && hasBreakdown) {
        const breakdownSum = calculateBreakdownSum();
        
        // Allow for floating point imprecision (0.01 tolerance)
        if (Math.abs(sle - breakdownSum) > 0.01) {
          errors.sle_breakdown = `SLE breakdown total (${breakdownSum.toFixed(2)}) must equal SLE (${sle.toFixed(2)})`;
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [editFormData, hasBreakdownValues, calculateBreakdownSum, isSleSavedForEdit]);
  
  // Save core details handler
  const handleSaveCoreDetails = useCallback(() => {
    if (!editingRowId) return;
    
    setErrorMessage(null);
    
    // First step: Validate only core fields (SLE, ARO, severity, notes)
    // We don't validate breakdown fields at this stage
    if (!validateFormData(false)) {
      setSaveStatus('error');
      setErrorMessage('Please fix the validation errors in the highlighted fields before saving.');
      return;
    }
    
    setSaveStatus('saving');
    
    // Only include core fields in the first save
    const updateData: TablesUpdate<'risk_assessments'> = {
      severity: editFormData.severity,
      sle: editFormData.sle,
      aro: editFormData.aro,
      assessment_notes: editFormData.assessment_notes,
      updated_at: new Date().toISOString()
    };
    
    updateMutation.mutate(
      { 
        id: editingRowId, 
        data: updateData 
      },
      {
        onSuccess: () => {
          // Keep editing but change to second step
          setIsSleSavedForEdit(true);
          setSaveStatus('success');
          // Show a success message
          setErrorMessage(`Core risk values saved. Now you can set the SLE breakdown details below.`);
          
          // Display toast notification
          toast.success('Core values saved successfully. SLE breakdown is now editable.');
          
          // Stay in edit mode
          setTimeout(() => {
            setSaveStatus('idle');
            // Make sure row is expanded to show breakdown
            setExpandedRows(prev => {
              const newSet = new Set(prev);
              newSet.add(editingRowId);
              return newSet;
            });
          }, 2000);
        },
        onError: () => {
          setSaveStatus('error');
          setErrorMessage('Failed to save core risk values.');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      }
    );
  }, [editingRowId, editFormData, updateMutation, validateFormData]);

  // Save breakdown handler
  const handleSaveBreakdown = useCallback(() => {
    if (!editingRowId) return;
    
    setErrorMessage(null);
    
    // Second step: Validate all fields including the breakdown sum
    if (!validateFormData(true)) {
      setSaveStatus('error');
      // Provide a specific error message if the breakdown is the issue
      if (validationErrors.sle_breakdown) {
        setErrorMessage(`SLE Breakdown Error: ${validationErrors.sle_breakdown}. Please make sure breakdown values add up to the total SLE.`);
      } else {
        setErrorMessage('Please fix the validation errors in the highlighted fields before saving.');
      }
      return;
    }
    
    setSaveStatus('saving');
    
    // Include only the breakdown values in the second save
    const updateData: TablesUpdate<'risk_assessments'> = {
      sle_direct_operational_costs: editFormData.sle_direct_operational_costs,
      sle_technical_remediation_costs: editFormData.sle_technical_remediation_costs,
      sle_data_related_costs: editFormData.sle_data_related_costs, 
      sle_compliance_legal_costs: editFormData.sle_compliance_legal_costs,
      sle_reputational_management_costs: editFormData.sle_reputational_management_costs,
      updated_at: new Date().toISOString()
    };
    
    updateMutation.mutate(
      { 
        id: editingRowId, 
        data: updateData 
      },
      {
        onSuccess: () => {
          // Exit edit mode completely after second save
          setSaveStatus('success');
          queryClient.invalidateQueries({ queryKey: ['editableRiskAssessments', projectId] });
          queryClient.invalidateQueries({ queryKey: ['riskRegisterAggregated', projectId] });
          
          // Short delay to show success before exiting edit mode
          setTimeout(() => {
            setEditingRowId(null);
            setEditFormData({});
            setIsSleSavedForEdit(false);
            setSaveStatus('idle');
          }, 1000);
        },
        onError: () => {
          setSaveStatus('error');
          setErrorMessage('Failed to save SLE breakdown values.');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      }
    );
  }, [editingRowId, editFormData, updateMutation, validateFormData, validationErrors, queryClient, projectId]);

  // Input handler
  const handleInputChange = useCallback((field: keyof typeof editFormData, value: string | number | null) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    
    if (field === 'sle' || 
        field === 'sle_direct_operational_costs' || 
        field === 'sle_technical_remediation_costs' || 
        field === 'sle_data_related_costs' || 
        field === 'sle_compliance_legal_costs' || 
        field === 'sle_reputational_management_costs') {
      setValidationErrors(prev => ({ ...prev, sle_breakdown: undefined }));
    }
  }, []);

  // Handle delete confirmation without using quotes that trigger React's no-unescaped-entities rule
  const handleDeleteConfirmation = useCallback((item: EditableRiskAssessmentItem) => {
    const name = item.threat_scenarios?.name || "";
    // Using backticks with HTML entities
    const message = `Are you sure you want to delete the risk assessment for ${name}? This action cannot be undone.`;
    
    if (window.confirm(message)) {
      deleteMutation.mutate(item.id);
    }
  }, [deleteMutation]);
  
  // Render risk level badge
  const renderRiskLevel = (severity: string | null) => {
    if (!severity) return <Badge variant="outline">N/A</Badge>;
    if (severity === 'high') return <Badge variant="destructive">High</Badge>;
    if (severity === 'medium') return <Badge variant="warning">Medium</Badge>;
    if (severity === 'low') return <Badge variant="success">Low</Badge>;
    return <Badge variant="outline">{severity}</Badge>;
  };

  // Format currency
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return (
      <span className="inline-block ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Check if any SLE breakdown exists
  const hasSleBreakdown = (item: EditableRiskAssessmentItem): boolean => {
    return (
      (item.sle_direct_operational_costs !== null && item.sle_direct_operational_costs > 0) || 
      (item.sle_technical_remediation_costs !== null && item.sle_technical_remediation_costs > 0) ||
      (item.sle_data_related_costs !== null && item.sle_data_related_costs > 0) ||
      (item.sle_compliance_legal_costs !== null && item.sle_compliance_legal_costs > 0) ||
      (item.sle_reputational_management_costs !== null && item.sle_reputational_management_costs > 0)
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center p-4 text-red-500">
        <AlertCircle className="h-5 w-5 mr-2" />
        <p>Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status alert - can be success or error */}
      {errorMessage && (
        <Alert 
          variant={saveStatus === 'error' ? "destructive" : "default"} 
          className="mb-4"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{saveStatus === 'error' ? 'Error' : 'Success'}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search threats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2 items-center">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-1" />
          <span className="text-xs text-muted-foreground mr-2">Severity:</span>
          <Button
            variant={severityFilter === null ? "default" : "outline"}
            onClick={() => setSeverityFilter(null)}
            size="sm"
            className="text-xs px-2 py-0 h-7"
          >
            All
          </Button>
          <Button
            variant={severityFilter === 'high' ? "default" : "outline"}
            onClick={() => setSeverityFilter('high')}
            size="sm"
            className="text-xs px-2 py-0 h-7 border-red-200 text-red-700 hover:text-red-800 hover:bg-red-50"
          >
            High
          </Button>
          <Button
            variant={severityFilter === 'medium' ? "default" : "outline"}
            onClick={() => setSeverityFilter('medium')}
            size="sm"
            className="text-xs px-2 py-0 h-7 border-amber-200 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
          >
            Medium
          </Button>
          <Button
            variant={severityFilter === 'low' ? "default" : "outline"}
            onClick={() => setSeverityFilter('low')}
            size="sm"
            className="text-xs px-2 py-0 h-7 border-green-200 text-green-700 hover:text-green-800 hover:bg-green-50"
          >
            Low
          </Button>
        </div>
      </div>

      {/* Main table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>Control ID</TableHead>
              <TableHead>Gap</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSortClick('name')}
              >
                Threat Scenario {renderSortIndicator('name')}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSortClick('severity')}
              >
                Severity {renderSortIndicator('severity')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSortClick('sle')}
              >
                SLE ($) {renderSortIndicator('sle')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSortClick('aro')}
              >
                ARO {renderSortIndicator('aro')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSortClick('ale')}
              >
                ALE ($) {renderSortIndicator('ale')}
              </TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No risk assessments found for this project.
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item) => {
                const isEditing = editingRowId === item.id;
                const isExpanded = expandedRows.has(item.id);
                const hasBreakdown = hasSleBreakdown(item);
                
                return (
                  <React.Fragment key={item.id}>
                    {/* Main row */}
                    <TableRow className={isEditing ? "bg-muted/50" : ""}>
                      {/* Expansion column with toggle button */}
                      <TableCell className="p-0 pl-2 w-[30px]">
                        {(hasBreakdown || isEditing) && (
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleRowExpansion(item.id)}
                          >
                            {isExpanded ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                        )}
                      </TableCell>
                      {/* Control ID */}
                      <TableCell>
                        {(() => {
                          // Debug logging
                          console.log('Control data for row:', {
                            itemId: item.id,
                            gapId: item.gap_id,
                            boundaryControls: item.boundary_controls,
                            controlDetails: item.boundary_controls?.controls,
                            controlId: item.boundary_controls?.controls?.control_id
                          });
                          
                          // Try to get control ID from the controls object
                          const controlIdFromControls = item.boundary_controls?.controls?.control_id;
                          
                          // If not available from boundary_controls, try to get directly from gaps.control_id
                          const controlIdFromGaps = item.gaps?.control_id;
                          
                          // Return the control ID from either source or N/A if not available
                          return controlIdFromControls || controlIdFromGaps || 'N/A';
                        })()}
                      </TableCell>
                      {/* Gap */}
                      <TableCell>
                        {(() => {
                          // Debug logging
                          console.log('Gap data for row:', {
                            itemId: item.id,
                            gapId: item.gap_id,
                            gapDetails: item.gaps,
                            gapTitle: item.gaps?.title
                          });
                          return item.gaps?.title ?? 'N/A';
                        })()}
                      </TableCell>
                      {/* Threat Name */}
                      <TableCell className="font-medium">{item.threat_scenarios?.name ?? 'N/A'}</TableCell>
                      {/* Threat Description */}
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {item.threat_scenarios?.description ?? ''}
                      </TableCell>
                      {/* Severity */}
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={editFormData.severity ?? ''}
                            onValueChange={(value) => handleInputChange('severity', value)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select Severity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          renderRiskLevel(item.severity)
                        )}
                      </TableCell>
                      {/* SLE */}
                      <TableCell>
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input
                              type="number"
                              value={editFormData.sle ?? ''}
                              onChange={(e) => handleInputChange('sle', e.target.value === '' ? null : Number(e.target.value))}
                              className={`h-8 text-xs ${validationErrors.sle ? 'border-red-500' : ''}`}
                              placeholder="e.g., 10000"
                            />
                            {validationErrors.sle && (
                              <p className="text-xs text-red-500">{validationErrors.sle}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span>{formatCurrency(item.sle)}</span>
                            {hasBreakdown && !isExpanded && (
                              <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">
                                Breakdown
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      {/* ARO */}
                      <TableCell>
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={editFormData.aro ?? ''}
                              onChange={(e) => handleInputChange('aro', e.target.value === '' ? null : Number(e.target.value))}
                              className={`h-8 text-xs ${validationErrors.aro ? 'border-red-500' : ''}`}
                              placeholder="e.g., 0.5"
                            />
                            {validationErrors.aro && (
                              <p className="text-xs text-red-500">{validationErrors.aro}</p>
                            )}
                          </div>
                        ) : (
                          item.aro ?? 'N/A'
                        )}
                      </TableCell>
                      {/* ALE */}
                      <TableCell>
                        {isEditing ? (
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(calculateAle(editFormData.sle, editFormData.aro))}
                          </span>
                        ) : (
                          formatCurrency(calculateAle(item.sle, item.aro))
                        )}
                      </TableCell>
                      {/* Notes */}
                      <TableCell>
                        {isEditing ? (
                          <Textarea
                            value={editFormData.assessment_notes ?? ''}
                            onChange={(e) => handleInputChange('assessment_notes', e.target.value)}
                            className="text-xs min-h-[40px]"
                            rows={2}
                            placeholder="Assessment notes..."
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground max-w-xs truncate">
                            {item.assessment_notes ?? ''}
                          </p>
                        )}
                      </TableCell>
                      {/* Actions */}
                      <TableCell>
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            {/* Save Core Button */}
                            {!isSleSavedForEdit && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 px-2" 
                                onClick={handleSaveCoreDetails}
                                disabled={
                                  saveStatus === 'saving' || 
                                  (validationErrors.sle || validationErrors.aro || validationErrors.severity) !== undefined
                                }
                              >
                                {saveStatus === 'saving' ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <Save className="h-3 w-3 mr-1" />
                                )}
                                <span className="text-xs">Save Core</span>
                              </Button>
                            )}
                            
                            {/* Save Breakdown Button */}
                            {isSleSavedForEdit && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 px-2" 
                                onClick={handleSaveBreakdown}
                                disabled={saveStatus === 'saving' || validationErrors.sle_breakdown !== undefined}
                              >
                                {saveStatus === 'saving' ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <Save className="h-3 w-3 mr-1" />
                                )}
                                <span className="text-xs">Save Breakdown</span>
                              </Button>
                            )}
                            
                            {/* Cancel Button */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs" 
                              onClick={handleCancelClick}
                              disabled={saveStatus === 'saving'}
                            >
                              <X className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteConfirmation(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded row for SLE breakdown */}
                    {isExpanded && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={11} className="p-0">
                          <div className="p-4 space-y-4 border-t">
                            {isEditing ? (
                              // EDITING VIEW for Breakdown
                              <>
                                {/* Status indicator for the two-step process */}
                                {isSleSavedForEdit && (
                                  <div className="mb-3 p-2 rounded text-sm bg-blue-50 text-blue-700">
                                    Step 2: You can now edit the SLE breakdown values. Make sure they add up to the total SLE amount.
                                  </div>
                                )}
                                
                                {/* Warning message about saving breakdown values */}
                                {!isSleSavedForEdit && (
                                  <div className="mb-3 p-2 rounded text-sm bg-blue-50 text-blue-700">
                                    <span>
                                      You can enter SLE breakdown values at any time. To save them, first save the core values by clicking "Save Core".
                                    </span>
                                  </div>
                                )}
                                
                                {/* SLE Breakdown Mismatch Notification */}
                                {validationErrors.sle_breakdown && (
                                  <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                    <AlertTitle className="text-blue-700">SLE Breakdown Note</AlertTitle>
                                    <AlertDescription>
                                      {validationErrors.sle_breakdown}. Total breakdown values should equal the SLE amount for accurate risk assessment.
                                    </AlertDescription>
                                  </Alert>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                  {/* Direct Operational Costs */}
                                  <div>
                                    <label className="text-xs font-medium">Direct Operational Costs</label>
                                    <Input
                                      type="number"
                                      value={editFormData.sle_direct_operational_costs ?? ''}
                                      onChange={(e) => handleInputChange('sle_direct_operational_costs', 
                                        e.target.value === '' ? null : Number(e.target.value))}
                                      placeholder="e.g., 4100"
                                      // Merged classNames
                                      className={`h-8 text-xs mt-1 ${
                                        validationErrors.sle_breakdown 
                                          ? 'border-orange-300 focus:border-orange-500' 
                                          : ''
                                      }`}
                                    />
                                  </div>
                                  {/* Technical Remediation Costs */}
                                  <div>
                                    <label className="text-xs font-medium">Technical Remediation Costs</label>
                                    <Input
                                      type="number"
                                      value={editFormData.sle_technical_remediation_costs ?? ''}
                                      onChange={(e) => handleInputChange('sle_technical_remediation_costs', 
                                        e.target.value === '' ? null : Number(e.target.value))}
                                      placeholder="e.g., 2500"
                                      // Merged classNames
                                      className={`h-8 text-xs mt-1 ${
                                        validationErrors.sle_breakdown 
                                          ? 'border-orange-300 focus:border-orange-500' 
                                          : ''
                                      }`}
                                    />
                                  </div>
                                  {/* Data Related Costs */}
                                  <div>
                                    <label className="text-xs font-medium">Data Related Costs</label>
                                    <Input
                                      type="number"
                                      value={editFormData.sle_data_related_costs ?? ''}
                                      onChange={(e) => handleInputChange('sle_data_related_costs', 
                                        e.target.value === '' ? null : Number(e.target.value))}
                                      placeholder="e.g., 1200"
                                      // Merged classNames
                                      className={`h-8 text-xs mt-1 ${
                                        validationErrors.sle_breakdown 
                                          ? 'border-orange-300 focus:border-orange-500' 
                                          : ''
                                      }`}
                                    />
                                  </div>
                                  {/* Compliance & Legal Costs */}
                                  <div>
                                    <label className="text-xs font-medium">Compliance & Legal Costs</label>
                                    <Input
                                      type="number"
                                      value={editFormData.sle_compliance_legal_costs ?? ''}
                                      onChange={(e) => handleInputChange('sle_compliance_legal_costs', 
                                        e.target.value === '' ? null : Number(e.target.value))}
                                      placeholder="e.g., 800"
                                      // Merged classNames
                                      className={`h-8 text-xs mt-1 ${
                                        validationErrors.sle_breakdown 
                                          ? 'border-orange-300 focus:border-orange-500' 
                                          : ''
                                      }`}
                                    />
                                  </div>
                                  {/* Reputational Management Costs */}
                                  <div>
                                    <label className="text-xs font-medium">Reputational Management Costs</label>
                                    <Input
                                      type="number"
                                      value={editFormData.sle_reputational_management_costs ?? ''}
                                      onChange={(e) => handleInputChange('sle_reputational_management_costs', 
                                        e.target.value === '' ? null : Number(e.target.value))}
                                      placeholder="e.g., 1400"
                                      // Merged classNames
                                      className={`h-8 text-xs mt-1 ${
                                        validationErrors.sle_breakdown 
                                          ? 'border-orange-300 focus:border-orange-500' 
                                          : ''
                                      }`}
                                    />
                                  </div>
                                </div>
                                
                                {/* Real-time sum display and remaining amount */}
                                <div className="mt-2 flex justify-between items-center">
                                  <div className="text-xs text-muted-foreground">
                                    Current Total: <span className={`font-medium ${
                                      isSleSavedForEdit && Math.abs(calculateBreakdownSum() - (editFormData.sle ?? 0)) > 0.01 
                                        ? 'text-red-600' 
                                        : 'text-green-600'
                                    }`}>
                                      {formatCurrency(calculateBreakdownSum())}
                                    </span>
                                  </div>
                                  {validationErrors.sle_breakdown && (
                                    <div className="text-xs">
                                      <span className="text-orange-600">
                                        Remaining: {formatCurrency((editFormData.sle ?? 0) - calculateBreakdownSum())}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    Target SLE: <span className="font-medium">{formatCurrency(editFormData.sle)}</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              // READ-ONLY VIEW for Breakdown
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">SLE Breakdown</h4>
                                {hasBreakdown ? (
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 text-xs">
                                    {item.sle_direct_operational_costs !== null && item.sle_direct_operational_costs > 0 && (
                                      <div>
                                        <span className="font-medium text-gray-600">Direct Operational:</span>
                                        <p className="text-gray-800">{formatCurrency(item.sle_direct_operational_costs)}</p>
                                      </div>
                                    )}
                                    {item.sle_technical_remediation_costs !== null && item.sle_technical_remediation_costs > 0 && (
                                      <div>
                                        <span className="font-medium text-gray-600">Technical Remediation:</span>
                                        <p className="text-gray-800">{formatCurrency(item.sle_technical_remediation_costs)}</p>
                                      </div>
                                    )}
                                    {item.sle_data_related_costs !== null && item.sle_data_related_costs > 0 && (
                                      <div>
                                        <span className="font-medium text-gray-600">Data Related:</span>
                                        <p className="text-gray-800">{formatCurrency(item.sle_data_related_costs)}</p>
                                      </div>
                                    )}
                                    {item.sle_compliance_legal_costs !== null && item.sle_compliance_legal_costs > 0 && (
                                      <div>
                                        <span className="font-medium text-gray-600">Compliance & Legal:</span>
                                        <p className="text-gray-800">{formatCurrency(item.sle_compliance_legal_costs)}</p>
                                      </div>
                                    )}
                                    {item.sle_reputational_management_costs !== null && item.sle_reputational_management_costs > 0 && (
                                      <div>
                                        <span className="font-medium text-gray-600">Reputational Management:</span>
                                        <p className="text-gray-800">{formatCurrency(item.sle_reputational_management_costs)}</p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">No breakdown values entered.</p>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
