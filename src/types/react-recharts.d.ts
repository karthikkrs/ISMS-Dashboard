/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
// This file provides TypeScript type definitions for Recharts components
// React import is needed for JSX typings even if not directly referenced
import React from 'react';

// Type definitions extend Recharts components with custom properties
declare module 'recharts' {
  // Area Chart component props
  export interface AreaProps {
    dataKey: string;
    stroke?: string;
    fill?: string;
    fillOpacity?: number;
    stackId?: string;
    connectNulls?: boolean;
    name?: string;
  }

  // Line Chart component props
  export interface LineProps {
    dataKey: string;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    dot?: boolean | object;
    name?: string;
  }

  // Bar Chart component props
  export interface BarProps {
    dataKey: string;
    fill?: string;
    stroke?: string;
    barSize?: number;
    maxBarSize?: number;
    name?: string;
  }

  // Custom interface for extended chart functionality
  // This empty interface is intentional for future extension
  export interface CustomChartProps {}
}
