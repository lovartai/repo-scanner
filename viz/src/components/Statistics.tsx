import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, GitBranch, Bug, Code, Users, Calendar } from 'lucide-react';
import type { RepoAnalysis } from '@/types';

interface StatisticsProps {
  data: RepoAnalysis;
}

export function Statistics({ data }: StatisticsProps) {
  const totalModifications = data.files.reduce(
    (sum, file) => sum + file.modificationFrequency, 
    0
  );
  
  const totalBugFixes = data.files.reduce(
    (sum, file) => sum + file.bugFixCount, 
    0
  );
  
  const totalCodeLines = data.files.reduce(
    (sum, file) => sum + file.metrics.codeLines, 
    0
  );
  
  const uniqueAuthors = new Set(
    data.files.flatMap(file => file.authors)
  ).size;

  const avgModificationsPerFile = data.totalFiles > 0 
    ? (totalModifications / data.totalFiles).toFixed(1) 
    : '0';

  const avgBugFixesPerFile = data.totalFiles > 0 
    ? (totalBugFixes / data.totalFiles).toFixed(2) 
    : '0';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const stats = [
    {
      title: 'Total Files',
      value: data.totalFiles.toLocaleString(),
      icon: FileText,
      description: 'Files analyzed'
    },
    {
      title: 'Total Commits',
      value: data.totalCommits.toLocaleString(),
      icon: GitBranch,
      description: 'Repository commits'
    },
    {
      title: 'Total Modifications',
      value: totalModifications.toLocaleString(),
      icon: Code,
      description: `Avg ${avgModificationsPerFile} per file`
    },
    {
      title: 'Bug Fixes',
      value: totalBugFixes.toLocaleString(),
      icon: Bug,
      description: `Avg ${avgBugFixesPerFile} per file`
    },
    {
      title: 'Lines of Code',
      value: totalCodeLines.toLocaleString(),
      icon: Code,
      description: 'Total code lines'
    },
    {
      title: 'Contributors',
      value: uniqueAuthors.toLocaleString(),
      icon: Users,
      description: 'Unique authors'
    }
  ];

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4" />
            Analysis Information
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="space-y-1 text-xs">
            <p><strong>Repository:</strong> {data.repositoryPath}</p>
            <p><strong>Analyzed at:</strong> {formatDate(data.analyzedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-lg font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}