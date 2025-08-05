import React, { useState } from 'react';
import { DataImport } from '@/components/DataImport';
import { Statistics } from '@/components/Statistics';
import { FileList } from '@/components/FileListVirtual';
import { Charts } from '@/components/Charts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RepoAnalysis } from '@/types';
import { GitBranch } from 'lucide-react';

function App() {
  const [data, setData] = useState<RepoAnalysis | null>(null);

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <GitBranch className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Repo Scanner Visualizer</h1>
            <p className="text-muted-foreground mt-2">
              Visualize your repository analysis data
            </p>
          </div>
          <DataImport onDataLoad={setData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <header className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Repo Scanner Visualizer</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Comprehensive analysis of code modifications and metrics
          </p>
        </header>

        <Statistics data={data} />

        <Tabs defaultValue="files" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="files">File Analysis</TabsTrigger>
            <TabsTrigger value="charts">Visualizations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="files" className="mt-4">
            <FileList files={data.files} />
          </TabsContent>
          
          <TabsContent value="charts" className="mt-4">
            <Charts files={data.files} />
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center">
          <button
            onClick={() => setData(null)}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Load different data
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;