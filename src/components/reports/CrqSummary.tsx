import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Dummy data for Cyber Risk Quantification (CRQ) scenarios
const crqData = [
  {
    id: 'TS001',
    scenario: 'Ransomware attack encrypting critical servers',
    sle: 150000, // Single Loss Expectancy (e.g., in USD)
    aro: 0.2, // Annualized Rate of Occurrence (e.g., 1 in 5 years)
    ale: 30000, // Annualized Loss Expectancy (SLE * ARO)
    confidence: 'Medium',
    impactArea: 'Operations, Reputation',
  },
  {
    id: 'TS002',
    scenario: 'Data breach exposing customer PII via SQL injection',
    sle: 500000,
    aro: 0.1, // 1 in 10 years
    ale: 50000,
    confidence: 'High',
    impactArea: 'Compliance, Reputation, Financial',
  },
  {
    id: 'TS003',
    scenario: 'Phishing campaign leading to credential theft and BEC',
    sle: 75000,
    aro: 0.5, // Once every 2 years
    ale: 37500,
    confidence: 'Medium',
    impactArea: 'Financial, Operations',
  },
  {
    id: 'TS004',
    scenario: 'DDoS attack causing service outage during peak hours',
    sle: 20000,
    aro: 1.5, // 3 times every 2 years
    ale: 30000,
    confidence: 'Low',
    impactArea: 'Operations, Revenue',
  },
];

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

// Helper to determine badge variant based on ALE
const getAleBadgeVariant = (ale: number): "destructive" | "default" | "secondary" | "outline" | "success" | null | undefined => {
  if (ale >= 50000) return "destructive"; // High risk
  if (ale >= 30000) return "default"; // Medium risk (using default instead of warning)
  return "secondary"; // Low risk
};

export function CrqSummary() {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Sample Cyber Risk Quantification (CRQ) Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Illustrative examples of quantified risk scenarios based on potential financial impact and likelihood.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scenario ID</TableHead>
              <TableHead>Threat Scenario</TableHead>
              <TableHead className="text-right">SLE (Est.)</TableHead>
              <TableHead className="text-right">ARO (Est.)</TableHead>
              <TableHead className="text-right">ALE (Est.)</TableHead>
              <TableHead>Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crqData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.scenario}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.sle)}</TableCell>
                <TableCell className="text-right">{item.aro.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                   <Badge variant={getAleBadgeVariant(item.ale)}>{formatCurrency(item.ale)}</Badge>
                </TableCell>
                <TableCell>{item.confidence}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
