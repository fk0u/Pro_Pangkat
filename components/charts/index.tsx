"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts'

interface ChartData {
  [key: string]: any;
}

export interface BarChartProps {
  data: ChartData[];
  index: string;
  categories: string[];
  colors?: string[];
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
  yAxisWidth?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  index,
  categories,
  colors = ["#6366f1"],
  showLegend = true,
  valueFormatter = (value) => `${value}`,
  yAxisWidth = 40
}) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
        <XAxis dataKey={index} tick={{ fontSize: 12 }} />
        <YAxis width={yAxisWidth} tick={{ fontSize: 12 }} tickFormatter={valueFormatter} />
        <Tooltip formatter={(value) => valueFormatter(value as number)} />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Bar 
            key={category} 
            dataKey={category} 
            fill={colors[i % colors.length]} 
            name={category}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

export interface PieChartProps {
  data: ChartData[];
  index: string;
  category: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showTooltip?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  index,
  category,
  colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"],
  valueFormatter = (value) => `${value}`,
  showTooltip = true,
  showLabel = true,
  className
}) => {
  return (
    <div className={className || "h-72"}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            nameKey={index}
            dataKey={category}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={showLabel ? ({name, value}) => `${name}: ${valueFormatter(value)}` : undefined}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          {showTooltip && (
            <Tooltip 
              formatter={(value) => valueFormatter(value as number)} 
            />
          )}
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}

export interface DonutChartProps extends PieChartProps {}

export const DonutChart: React.FC<DonutChartProps> = (props) => {
  return (
    <div className={props.className || "h-72"}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={props.data}
            nameKey={props.index}
            dataKey={props.category}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            label={props.showLabel ? ({name, value}) => `${name}: ${props.valueFormatter ? props.valueFormatter(value as number) : value}` : undefined}
          >
            {props.data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={props.colors ? props.colors[index % props.colors.length] : '#8884d8'} />
            ))}
          </Pie>
          {props.showTooltip && (
            <Tooltip 
              formatter={(value) => props.valueFormatter ? props.valueFormatter(value as number) : value} 
            />
          )}
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
