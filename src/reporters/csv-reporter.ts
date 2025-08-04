import { writeFileSync } from 'fs';
import { RepoAnalysis } from '../types/index.js';
import { DuplicationInfo } from '../analyzers/code-analyzer.js';

export class CsvReporter {
  generate(
    analysis: RepoAnalysis,
    duplicationInfo: Map<string, DuplicationInfo>,
    complexityInfo: Map<string, number>,
    outputPath?: string
  ): string {
    const headers = [
      'File Path',
      'Modification Frequency',
      'Bug Fix Count',
      'Total Lines',
      'Code Lines',
      'Comment Lines',
      'Blank Lines',
      'Duplicate Lines',
      'Duplicate Blocks',
      'Duplication %',
      'Cyclomatic Complexity',
      'Authors',
      'First Commit',
      'Last Modified'
    ].join(',');

    const rows = analysis.files.map(file => {
      const duplication = duplicationInfo.get(file.path) || {
        duplicateLines: 0,
        duplicateBlocks: 0,
        duplicatePercentage: 0
      };
      const complexity = complexityInfo.get(file.path) || 0;

      return [
        `"${file.path}"`,
        file.modificationFrequency,
        file.bugFixCount,
        file.metrics.lines,
        file.metrics.codeLines,
        file.metrics.commentLines,
        file.metrics.blankLines,
        duplication.duplicateLines,
        duplication.duplicateBlocks,
        duplication.duplicatePercentage,
        complexity,
        `"${file.authors.join('; ')}"`,
        file.firstCommit.toISOString(),
        file.lastModified.toISOString()
      ].join(',');
    });

    const csvContent = [headers, ...rows].join('\n');

    if (outputPath) {
      writeFileSync(outputPath, csvContent);
    }

    return csvContent;
  }
}