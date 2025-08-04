import { readFileSync } from 'fs';
import { createHash } from 'crypto';

export interface DuplicationInfo {
  duplicateLines: number;
  duplicateBlocks: number;
  duplicatePercentage: number;
}

export class CodeAnalyzer {
  private fileContents: Map<string, string[]> = new Map();
  private hashToFiles: Map<string, string[]> = new Map();

  analyzeCodeDuplication(files: string[]): Map<string, DuplicationInfo> {
    const duplicationMap = new Map<string, DuplicationInfo>();
    
    // First pass: read all files and create line hashes
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        this.fileContents.set(file, lines);
        
        // Create hashes for code blocks (3-line sliding window)
        for (let i = 0; i <= lines.length - 3; i++) {
          const block = lines.slice(i, i + 3)
            .filter(line => line.trim().length > 0)
            .join('\n');
          
          if (block.length > 20) { // Only consider meaningful blocks
            const hash = this.hashBlock(block);
            if (!this.hashToFiles.has(hash)) {
              this.hashToFiles.set(hash, []);
            }
            this.hashToFiles.get(hash)!.push(`${file}:${i}`);
          }
        }
      } catch (err) {
        // Skip files that can't be read
        duplicationMap.set(file, {
          duplicateLines: 0,
          duplicateBlocks: 0,
          duplicatePercentage: 0
        });
      }
    }
    
    // Second pass: calculate duplication metrics
    for (const file of files) {
      const lines = this.fileContents.get(file);
      if (!lines) continue;
      
      let duplicateLines = new Set<number>();
      let duplicateBlocks = 0;
      
      for (let i = 0; i <= lines.length - 3; i++) {
        const block = lines.slice(i, i + 3)
          .filter(line => line.trim().length > 0)
          .join('\n');
        
        if (block.length > 20) {
          const hash = this.hashBlock(block);
          const occurrences = this.hashToFiles.get(hash) || [];
          
          // Check if this block appears elsewhere
          const otherOccurrences = occurrences.filter(occ => !occ.startsWith(`${file}:`));
          if (otherOccurrences.length > 0) {
            duplicateBlocks++;
            for (let j = i; j < i + 3; j++) {
              duplicateLines.add(j);
            }
          }
        }
      }
      
      const totalCodeLines = lines.filter(line => line.trim().length > 0).length;
      const duplicatePercentage = totalCodeLines > 0 
        ? (duplicateLines.size / totalCodeLines) * 100 
        : 0;
      
      duplicationMap.set(file, {
        duplicateLines: duplicateLines.size,
        duplicateBlocks,
        duplicatePercentage: Math.round(duplicatePercentage * 100) / 100
      });
    }
    
    return duplicationMap;
  }

  private hashBlock(block: string): string {
    // Normalize the block to ignore whitespace variations
    const normalized = block
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    
    return createHash('md5').update(normalized).digest('hex');
  }

  calculateCyclomaticComplexity(filePath: string): number {
    try {
      const content = readFileSync(filePath, 'utf-8');
      let complexity = 1; // Base complexity
      
      // Simple heuristic-based complexity calculation
      const patterns = [
        /\bif\b/g,
        /\belse\s+if\b/g,
        /\bwhile\b/g,
        /\bfor\b/g,
        /\bcase\b/g,
        /\bcatch\b/g,
        /\?\s*:/g, // ternary operator
        /&&/g, // logical AND
        /\|\|/g, // logical OR
      ];
      
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          complexity += matches.length;
        }
      }
      
      return complexity;
    } catch {
      return 0;
    }
  }
}