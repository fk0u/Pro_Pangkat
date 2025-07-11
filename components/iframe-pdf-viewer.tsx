"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface IframePdfViewerProps {
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export default function IframePdfViewer({
  url,
  onLoad,
  onError,
  className = "w-full h-full"
}: IframePdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when url changes
    setIsLoading(true);
    setError(null);
  }, [url]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleIframeError = () => {
    setIsLoading(false);
    const errorMsg = "Failed to load document";
    setError(errorMsg);
    if (onError) onError(new Error(errorMsg));
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
            <p className="text-sm text-muted-foreground">
              Coba buka dokumen di tab baru
            </p>
          </div>
        </div>
      ) : (
        <iframe 
          src={url}
          className={`w-full h-full border-0 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          referrerPolicy="no-referrer"
          title="PDF Viewer"
        />
      )}
    </div>
  );
}
