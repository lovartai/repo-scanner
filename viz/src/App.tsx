import React, { useState, useEffect } from 'react';
import { DataImport } from '@/components/DataImport';
import { Statistics } from '@/components/Statistics';
import { FileList } from '@/components/FileListVirtual';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RepoAnalysis } from '@/types';
import { GitBranch } from 'lucide-react';

const STORAGE_KEY = 'repo-scanner-data';
const HEATMAP_STORAGE_KEY = 'repo-scanner-heatmap';

function App() {
  const [data, setData] = useState<RepoAnalysis | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
      } catch (error) {
        console.error('加载本地数据失败:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    
    // 加载 heatmap 状态
    const savedHeatmap = localStorage.getItem(HEATMAP_STORAGE_KEY);
    if (savedHeatmap === 'true') {
      setShowHeatmap(true);
    }
  }, []);

  // 处理 heatmap 状态变化
  const handleHeatmapChange = (value: boolean) => {
    setShowHeatmap(value);
    localStorage.setItem(HEATMAP_STORAGE_KEY, value.toString());
  };

  // 处理数据加载
  const handleDataLoad = (newData: RepoAnalysis) => {
    setData(newData);
    // 保存到 localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('保存数据到本地失败:', error);
    }
  };

  // 清除数据
  const clearData = () => {
    setData(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HEATMAP_STORAGE_KEY);
    setShowHeatmap(false);
  };

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
          <DataImport onDataLoad={handleDataLoad} />
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
          <TabsContent value="files" className="mt-4">
            <FileList 
              files={data.files} 
              showHeatmap={showHeatmap}
              onHeatmapChange={handleHeatmapChange}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center">
          <button
            onClick={clearData}
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