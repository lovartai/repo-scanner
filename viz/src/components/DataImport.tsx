import React, { ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { RepoAnalysis } from '@/types';

interface DataImportProps {
  onDataLoad: (data: RepoAnalysis) => void;
}

export function DataImport({ onDataLoad }: DataImportProps) {
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        onDataLoad(json);
      } catch (error) {
        alert('解析 JSON 文件出错。请确保这是有效的 repo-scanner 输出文件。');
        console.error('JSON parse error:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-12">
        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">导入分析数据</h2>
        <p className="text-muted-foreground text-center mb-6">
          上传由 repo-scanner 生成的 JSON 文件以可视化分析结果
        </p>
        <Button asChild>
          <label htmlFor="file-upload" className="cursor-pointer">
            选择 JSON 文件
            <input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </Button>
      </CardContent>
    </Card>
  );
}