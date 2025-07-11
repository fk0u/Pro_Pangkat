"use client";

import { useState, useEffect } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface SecureDocumentViewerProps {
  documentId: string;
  className?: string;
}

export default function SecureDocumentViewer({
  documentId,
  className = 'w-full h-full min-h-[500px]'
}: SecureDocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  
  // Use the standalone document viewer page
  const viewerUrl = `/document-viewer?id=${documentId}`;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [documentId]);
  
  const openInNewTab = () => {
    window.open(`/api/documents/${documentId}/preview`, '_blank');
  };
  
  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10 dark:bg-slate-800/50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 dark:text-slate-200" />
            <p className="dark:text-slate-200">Memuat dokumen...</p>
          </div>
        </div>
      )}
      
      <iframe 
        src={viewerUrl}
        className="w-full h-full border-0 rounded-md bg-white dark:bg-slate-800"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-presentation"
        allow="fullscreen"
        title="Document Viewer"
      />
      
      <div className="absolute bottom-4 right-4 z-20">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={openInNewTab}
          className="shadow-md dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Buka di Tab Baru
        </Button>
      </div>
    </div>
  );
}
