import { writeFileSync } from 'fs';
import { RepoAnalysis, FileAnalysis } from '../types/index.js';
import { DuplicationInfo } from '../analyzers/code-analyzer.js';

export class JsonReporter {
  generate(
    analysis: RepoAnalysis, 
    duplicationInfo: Map<string, DuplicationInfo>,
    complexityInfo: Map<string, number>,
    outputPath?: string
  ): string {
    // Enhance file analysis with duplication and complexity info
    const enhancedFiles = analysis.files.map(file => ({
      ...file,
      duplication: duplicationInfo.get(file.path) || {
        duplicateLines: 0,
        duplicateBlocks: 0,
        duplicatePercentage: 0
      },
      cyclomaticComplexity: complexityInfo.get(file.path) || 0
    }));

    const report = {
      ...analysis,
      files: enhancedFiles,
      summary: this.generateSummary(enhancedFiles)
    };

    const jsonContent = JSON.stringify(report, null, 2);

    if (outputPath) {
      writeFileSync(outputPath, jsonContent);
    }

    return jsonContent;
  }

  private generateSummary(files: any[]): any {
    const totalFiles = files.length;
    const totalModifications = files.reduce((sum, f) => sum + f.modificationFrequency, 0);
    const totalBugFixes = files.reduce((sum, f) => sum + f.bugFixCount, 0);
    const totalLines = files.reduce((sum, f) => sum + f.metrics.lines, 0);
    const totalCodeLines = files.reduce((sum, f) => sum + f.metrics.codeLines, 0);
    const avgDuplication = files.reduce((sum, f) => sum + f.duplication.duplicatePercentage, 0) / totalFiles;
    const avgComplexity = files.reduce((sum, f) => sum + f.cyclomaticComplexity, 0) / totalFiles;

    // Find most modified files
    const mostModified = [...files]
      .sort((a, b) => b.modificationFrequency - a.modificationFrequency)
      .slice(0, 10)
      .map(f => ({ path: f.path, modifications: f.modificationFrequency }));

    // Find files with most bug fixes
    const mostBugFixes = [...files]
      .sort((a, b) => b.bugFixCount - a.bugFixCount)
      .slice(0, 10)
      .map(f => ({ path: f.path, bugFixes: f.bugFixCount }));

    // Find files with highest duplication
    const highestDuplication = [...files]
      .sort((a, b) => b.duplication.duplicatePercentage - a.duplication.duplicatePercentage)
      .slice(0, 10)
      .map(f => ({ path: f.path, duplicationPercentage: f.duplication.duplicatePercentage }));

    // Find most complex files
    const mostComplex = [...files]
      .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
      .slice(0, 10)
      .map(f => ({ path: f.path, complexity: f.cyclomaticComplexity }));

    return {
      totalFiles,
      totalModifications,
      totalBugFixes,
      totalLines,
      totalCodeLines,
      averageDuplicationPercentage: Math.round(avgDuplication * 100) / 100,
      averageComplexity: Math.round(avgComplexity * 100) / 100,
      topLists: {
        mostModified,
        mostBugFixes,
        highestDuplication,
        mostComplex
      }
    };
  }
}