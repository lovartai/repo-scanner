import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, FileCode, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FileAnalysis, SortField, SortOrder } from '@/types';

interface FileListProps {
  files: FileAnalysis[];
}

export function FileList({ files }: FileListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('modificationFrequency');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showHeatmap, setShowHeatmap] = useState(false);

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef<'left' | 'right' | null>(null);

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

      if (sortField === 'authors') {
        aValue = a.authors.length;
        bValue = b.authors.length;
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

  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedFiles.length,
    getScrollElement: () => rightScrollRef.current,
    estimateSize: () => 24,
    overscan: 10,
  });

  // Sync scroll between left and right sections
  useEffect(() => {
    const leftEl = leftScrollRef.current;
    const rightEl = rightScrollRef.current;

    if (!leftEl || !rightEl) return;

    const handleLeftScroll = () => {
      if (isScrollingRef.current === 'right') return;
      isScrollingRef.current = 'left';
      rightEl.scrollTop = leftEl.scrollTop;
      setTimeout(() => { isScrollingRef.current = null; }, 10);
    };

    const handleRightScroll = () => {
      if (isScrollingRef.current === 'left') return;
      isScrollingRef.current = 'right';
      leftEl.scrollTop = rightEl.scrollTop;
      setTimeout(() => { isScrollingRef.current = null; }, 10);
    };

    leftEl.addEventListener('scroll', handleLeftScroll);
    rightEl.addEventListener('scroll', handleRightScroll);

    return () => {
      leftEl.removeEventListener('scroll', handleLeftScroll);
      rightEl.removeEventListener('scroll', handleRightScroll);
    };
  }, []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="inline w-3 h-3" /> : 
      <ChevronDown className="inline w-3 h-3" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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
    
    if (field === 'modificationFrequency' || field === 'bugFixCount') {
      return `rgba(239, 68, 68, ${intensity / 100 * 0.3})`;
    }
    return `rgba(59, 130, 246, ${intensity / 100 * 0.3})`;
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

      <div className="rounded-md border overflow-hidden flex">
        {/* Left section - File Path (scrollable horizontally) */}
        <div className="w-[40%] border-r">
          <div className="sticky top-0 bg-background z-10 border-b">
            <div 
              className="py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 overflow-x-auto whitespace-nowrap"
              onClick={() => handleSort('path')}
            >
              File Path <SortIcon field="path" />
            </div>
          </div>
          <div
            ref={leftScrollRef}
            className="h-[calc(100vh-500px)] overflow-y-auto overflow-x-auto"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const file = filteredAndSortedFiles[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="py-1 px-2 text-xs border-b hover:bg-muted/50 font-mono whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <FileCode className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span>{file.path}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right section - Other columns (fixed) */}
        <div className="flex-1">
          <div className="sticky top-0 bg-background z-10 border-b">
            <div className="flex text-xs font-medium text-muted-foreground">
              <div 
                className="w-24 py-2 px-2 text-right cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('modificationFrequency')}
              >
                Mods <SortIcon field="modificationFrequency" />
              </div>
              <div 
                className="w-20 py-2 px-2 text-right cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('bugFixCount')}
              >
                Bugs <SortIcon field="bugFixCount" />
              </div>
              <div 
                className="w-20 py-2 px-2 text-right cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('codeLines')}
              >
                LOC <SortIcon field="codeLines" />
              </div>
              <div 
                className="w-32 py-2 px-2 text-right cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('lastModified')}
              >
                Last Modified <SortIcon field="lastModified" />
              </div>
              <div 
                className="w-16 py-2 px-2 text-right cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('authors')}
              >
                Auth <SortIcon field="authors" />
              </div>
            </div>
          </div>
          <div
            ref={rightScrollRef}
            className="h-[calc(100vh-500px)] overflow-auto"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const file = filteredAndSortedFiles[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="flex text-xs border-b hover:bg-muted/50"
                  >
                    <div 
                      className="w-24 py-1 px-2 text-right"
                      style={{ backgroundColor: getHeatmapColor(file.modificationFrequency, 'modificationFrequency') }}
                    >
                      {file.modificationFrequency}
                    </div>
                    <div 
                      className="w-20 py-1 px-2 text-right"
                      style={{ backgroundColor: getHeatmapColor(file.bugFixCount, 'bugFixCount') }}
                    >
                      {file.bugFixCount}
                    </div>
                    <div 
                      className="w-20 py-1 px-2 text-right"
                      style={{ backgroundColor: getHeatmapColor(file.metrics.codeLines, 'codeLines') }}
                    >
                      {file.metrics.codeLines}
                    </div>
                    <div className="w-32 py-1 px-2 text-right">
                      {formatDate(file.lastModified)}
                    </div>
                    <div className="w-16 py-1 px-2 text-right">
                      {file.authors.length}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}