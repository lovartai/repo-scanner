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

    // Calculate statistics
    const totalBugFixes = enhancedFiles.reduce((sum, f) => sum + f.bugFixCount, 0);
    const totalCodeLines = enhancedFiles.reduce((sum, f) => sum + f.metrics.codeLines, 0);
    const totalModifications = enhancedFiles.reduce((sum, f) => sum + f.modificationFrequency, 0);
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repository Analysis Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #1a1a1a;
            background: #f0f2f5;
            padding: 10px;
        }
        .header {
            background: #fff;
            border: 1px solid #ddd;
            padding: 15px 20px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        h1 {
            font-size: 18px;
            font-weight: 600;
            color: #111;
        }
        .meta {
            color: #666;
            font-size: 11px;
            text-align: right;
        }
        .stats {
            display: flex;
            gap: 20px;
            background: #fff;
            border: 1px solid #ddd;
            padding: 10px 20px;
            margin-bottom: 10px;
            font-size: 11px;
        }
        .stat {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .stat-label {
            color: #666;
        }
        .stat-value {
            font-weight: 600;
            color: #2563eb;
        }
        .table-container {
            background: #fff;
            border: 1px solid #ddd;
            overflow: hidden;
        }
        .table-header {
            padding: 10px 15px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8f9fa;
        }
        .table-title {
            font-size: 14px;
            font-weight: 600;
        }
        .table-info {
            font-size: 11px;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        th {
            background: #f8f9fa;
            padding: 6px 8px;
            text-align: left;
            font-weight: 600;
            color: #555;
            border-bottom: 2px solid #e0e0e0;
            cursor: pointer;
            user-select: none;
            white-space: nowrap;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        th:hover {
            background: #e9ecef;
        }
        th.sortable:after {
            content: ' ↕';
            opacity: 0.3;
            font-size: 10px;
        }
        th.sorted-asc:after {
            content: ' ↑';
            opacity: 1;
        }
        th.sorted-desc:after {
            content: ' ↓';
            opacity: 1;
        }
        td {
            padding: 4px 8px;
            border-bottom: 1px solid #f0f0f0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .path-cell {
            font-family: Consolas, Monaco, monospace;
            font-size: 10px;
            color: #444;
            max-width: 400px;
        }
        .number-cell {
            text-align: right;
            font-family: 'SF Mono', Consolas, monospace;
            font-size: 10px;
        }
        .center-cell {
            text-align: center;
        }
        .high { color: #dc2626; font-weight: 600; }
        .medium { color: #d97706; }
        .low { color: #059669; }
        .zero { color: #999; }
        .date-cell {
            font-size: 10px;
            color: #666;
        }
        .authors-cell {
            font-size: 10px;
            color: #666;
            max-width: 200px;
        }
        .table-wrapper {
            overflow-x: auto;
            max-height: calc(100vh - 200px);
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>Repository Analysis Report</h1>
            <div style="font-size: 11px; color: #666; margin-top: 4px;">${analysis.repositoryPath}</div>
        </div>
        <div class="meta">
            Generated: ${analysis.analyzedAt.toLocaleString()}<br>
            ${analysis.totalFiles} files • ${analysis.totalCommits} commits
        </div>
    </div>

    <div class="stats">
        <div class="stat">
            <span class="stat-label">Total Lines:</span>
            <span class="stat-value">${totalCodeLines.toLocaleString()}</span>
        </div>
        <div class="stat">
            <span class="stat-label">Total Changes:</span>
            <span class="stat-value">${totalModifications.toLocaleString()}</span>
        </div>
        <div class="stat">
            <span class="stat-label">Total Bug Fixes:</span>
            <span class="stat-value">${totalBugFixes.toLocaleString()}</span>
        </div>
        <div class="stat">
            <span class="stat-label">Avg Duplication:</span>
            <span class="stat-value">${enhancedFiles.length > 0 ? Math.round(enhancedFiles.reduce((sum, f) => sum + f.duplication.duplicatePercentage, 0) / enhancedFiles.length) : 0}%</span>
        </div>
        <div class="stat">
            <span class="stat-label">Avg Complexity:</span>
            <span class="stat-value">${enhancedFiles.length > 0 ? (enhancedFiles.reduce((sum, f) => sum + f.complexity, 0) / enhancedFiles.length).toFixed(1) : 0}</span>
        </div>
    </div>

    <div class="table-container">
        <div class="table-header">
            <div class="table-title">File Analysis Details</div>
            <div class="table-info">Click column headers to sort</div>
        </div>
        <div class="table-wrapper">
            <table id="dataTable">
                <thead>
                    <tr>
                        <th class="sortable" data-sort="path">File Path</th>
                        <th class="sortable sorted-desc" data-sort="modificationFrequency" style="text-align: right">Changes</th>
                        <th class="sortable" data-sort="bugFixCount" style="text-align: right">Bugs</th>
                        <th class="sortable" data-sort="metrics.lines" style="text-align: right">Lines</th>
                        <th class="sortable" data-sort="metrics.codeLines" style="text-align: right">Code</th>
                        <th class="sortable" data-sort="metrics.commentLines" style="text-align: right">Comments</th>
                        <th class="sortable" data-sort="duplication.duplicatePercentage" style="text-align: right">Dup%</th>
                        <th class="sortable" data-sort="duplication.duplicateLines" style="text-align: right">Dup Lines</th>
                        <th class="sortable" data-sort="complexity" style="text-align: right">Complex</th>
                        <th class="sortable" data-sort="authors.length" style="text-align: center">Authors</th>
                        <th class="sortable" data-sort="firstCommit">First Commit</th>
                        <th class="sortable" data-sort="lastModified">Last Modified</th>
                    </tr>
                </thead>
                <tbody>
                    ${enhancedFiles
                      .sort((a, b) => b.modificationFrequency - a.modificationFrequency)
                      .map(file => `
                        <tr data-file='${JSON.stringify(file).replace(/'/g, '&apos;')}'>
                            <td class="path-cell" title="${file.path}">${file.path}</td>
                            <td class="number-cell ${this.getValueClass(file.modificationFrequency, 50, 20)}">${file.modificationFrequency}</td>
                            <td class="number-cell ${file.bugFixCount > 0 ? this.getValueClass(file.bugFixCount, 10, 5) : 'zero'}">${file.bugFixCount}</td>
                            <td class="number-cell">${file.metrics.lines.toLocaleString()}</td>
                            <td class="number-cell">${file.metrics.codeLines.toLocaleString()}</td>
                            <td class="number-cell ${file.metrics.commentLines === 0 ? 'zero' : ''}">${file.metrics.commentLines}</td>
                            <td class="number-cell ${file.duplication.duplicatePercentage > 0 ? this.getValueClass(file.duplication.duplicatePercentage, 30, 10) : 'zero'}">${file.duplication.duplicatePercentage}%</td>
                            <td class="number-cell ${file.duplication.duplicateLines === 0 ? 'zero' : ''}">${file.duplication.duplicateLines}</td>
                            <td class="number-cell ${this.getValueClass(file.complexity, 20, 10)}">${file.complexity}</td>
                            <td class="center-cell ${file.authors.length > 3 ? 'high' : file.authors.length > 1 ? 'medium' : ''}">${file.authors.length}</td>
                            <td class="date-cell">${file.firstCommit.toLocaleDateString()}</td>
                            <td class="date-cell">${file.lastModified.toLocaleDateString()}</td>
                        </tr>
                      `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Sorting functionality
        let currentSort = { column: 'modificationFrequency', order: 'desc' };
        const tbody = document.querySelector('#dataTable tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.sort;
                const wasActive = th.classList.contains('sorted-asc') || th.classList.contains('sorted-desc');
                
                // Remove all sort classes
                document.querySelectorAll('th').forEach(h => {
                    h.classList.remove('sorted-asc', 'sorted-desc');
                });
                
                // Determine new sort order
                if (wasActive && currentSort.order === 'desc') {
                    currentSort.order = 'asc';
                    th.classList.add('sorted-asc');
                } else {
                    currentSort.order = 'desc';
                    th.classList.add('sorted-desc');
                }
                
                currentSort.column = column;
                
                // Sort rows
                const sortedRows = rows.sort((a, b) => {
                    const aData = JSON.parse(a.dataset.file);
                    const bData = JSON.parse(b.dataset.file);
                    
                    let aVal = column.split('.').reduce((obj, key) => obj[key], aData);
                    let bVal = column.split('.').reduce((obj, key) => obj[key], bData);
                    
                    // Handle dates
                    if (column === 'firstCommit' || column === 'lastModified') {
                        aVal = new Date(aVal).getTime();
                        bVal = new Date(bVal).getTime();
                    }
                    
                    // Handle strings
                    if (typeof aVal === 'string') {
                        return currentSort.order === 'asc' 
                            ? aVal.localeCompare(bVal)
                            : bVal.localeCompare(aVal);
                    }
                    
                    // Handle numbers
                    return currentSort.order === 'asc' ? aVal - bVal : bVal - aVal;
                });
                
                // Re-append sorted rows
                sortedRows.forEach(row => tbody.appendChild(row));
            });
        });
    </script>
</body>
</html>
    `;

    if (outputPath) {
      writeFileSync(outputPath, htmlContent);
    }

    return htmlContent;
  }

  private getValueClass(value: number, highThreshold: number, mediumThreshold: number): string {
    if (value >= highThreshold) return 'high';
    if (value >= mediumThreshold) return 'medium';
    return 'low';
  }
}