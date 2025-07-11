"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FallbackPdfViewer from "./fallback-pdf-viewer";
import SecureDocumentViewer from "./secure-document-viewer";

interface Document {
  id: string;
  fileName: string;
  documentType: string;
  status: string;
  previewUrl: string;
  downloadUrl: string;
}

// Original modal for multiple documents
interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  title?: string;
  onApproveDocument?: (documentId: string) => void;
  onRejectDocument?: (documentId: string) => void;
  readOnly?: boolean;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  documents,
  title = "Dokumen Usulan",
  onApproveDocument,
  onRejectDocument,
  readOnly = false
}: DocumentPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<string>(documents[0]?.id || "");
  const [error, setError] = useState<Record<string, string>>({});

  const handleDownload = (doc: Document) => {
    const link = document.createElement("a");
    link.href = doc.downloadUrl;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInNewTab = (doc: Document) => {
    window.open(doc.previewUrl, "_blank");
  };

  const activeDocument = documents.find(doc => doc.id === activeTab);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
      case "SUBMITTED":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Menunggu Verifikasi</span>;
      case "APPROVED":
      case "DISETUJUI":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Disetujui</span>;
      case "REJECTED":
      case "DITOLAK":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Ditolak</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">{status}</span>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col dark:bg-slate-900 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center dark:text-white">
            <span>{title}</span>
            {/* No X button here, it's already part of DialogContent */}
          </DialogTitle>
        </DialogHeader>

        {documents.length > 0 ? (
          <div className="flex flex-col h-full overflow-hidden">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <div className="flex gap-4 mb-4">
                <TabsList className="overflow-x-auto whitespace-nowrap flex-grow dark:bg-slate-800">
                  {documents.map((doc) => (
                    <TabsTrigger 
                      key={doc.id} 
                      value={doc.id}
                      className="flex items-center gap-2 dark:text-slate-200 dark:data-[state=active]:bg-slate-700"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="truncate max-w-[150px]">{doc.documentType}</span>
                      {getStatusBadge(doc.status)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {documents.map((doc) => (
                <TabsContent
                  key={doc.id}
                  value={doc.id}
                  className="flex flex-col flex-grow overflow-hidden"
                >
                  <div className="bg-muted dark:bg-slate-800 px-4 py-2 rounded-md mb-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="font-medium dark:text-white">{doc.fileName}</h3>
                      <p className="text-sm text-muted-foreground dark:text-slate-400">{doc.documentType}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(doc)} className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openInNewTab(doc)} className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Buka di Tab Baru
                      </Button>
                    </div>
                  </div>

                  <div className="flex-grow relative overflow-hidden bg-muted dark:bg-slate-800 rounded-md">
                    {/* Try the FallbackPdfViewer first */}
                    <div className={`h-full ${error[doc.id] ? 'hidden' : 'block'}`}>
                      <FallbackPdfViewer 
                        url={doc.previewUrl}
                        onError={(err) => {
                          setError({...error, [doc.id]: "Menggunakan viewer alternatif..."});
                          console.error("Failed to load document:", err);
                        }}
                      />
                    </div>
                    
                    {/* If FallbackPdfViewer fails, use SecureDocumentViewer */}
                    {error[doc.id] && (
                      <SecureDocumentViewer documentId={doc.id} />
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-muted-foreground dark:text-slate-400">Tidak ada dokumen</p>
          </div>
        )}

        {activeDocument && !readOnly && onApproveDocument && onRejectDocument && (
          <DialogFooter className="flex justify-between border-t dark:border-slate-700 pt-4">
            <div>
              <p className="text-sm font-medium dark:text-slate-200">Status: {getStatusBadge(activeDocument.status)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => onRejectDocument(activeDocument.id)}
                disabled={activeDocument.status === "DITOLAK"}
                className="dark:bg-red-900 dark:hover:bg-red-800"
              >
                Tolak Dokumen
              </Button>
              <Button
                variant="default"
                onClick={() => onApproveDocument(activeDocument.id)}
                disabled={activeDocument.status === "DISETUJUI"}
                className="dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Setujui Dokumen
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Single document preview modal
interface SingleDocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName?: string;
}

export function SingleDocumentPreviewModal({
  isOpen,
  onClose,
  documentId,
  documentName = "Document"
}: SingleDocumentPreviewModalProps) {
  const [error, setError] = useState(false);
  
  const handleDownload = useCallback(() => {
    window.open(`/api/documents/${documentId}/download`, '_blank');
  }, [documentId]);

  const openInNewTab = useCallback(() => {
    window.open(`/api/documents/${documentId}/preview`, '_blank');
  }, [documentId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col dark:border-slate-700 dark:bg-slate-900">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl truncate max-w-[500px] dark:text-white">
            {documentName}
          </DialogTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              className="h-8 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Buka di Tab Baru
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-muted/20 dark:bg-slate-800 rounded-md overflow-hidden min-h-0">
          {/* Try FallbackPdfViewer first */}
          <div className={`h-full ${error ? 'hidden' : 'block'}`}>
            <FallbackPdfViewer 
              url={`/api/documents/${documentId}/preview`} 
              onError={(e) => {
                console.error("Error loading PDF:", e);
                setError(true);
              }}
            />
          </div>
          
          {/* If FallbackPdfViewer fails, use SecureDocumentViewer */}
          {error && (
            <SecureDocumentViewer documentId={documentId} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
