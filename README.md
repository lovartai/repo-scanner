# Repo Scanner

A powerful tool to analyze git repositories for code modification frequency, bug fixes, and code metrics.

## Features

- **Git History Analysis**: Track modification frequency and bug fix counts for each file
- **Code Metrics**: Calculate lines of code, comments, and blank lines
- **Code Duplication Detection**: Identify duplicate code blocks across files
- **Cyclomatic Complexity**: Measure code complexity for better maintainability insights
- **Multiple Output Formats**: Generate reports in JSON, CSV, or HTML format
- **Customizable Analysis**: Configure file extensions, exclude paths, and bug keywords

## Installation

```bash
npm install -g repo-scanner
```

Or run locally:

```bash
cd ~/repo-scanner
npm install
npm run build
npm link
```

## Usage

### Basic Usage

Scan the current directory:
```bash
repo-scanner scan
```

Scan a specific repository:
```bash
repo-scanner scan /path/to/repository
```

### Output Options

Generate JSON report (default):
```bash
repo-scanner scan -o report.json
```

Generate CSV report:
```bash
repo-scanner scan -f csv -o report.csv
```

Generate HTML report:
```bash
repo-scanner scan -f html -o report.html
```

### Advanced Options

Specify file extensions to analyze:
```bash
repo-scanner scan -e "js,ts,py,java"
```

Exclude specific paths:
```bash
repo-scanner scan -x "node_modules,vendor,dist"
```

Customize bug fix keywords:
```bash
repo-scanner scan -k "fix,bug,patch,hotfix"
```

## Output Format

### JSON Output Structure

```json
{
  "repositoryPath": "/path/to/repo",
  "analyzedAt": "2024-01-01T00:00:00.000Z",
  "totalCommits": 1234,
  "totalFiles": 100,
  "files": [{
    "path": "src/index.js",
    "modificationFrequency": 45,
    "bugFixCount": 12,
    "metrics": {
      "lines": 500,
      "codeLines": 400,
      "commentLines": 50,
      "blankLines": 50
    },
    "duplication": {
      "duplicateLines": 20,
      "duplicateBlocks": 3,
      "duplicatePercentage": 5.0
    },
    "cyclomaticComplexity": 15
  }],
  "summary": {
    "totalFiles": 100,
    "totalModifications": 5000,
    "totalBugFixes": 300,
    "averageDuplicationPercentage": 8.5,
    "averageComplexity": 10.2,
    "topLists": {
      "mostModified": [...],
      "mostBugFixes": [...],
      "highestDuplication": [...],
      "mostComplex": [...]
    }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev scan /path/to/repo

# Build
npm run build

# Run tests
npm test
```

## License

MIT