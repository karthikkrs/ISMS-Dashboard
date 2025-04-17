'use client';

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
import { 
  Loader2, 
  AlertCircle, 
  Save, 
  X, 
  Pencil, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';
import { EditableRiskAssessmentItem } from '@/services/risk-register-service';
import { updateRiskAssessment } from '@/services/risk-assessment-service';
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
    const compareValues = (valA: any, valB: any) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editableRiskAssessments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['riskRegisterAggregated', projectId] });
      setEditingRowId(null);
      setEditFormData({});
      setErrorMessage(null);
    },
    onError: (error: any) => {
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
      {/* Error alert */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
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
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                        {formatCurrency(
                          calculateAle(
                            isEditing ? (editFormData.sle ?? null) : item.sle,
                            isEditing ? (editFormData.aro ?? null) : item.aro
                          )
                        )}
                      </TableCell>
                      {/* Notes */}
                      <TableCell>
                        {isEditing ? (
                          <Textarea
                            value={editFormData.assessment_notes ?? ''}
                            onChange={(e) => handleInputChange('assessment_notes', e.target.value)}
                            className="h-8 text-xs min-h-[32px]"
                            placeholder="Notes..."
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground max-w-xs truncate">
                            {item.assessment_notes ?? ''}
                          </span>
                        )}
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex gap-1 justify-end">
                            {/* First step: Save Core button */}
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
                            
                            {/* Second step: Save Breakdown button */}
                            {isSleSavedForEdit && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 px-2" 
                                onClick={handleSaveBreakdown}
                                disabled={
                                  saveStatus === 'saving' || 
                                  validationErrors.sle_breakdown !== undefined
                                }
                              >
                                {saveStatus === 'saving' ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <Save className="h-3 w-3 mr-1" />
                                )}
                                <span className="text-xs">Save Breakdown</span>
                              </Button>
                            )}
                            
                            {/* Cancel button - always present */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7" 
                              onClick={handleCancelClick}
                              disabled={saveStatus === 'saving'}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            
                            {saveStatus === 'error' && !errorMessage && (
                              <span className="text-xs text-red-500 pr-2">Failed to save</span>
                            )}
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    {/* SLE breakdown panel when expanded */}
                    {isExpanded && (
                      <TableRow className="bg-slate-50">
                        <TableCell colSpan={9} className="px-4 py-2">
                          <div className="border-l-2 border-blue-300 pl-4 py-1">
                            <h4 className="text-sm font-medium mb-2">
                              SLE Breakdown - {isEditing ? 
                                (editFormData.sle ? formatCurrency(editFormData.sle) : 'N/A') : 
                                formatCurrency(item.sle)}
                            </h4>
                            
                            {/* Status indicator for the two-step process */}
                            {isEditing && (
                              <div className={`mb-3 p-2 rounded text-sm ${
                                isSleSavedForEdit 
                                  ? 'bg-blue-50 text-blue-700' 
                                  : 'bg-amber-50 text-amber-700'
                              }`}>
                                {isSleSavedForEdit
                                  ? 'Step 2: You can now edit the SLE breakdown values. Make sure they add up to the total SLE amount.'
                                  : 'Step 1: Save the main risk values first before entering the SLE breakdown details.'}
                              </div>
                            )}
                            
                            {/* Display validation error if present */}
                            {isEditing && validationErrors.sle_breakdown && (
                              <div className="mb-3 p-2 bg-red-50 text-red-600 rounded text-sm">
                                {validationErrors.sle_breakdown}
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Direct Operational Costs */}
                              <div className="border-b pb-1">
                                <div>
                                  <span className="text-sm">Direct Operational Costs:</span>
                                  <p className="text-xs text-muted-foreground">
                                    System restoration, business downtime, emergency IT response
                                  </p>
                                </div>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editFormData.sle_direct_operational_costs ?? ''}
                                    onChange={(e) => handleInputChange('sle_direct_operational_costs', e.target.value === '' ? null : Number(e.target.value))}
                                    className={`h-8 text-xs mt-1 ${!isSleSavedForEdit ? 'opacity-60' : ''}`}
                                    disabled={!isSleSavedForEdit}
                                    placeholder="e.g., 4100"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">{formatCurrency(item.sle_direct_operational_costs)}</span>
                                )}
                              </div>
                              
                              {/* Technical Remediation Costs */}
                              <div className="border-b pb-1">
                                <div>
                                  <span className="text-sm">Technical Remediation Costs:</span>
                                  <p className="text-xs text-muted-foreground">
                                    Malware removal, security patching, infrastructure hardening
                                  </p>
                                </div>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editFormData.sle_technical_remediation_costs ?? ''}
                                    onChange={(e) => handleInputChange('sle_technical_remediation_costs', e.target.value === '' ? null : Number(e.target.value))}
                                    className={`h-8 text-xs mt-1 ${!isSleSavedForEdit ? 'opacity-60' : ''}`}
                                    disabled={!isSleSavedForEdit}
                                    placeholder="e.g., 2800"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">{formatCurrency(item.sle_technical_remediation_costs)}</span>
                                )}
                              </div>
                              
                              {/* Data-Related Costs */}
                              <div className="border-b pb-1">
                                <div>
                                  <span className="text-sm">Data-Related Costs:</span>
                                  <p className="text-xs text-muted-foreground">
                                    Data reconstruction, backup restoration, integrity verification
                                  </p>
                                </div>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editFormData.sle_data_related_costs ?? ''}
                                    onChange={(e) => handleInputChange('sle_data_related_costs', e.target.value === '' ? null : Number(e.target.value))}
                                    className={`h-8 text-xs mt-1 ${!isSleSavedForEdit ? 'opacity-60' : ''}`}
                                    disabled={!isSleSavedForEdit}
                                    placeholder="e.g., 1600"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">{formatCurrency(item.sle_data_related_costs)}</span>
                                )}
                              </div>
                              
                              {/* Compliance and Legal Costs */}
                              <div className="border-b pb-1">
                                <div>
                                  <span className="text-sm">Compliance and Legal Costs:</span>
                                  <p className="text-xs text-muted-foreground">
                                    Incident documentation, regulatory reporting, legal consultation
                                  </p>
                                </div>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editFormData.sle_compliance_legal_costs ?? ''}
                                    onChange={(e) => handleInputChange('sle_compliance_legal_costs', e.target.value === '' ? null : Number(e.target.value))}
                                    className={`h-8 text-xs mt-1 ${!isSleSavedForEdit ? 'opacity-60' : ''}`}
                                    disabled={!isSleSavedForEdit}
                                    placeholder="e.g., 900"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">{formatCurrency(item.sle_compliance_legal_costs)}</span>
                                )}
                              </div>
                              
                              {/* Reputational Management Costs */}
                              <div className="border-b pb-1">
                                <div>
                                  <span className="text-sm">Reputational Management Costs:</span>
                                  <p className="text-xs text-muted-foreground">
                                    Customer communications, PR management
                                  </p>
                                </div>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editFormData.sle_reputational_management_costs ?? ''}
                                    onChange={(e) => handleInputChange('sle_reputational_management_costs', e.target.value === '' ? null : Number(e.target.value))}
                                    className={`h-8 text-xs mt-1 ${!isSleSavedForEdit ? 'opacity-60' : ''}`}
                                    disabled={!isSleSavedForEdit}
                                    placeholder="e.g., 600"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">{formatCurrency(item.sle_reputational_management_costs)}</span>
                                )}
                              </div>
                            </div>
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
