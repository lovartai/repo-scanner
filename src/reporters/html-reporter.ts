import { writeFileSync } from 'fs';
import { RepoAnalysis } from '../types/index.js';
import { DuplicationInfo } from '../analyzers/code-analyzer.js';

export class HtmlReporter {
  generate(
    analysis: RepoAnalysis,
    duplicationInfo: Map<string, DuplicationInfo>,
    complexityInfo: Map<string, number>,
    outputPath?: string
  ): string {
    const enhancedFiles = analysis.files.map(file => ({
      ...file,
      duplication: duplicationInfo.get(file.path) || {
        duplicateLines: 0,
        duplicateBlocks: 0,
        duplicatePercentage: 0
      },
      complexity: complexityInfo.get(file.path) || 0
    }));

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repository Analysis Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        h1 {
            color: #2c3e50;
            margin: 0 0 10px 0;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #3498db;
        }
        .stat-label {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        table {
            width: 100%;
            background-color: #fff;
            border-collapse: collapse;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th {
            background-color: #3498db;
            color: white;
            padding: 12px;
            text-align: left;
            position: sticky;
            top: 0;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #ecf0f1;
        }
        tr:hover {
            background-color: #f8f9fa;
        }
        .high-value {
            color: #e74c3c;
            font-weight: bold;
        }
        .medium-value {
            color: #f39c12;
        }
        .low-value {
            color: #27ae60;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Repository Analysis Report</h1>
        <p>Repository: ${analysis.repositoryPath}</p>
        <p>Generated: ${analysis.analyzedAt.toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="stat-card">
            <div class="stat-value">${analysis.totalFiles}</div>
            <div class="stat-label">Total Files</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${analysis.totalCommits}</div>
            <div class="stat-label">Total Commits</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${enhancedFiles.reduce((sum, f) => sum + f.bugFixCount, 0)}</div>
            <div class="stat-label">Total Bug Fixes</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${Math.round(enhancedFiles.reduce((sum, f) => sum + f.duplication.duplicatePercentage, 0) / enhancedFiles.length)}%</div>
            <div class="stat-label">Avg Duplication</div>
        </div>
    </div>

    <h2>File Analysis</h2>
    <table>
        <thead>
            <tr>
                <th>File Path</th>
                <th>Modifications</th>
                <th>Bug Fixes</th>
                <th>Code Lines</th>
                <th>Duplication %</th>
                <th>Complexity</th>
                <th>Authors</th>
            </tr>
        </thead>
        <tbody>
            ${enhancedFiles
              .sort((a, b) => b.modificationFrequency - a.modificationFrequency)
              .map(file => `
                <tr>
                    <td>${file.path}</td>
                    <td class="${this.getValueClass(file.modificationFrequency, 50, 20)}">${file.modificationFrequency}</td>
                    <td class="${this.getValueClass(file.bugFixCount, 10, 5)}">${file.bugFixCount}</td>
                    <td>${file.metrics.codeLines}</td>
                    <td class="${this.getValueClass(file.duplication.duplicatePercentage, 30, 10)}">${file.duplication.duplicatePercentage}%</td>
                    <td class="${this.getValueClass(file.complexity, 20, 10)}">${file.complexity}</td>
                    <td>${file.authors.length}</td>
                </tr>
              `).join('')}
        </tbody>
    </table>
</body>
</html>
    `;

    if (outputPath) {
      writeFileSync(outputPath, htmlContent);
    }

    return htmlContent;
  }

  private getValueClass(value: number, highThreshold: number, mediumThreshold: number): string {
    if (value >= highThreshold) return 'high-value';
    if (value >= mediumThreshold) return 'medium-value';
    return 'low-value';
  }
}