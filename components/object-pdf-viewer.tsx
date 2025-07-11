"use client";

import { useState, useEffect } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

interface ObjectPdfViewerProps {
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export default function ObjectPdfViewer({
  url,
  onLoad,
  onError,
  className = "w-full h-full"
}: ObjectPdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when url changes
    setIsLoading(true);
    setError(null);
    
    // Give a little time for the object to potentially load
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (onLoad) onLoad();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [url, onLoad]);

  const handleObjectError = () => {
    setIsLoading(false);
    const errorMsg = "Failed to load document";
    setError(errorMsg);
    if (onError) onError(new Error(errorMsg));
  };
  
  const openInNewTab = () => {
    window.open(url, "_blank");
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Memuat dokumen...</p>
          </div>
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6">
            <p className="text-destructive mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openInNewTab}
              className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Buka di Tab Baru
            </Button>
          </div>
        </div>
      ) : (
        <object
          data={url}
          type="application/pdf"
          className={`w-full h-full border-0 ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}
          onError={handleObjectError}
        >
          <div className="h-full flex flex-col items-center justify-center p-8">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Browser Anda tidak dapat menampilkan dokumen PDF secara langsung.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openInNewTab}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Buka di Tab Baru
            </Button>
          </div>
        </object>
      )}
    </div>
  );
}
