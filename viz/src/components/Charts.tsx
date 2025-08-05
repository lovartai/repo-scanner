import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FileAnalysis } from '@/types';

interface ChartsProps {
  files: FileAnalysis[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function Charts({ files }: ChartsProps) {
  // Top 10 most modified files
  const topModifiedFiles = useMemo(() => {
    return [...files]
      .sort((a, b) => b.modificationFrequency - a.modificationFrequency)
      .slice(0, 10)
      .map(file => ({
        name: file.path.split('/').pop() || file.path,
        fullPath: file.path,
        modifications: file.modificationFrequency,
        bugFixes: file.bugFixCount,
      }));
  }, [files]);

  // File distribution by extension
  const fileDistribution = useMemo(() => {
    const extensionCount: Record<string, number> = {};
    
    files.forEach(file => {
      const ext = file.path.split('.').pop() || 'other';
      extensionCount[ext] = (extensionCount[ext] || 0) + 1;
    });

    return Object.entries(extensionCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [files]);

  // Bug fix distribution
  const bugFixDistribution = useMemo(() => {
    const ranges = [
      { name: '0 fixes', min: 0, max: 0 },
      { name: '1-5 fixes', min: 1, max: 5 },
      { name: '6-10 fixes', min: 6, max: 10 },
      { name: '11-20 fixes', min: 11, max: 20 },
      { name: '20+ fixes', min: 21, max: Infinity },
    ];

    return ranges.map(range => ({
      name: range.name,
      value: files.filter(
        file => file.bugFixCount >= range.min && file.bugFixCount <= range.max
      ).length,
    }));
  }, [files]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded p-2 shadow-lg">
          <p className="text-sm font-medium">{label || data.name}</p>
          {data.fullPath && (
            <p className="text-xs text-muted-foreground truncate max-w-xs">
              {data.fullPath}
            </p>
          )}
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Most Modified Files</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topModifiedFiles}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="modifications" fill="#0088FE" name="Modifications" />
              <Bar dataKey="bugFixes" fill="#00C49F" name="Bug Fixes" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>File Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fileDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fileDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bug Fix Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bugFixDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#FF8042" name="Files" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}