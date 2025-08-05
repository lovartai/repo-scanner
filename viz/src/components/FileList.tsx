import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, FileCode, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FileAnalysis, SortField, SortOrder } from '@/types';

interface FileListProps {
  files: FileAnalysis[];
}

export function FileList({ files }: FileListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('modificationFrequency');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showHeatmap, setShowHeatmap] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedFiles = useMemo(() => {
    const filtered = files.filter(file =>
      file.path.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'codeLines') {
        aValue = a.metrics.codeLines;
        bValue = b.metrics.codeLines;
      }

      if (sortField === 'lastModified') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [files, searchTerm, sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="inline w-3 h-3" /> : 
      <ChevronDown className="inline w-3 h-3" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate min and max values for heatmap
  const { minMax } = useMemo(() => {
    const result = {
      minMax: {
        modificationFrequency: { min: Infinity, max: -Infinity },
        bugFixCount: { min: Infinity, max: -Infinity },
        codeLines: { min: Infinity, max: -Infinity },
      }
    };

    files.forEach(file => {
      result.minMax.modificationFrequency.min = Math.min(result.minMax.modificationFrequency.min, file.modificationFrequency);
      result.minMax.modificationFrequency.max = Math.max(result.minMax.modificationFrequency.max, file.modificationFrequency);
      result.minMax.bugFixCount.min = Math.min(result.minMax.bugFixCount.min, file.bugFixCount);
      result.minMax.bugFixCount.max = Math.max(result.minMax.bugFixCount.max, file.bugFixCount);
      result.minMax.codeLines.min = Math.min(result.minMax.codeLines.min, file.metrics.codeLines);
      result.minMax.codeLines.max = Math.max(result.minMax.codeLines.max, file.metrics.codeLines);
    });

    return result;
  }, [files]);

  const getHeatmapColor = (value: number, field: 'modificationFrequency' | 'bugFixCount' | 'codeLines') => {
    if (!showHeatmap) return '';
    
    const min = minMax[field].min;
    const max = minMax[field].max;
    
    if (max === min) return '';
    
    const ratio = (value - min) / (max - min);
    const intensity = Math.round(ratio * 100);
    
    // Using red for high values (more modifications/bugs = more attention needed)
    if (field === 'modificationFrequency' || field === 'bugFixCount') {
      return `rgba(239, 68, 68, ${intensity / 100 * 0.3})`; // red with varying opacity
    }
    // Using blue for code lines (neutral metric)
    return `rgba(59, 130, 246, ${intensity / 100 * 0.3})`; // blue with varying opacity
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <label htmlFor="heatmap-toggle" className="text-sm text-muted-foreground">
            Heatmap
          </label>
          <Switch
            id="heatmap-toggle"
            checked={showHeatmap}
            onCheckedChange={setShowHeatmap}
          />
        </div>
      </div>

      <div className="rounded-md border h-[calc(100vh-500px)] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 w-2/5 whitespace-nowrap"
                onClick={() => handleSort('path')}
              >
                File Path <SortIcon field="path" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right w-24 whitespace-nowrap"
                onClick={() => handleSort('modificationFrequency')}
              >
                Mods <SortIcon field="modificationFrequency" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right w-20 whitespace-nowrap"
                onClick={() => handleSort('bugFixCount')}
              >
                Bugs <SortIcon field="bugFixCount" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right w-20 whitespace-nowrap"
                onClick={() => handleSort('codeLines')}
              >
                LOC <SortIcon field="codeLines" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right w-32 whitespace-nowrap"
                onClick={() => handleSort('lastModified')}
              >
                Last Modified <SortIcon field="lastModified" />
              </TableHead>
              <TableHead className="text-right w-16 whitespace-nowrap">
                Auth
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedFiles.map((file) => (
              <TableRow key={file.path}>
                <TableCell className="font-mono">
                  <div className="flex items-center gap-1">
                    <FileCode className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{file.path}</span>
                  </div>
                </TableCell>
                <TableCell 
                  className="text-right"
                  style={{ backgroundColor: getHeatmapColor(file.modificationFrequency, 'modificationFrequency') }}
                >
                  {file.modificationFrequency}
                </TableCell>
                <TableCell 
                  className="text-right"
                  style={{ backgroundColor: getHeatmapColor(file.bugFixCount, 'bugFixCount') }}
                >
                  {file.bugFixCount}
                </TableCell>
                <TableCell 
                  className="text-right"
                  style={{ backgroundColor: getHeatmapColor(file.metrics.codeLines, 'codeLines') }}
                >
                  {file.metrics.codeLines}
                </TableCell>
                <TableCell className="text-right">{formatDate(file.lastModified)}</TableCell>
                <TableCell className="text-right">{file.authors.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}