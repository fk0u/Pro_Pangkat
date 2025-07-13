"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

interface FallbackPdfViewerProps {
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export default function FallbackPdfViewer({
  url,
  onLoad,
  onError,
  className = "w-full h-full"
}: FallbackPdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMethod, setViewMethod] = useState<'object' | 'iframe' | 'failed'>('object');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const objectRef = useRef<HTMLObjectElement>(null);

  useEffect(() => {
    // Reset state when url changes
    setIsLoading(true);
    setError(null);
    setViewMethod('object');
  }, [url]);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleObjectError = () => {
    console.log("Object tag failed, trying iframe...");
    setViewMethod('iframe');
  };

  const handleIframeError = () => {
    console.log("Iframe failed too, showing fallback...");
    setIsLoading(false);
    setViewMethod('failed');
    const errorMsg = "Browser blocked document preview. Please use the 'Buka di Tab Baru' button.";
    setError(errorMsg);
    if (onError) onError(new Error(errorMsg));
  };
  
  const openInNewTab = () => {
    window.open(url, "_blank");
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10 dark:bg-slate-800/50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 dark:text-slate-200" />
            <p className="dark:text-slate-200">Memuat dokumen...</p>
          </div>
        </div>
      )}
      
      {viewMethod === 'failed' && (
        <div className="absolute inset-0 flex items-center justify-center dark:bg-slate-800/30">
          <div className="text-center p-6 max-w-md bg-white dark:bg-slate-800 rounded-md shadow-md">
            <p className="text-destructive mb-4 dark:text-red-400">{error || "Browser blocked document preview."}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openInNewTab}
              className="mr-2 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Buka di Tab Baru
            </Button>
          </div>
        </div>
      )}
      
      {/* Always render both, but hide one based on viewMethod */}
      <div className={`h-full ${viewMethod !== 'object' ? 'hidden' : 'block'}`}>
        <object
          ref={objectRef}
          data={`${url}?t=${Date.now()}`} // Add timestamp to prevent caching
          type="application/pdf"
          className="w-full h-full border-0"
          onLoad={handleLoad}
          onError={handleObjectError}
        >
          <p className="p-4 text-center dark:text-slate-200">
            Browser tidak dapat menampilkan PDF.
            <Button 
              variant="link" 
              onClick={openInNewTab}
              className="dark:text-blue-400"
            >
              Klik di sini untuk membuka di tab baru
            </Button>
          </p>
        </object>
      </div>
      
      <div className={`h-full ${viewMethod !== 'iframe' ? 'hidden' : 'block'}`}>
        <iframe 
          ref={iframeRef}
          src={`${url}?t=${Date.now()}`} // Add timestamp to prevent caching
          className="w-full h-full border-0"
          onLoad={handleLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-presentation"
          allow="fullscreen"
          referrerPolicy="no-referrer"
          title="PDF Viewer"
        />
      </div>
      
      {/* Always show a button to open in new tab for best compatibility */}
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
