"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface EmbeddedViewerProps {
  documentId: string;
  className?: string;
}

export default function EmbeddedViewer({
  documentId,
  className = "w-full h-full"
}: EmbeddedViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Create a web URL that embeds the PDF in an HTML page
  const embedUrl = `/test-pdf-viewer?documentId=${documentId}`;

  useEffect(() => {
    // Reset loading state when document changes
    setIsLoading(true);
  }, [documentId]);

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
      
      <iframe 
        src={embedUrl}
        className="w-full h-full border-0"
        onLoad={() => setIsLoading(false)}
        title="PDF Viewer"
        allowFullScreen
      />
    </div>
  );
}
