import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, FileCode } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search files..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border max-h-[500px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 w-2/5"
                onClick={() => handleSort('path')}
              >
                File Path <SortIcon field="path" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right w-24"
                onClick={() => handleSort('modificationFrequency')}
              >
                Mods <SortIcon field="modificationFrequency" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right w-20"
                onClick={() => handleSort('bugFixCount')}
              >
                Bugs <SortIcon field="bugFixCount" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right w-20"
                onClick={() => handleSort('codeLines')}
              >
                LOC <SortIcon field="codeLines" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right w-28"
                onClick={() => handleSort('lastModified')}
              >
                Last Modified <SortIcon field="lastModified" />
              </TableHead>
              <TableHead className="text-right w-16">
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
                <TableCell className="text-right">{file.modificationFrequency}</TableCell>
                <TableCell className="text-right">{file.bugFixCount}</TableCell>
                <TableCell className="text-right">{file.metrics.codeLines}</TableCell>
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