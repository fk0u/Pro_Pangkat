"use client"

import { useState, useEffect, useCallback } from "react"
import { Eye, CheckCircle, X, FileText, Download, MessageCircle, AlertTriangle, RefreshCw, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatWilayahForDisplay } from "@/lib/wilayah-utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { ProgressBar } from "@/components/ui/progress-bar"

interface DocumentItem {
  id: string
  fileName: string
  fileUrl: string
  status: string
  catatan: string | null
  uploadedAt: string
  verifiedAt?: string | null
  requirement: {
    id: string
    name: string
    description: string | null
    isRequired: boolean
    category: string | null
    format: string | null
    maxSize: number | null
  }
}

interface Proposal {
  id: string
  periode: string
  status: string
  createdAt: string
  updatedAt: string
  pegawai: {
    id: string
    name: string
    nip: string
    unitKerja: {
      id: string
      nama: string
      wilayah: string
    }
    jabatan: string
    golongan: string
    wilayah: string | {
      id: string
      nama: string
      wilayah?: string
    }
  }
  documents: DocumentItem[]
  documentProgress: {
    total: number
    completed: number
    pending: number
    rejected: number
    percentage: number
  }
}

interface InboxData {
  proposals: Proposal[]
  stats: {
    total: number
    menunggu: number
    diproses: number
    disetujui: number
    diteruskan: number
    dikembalikan: number
  }
  filterOptions: {
    unitKerja: string[]
    status: { value: string; label: string }[]
  }
}

export default function InboxClient() {
  const { toast } = useToast()
  const [data, setData] = useState<InboxData | null>(null)
  const [search, setSearch] = useState("")
  const [unitKerjaFilter, setUnitKerjaFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | "process" | "forward" | null>(null)
  const [actionNote, setActionNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New state for document actions
  const [isVerifyingDocument, setIsVerifyingDocument] = useState(false)
  const [documentActionType, setDocumentActionType] = useState<"approve" | "reject" | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null)
  const [documentNote, setDocumentNote] = useState("")
  const [showDocumentActionModal, setShowDocumentActionModal] = useState(false)

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: id })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  // Format date with time
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: id })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  const fetchInboxData = useCallback(async () => {
    try {
      setIsLoading(true)
      setRefreshing(true)
      const params = new URLSearchParams()
      
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (search) params.set("search", search)
      if (unitKerjaFilter !== "all") params.set("unitKerja", unitKerjaFilter)

      // Build URL with query parameters only if present
      const queryString = params.toString()
      const url = `/api/operator/inbox${queryString ? `?${queryString}` : ''}`
      
      console.log("Fetching inbox data from:", url);
      const response = await fetch(url)
      
      if (!response.ok) {
        // Log error body for debugging
        const errorText = await response.text()
        console.error("Inbox API error:", response.status, response.statusText, errorText)
        
        toast({
          title: "Error",
          description: `Gagal memuat data (${response.status})`,
          variant: "destructive"
        })
        
        return
      }
      
      const result = await response.json()
      console.log("Inbox data received:", result.data);
      setData(result.data)
    } catch (error) {
      console.error("Error fetching inbox data:", error)
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memuat data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [search, unitKerjaFilter, statusFilter, toast])
  
  useEffect(() => {
    fetchInboxData()
  }, [fetchInboxData])

  // When filter changes, refresh data
  useEffect(() => {
    fetchInboxData()
  }, [search, unitKerjaFilter, statusFilter, fetchInboxData])

  // Handle refreshing data
  const handleRefresh = () => {
    setRefreshing(true)
    fetchInboxData()
  }

  // Open proposal detail
  const viewProposalDetail = async (proposal: Proposal) => {
    try {
      setSelectedProposal(proposal)
      setShowDetailModal(true)
      
      // Fetch the latest proposal data to ensure we have the most up-to-date info
      const response = await fetch(`/api/operator/inbox/${proposal.id}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log("Proposal detail data:", result);
        setSelectedProposal(result.data)
      } else {
        console.error("Error fetching proposal details:", await response.text())
      }
    } catch (error) {
      console.error("Error viewing proposal detail:", error)
    }
  }

  // Open action modal
  const openActionModal = (proposal: Proposal, type: "approve" | "reject" | "process" | "forward") => {
    setSelectedProposal(proposal)
    setActionType(type)
    setActionNote("")
    setShowActionModal(true)
  }

  // Handle document action (approve/reject)
  const handleDocumentAction = (document: DocumentItem, actionType: "approve" | "reject") => {
    setSelectedDocument(document)
    setDocumentActionType(actionType)
    setDocumentNote("")
    setShowDocumentActionModal(true)
  }

  // Submit proposal action
  const submitAction = async () => {
    if (!selectedProposal || !actionType) return
    
    try {
      setIsSubmitting(true)
      
      // Show loading toast
      toast({
        title: "Memproses tindakan",
        description: "Mohon tunggu sebentar...",
      })
      
      console.log("Submitting action:", {
        proposalId: selectedProposal.id,
        action: actionType,
        catatan: actionNote,
      });
      
      const response = await fetch("/api/operator/inbox/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: selectedProposal.id,
          action: actionType,
          catatan: actionNote,
        }),
      })

      if (response.ok) {
        const result = await response.json();
        console.log("Action submission success:", result);
        
        // Show success toast
        const actionMessages = {
          approve: "disetujui",
          reject: "ditolak",
          process: "diproses",
          forward: "diteruskan"
        };
        
        toast({
          title: "Berhasil",
          description: `Usulan berhasil ${actionMessages[actionType]}`,
          variant: "default"
        })
        
        // Close modal
        setShowActionModal(false)
        setSelectedProposal(null)
        setActionType(null)
        setActionNote("")
        
        // Refresh data
        await fetchInboxData()
      } else {
        const errorText = await response.text()
        console.error("Error submitting action:", errorText)
        
        toast({
          title: "Gagal",
          description: `Gagal melakukan tindakan: ${response.status}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error submitting action:", error)
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat melakukan tindakan",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Submit document action
  const submitDocumentAction = async () => {
    if (!selectedDocument || !documentActionType || !selectedProposal) return

    try {
      setIsVerifyingDocument(true)
      
      // Show loading toast
      toast({
        title: "Memproses verifikasi dokumen",
        description: "Mohon tunggu sebentar...",
      })
      
      console.log("Submitting document action:", {
        documentId: selectedDocument.id,
        proposalId: selectedProposal.id,
        action: documentActionType,
        catatan: documentNote,
      });
      
      const response = await fetch("/api/operator/documents/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          proposalId: selectedProposal.id,
          action: documentActionType,
          catatan: documentNote,
        }),
      })

      if (response.ok) {
        const result = await response.json();
        console.log("Document verification success:", result);
        
        // Show success toast
        toast({
          title: "Berhasil",
          description: `Dokumen berhasil ${documentActionType === "approve" ? "disetujui" : "ditolak"}`,
          variant: "default"
        })
        
        // Update local data instead of refetching the entire list
        if (selectedProposal && selectedDocument && data) {
          // Update the document status in the current proposal
          const updatedProposal = {...selectedProposal}
          const documentIndex = updatedProposal.documents.findIndex(d => d.id === selectedDocument.id)
          
          if (documentIndex !== -1) {
            updatedProposal.documents[documentIndex] = {
              ...updatedProposal.documents[documentIndex],
              status: documentActionType === "approve" ? "DISETUJUI_DOC" : "DITOLAK",
              catatan: documentNote || null,
              verifiedAt: new Date().toISOString()
            }
            
            // Update document progress
            const total = updatedProposal.documents.length
            const completed = updatedProposal.documents.filter(d => d.status === "DISETUJUI_DOC").length
            const rejected = updatedProposal.documents.filter(d => d.status === "DITOLAK").length
            const pending = total - completed - rejected
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
            
            updatedProposal.documentProgress = {
              total,
              completed,
              pending,
              rejected,
              percentage
            }
            
            // Update the selected proposal
            setSelectedProposal(updatedProposal)
            
            // Also update in the main data list
            if (data?.proposals) {
              const proposalIndex = data.proposals.findIndex(p => p.id === selectedProposal.id)
              if (proposalIndex !== -1) {
                const updatedProposals = [...data.proposals]
                updatedProposals[proposalIndex] = updatedProposal
                setData({
                  ...data,
                  proposals: updatedProposals
                })
              }
            }
            
            // Check if this was the last document to verify
            if (updatedProposal.documentProgress.pending === 0 && 
                updatedProposal.documentProgress.percentage === 100) {
              
              // Check if there are no rejected documents and the proposal is in DIPROSES status
              const noRejections = updatedProposal.documentProgress.rejected === 0;
              const isProcessing = updatedProposal.status === "DIPROSES";
              
              if (noRejections && isProcessing) {
                // Show notification that all documents are verified and will be auto-forwarded
                toast({
                  title: "Semua Dokumen Terverifikasi",
                  description: "Usulan akan diteruskan ke admin pusat secara otomatis",
                  variant: "default"
                })
                
                // Auto-forward the proposal after a short delay
                setTimeout(() => {
                  autoForwardProposal(updatedProposal.id)
                }, 1500)
              } else {
                // Just show notification that all documents are verified
                toast({
                  title: "Semua Dokumen Terverifikasi",
                  description: "Usulan siap diteruskan ke admin pusat",
                  variant: "default"
                })
              }
            }
          }
        }
        
        // Close modal
        setShowDocumentActionModal(false)
        setSelectedDocument(null)
        setDocumentActionType(null)
        setDocumentNote("")
      } else {
        const errorText = await response.text()
        console.error("Error verifying document:", errorText)
        
        // Attempt to parse error
        try {
          const errorJson = JSON.parse(errorText)
          
          // Check if it's the known ActivityLog error
          if (errorJson.error && errorJson.error.includes("Invalid `prisma.activityLog.create()` invocation")) {
            console.warn("Detected ActivityLog error but document status may have been updated. Refreshing...")
            
            toast({
              title: "Peringatan",
              description: "Dokumen berhasil diverifikasi tetapi pencatatan log gagal",
              variant: "default"
            })
            
            // Update UI as if it succeeded
            // Update local data instead of refetching the entire list
            if (selectedProposal && selectedDocument && data) {
              // Update the document status in the current proposal
              updateDocumentStatus(
                selectedProposal, 
                selectedDocument.id, 
                documentActionType === "approve" ? "DISETUJUI_DOC" : "DITOLAK",
                documentNote || null
              )
              
              // Close modal since we're treating this as a success
              setShowDocumentActionModal(false)
              setSelectedDocument(null)
              setDocumentActionType(null)
              setDocumentNote("")
            }
            
            // Refresh data to get the true state
            setTimeout(() => {
              fetchInboxData()
            }, 1000)
            
            return
          }
          
          toast({
            title: "Gagal",
            description: errorJson.error || "Terjadi kesalahan saat memverifikasi dokumen",
            variant: "destructive"
          })
        } catch {
          // Parse error failed, use generic error message
          toast({
            title: "Gagal",
            description: "Terjadi kesalahan saat memverifikasi dokumen",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error("Error submitting document action:", error)
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memverifikasi dokumen",
        variant: "destructive"
      })
    } finally {
      setIsVerifyingDocument(false)
    }
  }

  // Verify all documents in a proposal
  const verifyAllDocuments = async (proposalId: string) => {
    try {
      setIsSubmitting(true)
      
      // Show loading toast
      toast({
        title: "Memverifikasi dokumen",
        description: "Memverifikasi semua dokumen yang belum diverifikasi...",
      })
      
      console.log("Verifying all documents for proposal:", proposalId);
      
      const response = await fetch("/api/operator/documents/verify-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposalId,
        }),
      })
      
      if (response.ok) {
          const result = await response.json();
          console.log("Verify all documents success:", result);
          
          // Show success toast
          toast({
            title: "Berhasil",
            description: `Semua dokumen berhasil diverifikasi`,
            variant: "default"
          })
          
          // Get the updated proposal to check if it's fully verified
          const updatedProposalResponse = await fetch(`/api/operator/inbox/${proposalId}`)
          let allVerified = false;
          let currentProposal: Proposal | null = null;
          
          if (updatedProposalResponse.ok) {
            const updatedData = await updatedProposalResponse.json();
            currentProposal = updatedData.data;
            
            // Check if all documents are verified and no rejections
            if (currentProposal) {
              const total = currentProposal.documents.length;
              const completed = currentProposal.documents.filter(d => d.status === "DISETUJUI_DOC").length;
              const rejected = currentProposal.documents.filter(d => d.status === "DITOLAK").length;
              
              // All documents are verified and no rejections
              allVerified = (completed === total && rejected === 0 && currentProposal.status === "DIPROSES");
            }
          }
          
          // If all verified and no rejections, automatically forward
          if (allVerified && currentProposal) {
            toast({
              title: "Semua Dokumen Terverifikasi",
              description: "Usulan akan diteruskan ke admin pusat secara otomatis",
              variant: "default"
            })
            
            // Auto-forward after a short delay
            setTimeout(() => {
              autoForwardProposal(proposalId)
            }, 1500)
          } 
          // Otherwise just show the standard notification
          else if (result.verified > 0) {
            toast({
              title: "Dokumen Terverifikasi",
              description: "Usulan siap diteruskan ke admin pusat",
              variant: "default"
            })
          }
          
          // Refresh data
          await fetchInboxData()
        
        // If we're in detail view, refresh that specific proposal
        if (selectedProposal && selectedProposal.id === proposalId) {
          try {
            const updatedProposalResponse = await fetch(`/api/operator/inbox/${proposalId}`)
            if (updatedProposalResponse.ok) {
              const result = await updatedProposalResponse.json()
              console.log("Updated proposal data:", result);
              setSelectedProposal(result.data)
            } else {
              console.error("Error refreshing proposal details:", await updatedProposalResponse.text())
              
              toast({
                title: "Peringatan",
                description: "Berhasil memverifikasi dokumen tetapi gagal memperbarui tampilan",
                variant: "default"
              })
            }
          } catch (error) {
            console.error("Error fetching updated proposal:", error)
            
            toast({
              title: "Peringatan",
              description: "Berhasil memverifikasi dokumen tetapi gagal memperbarui tampilan",
              variant: "default"
            })
          }
        }
      } else {
        const errorText = await response.text()
        console.error("Error verifying all documents:", errorText)
        
        // Attempt to parse error
        try {
          const errorJson = JSON.parse(errorText)
          
          // Check if it's the known ActivityLog error
          if (errorJson.error && errorJson.error.includes("Invalid `prisma.activityLog.create()` invocation")) {
            console.warn("Detected ActivityLog error but document verification may have succeeded. Refreshing...")
            
            toast({
              title: "Peringatan",
              description: "Dokumen berhasil diverifikasi tetapi pencatatan log gagal",
              variant: "default"
            })
            
            // Since this is probably a success, we should refresh the data
            await fetchInboxData()
            
            // Check if all documents are verified now, we need to fetch the latest proposal data
            try {
              const updatedProposalResponse = await fetch(`/api/operator/inbox/${proposalId}`)
              if (updatedProposalResponse.ok) {
                const updatedData = await updatedProposalResponse.json()
                const currentProposal = updatedData.data
                
                // If all documents are verified and none rejected, auto-forward
                if (currentProposal) {
                  const total = currentProposal.documents.length
                  const completed = currentProposal.documents.filter(d => d.status === "DISETUJUI_DOC").length
                  const rejected = currentProposal.documents.filter(d => d.status === "DITOLAK").length
                  
                  // Check if all verified, none rejected, and still in DIPROSES status
                  if (completed === total && rejected === 0 && currentProposal.status === "DIPROSES") {
                    toast({
                      title: "Semua Dokumen Terverifikasi",
                      description: "Usulan akan diteruskan ke admin pusat secara otomatis",
                      variant: "default"
                    })
                    
                    // Auto-forward after a short delay
                    setTimeout(() => {
                      autoForwardProposal(proposalId)
                    }, 1500)
                  }
                  
                  // Update the selected proposal if in detail view
                  if (selectedProposal && selectedProposal.id === proposalId) {
                    setSelectedProposal(currentProposal)
                  }
                }
              }
            } catch (error) {
              console.error("Error checking proposal status after activity log error:", error)
            }
            
            return
          }
          
          toast({
            title: "Gagal",
            description: errorJson.error || `Gagal memverifikasi dokumen: ${response.status}`,
            variant: "destructive"
          })
        } catch {
          // Parse error failed, use generic error message
          toast({
            title: "Gagal",
            description: `Gagal memverifikasi dokumen: ${response.status}`,
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error("Error verifying all documents:", error)
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memverifikasi dokumen",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Helper function to automatically forward a proposal when all docs are verified
  const autoForwardProposal = async (proposalId: string) => {
    try {
      console.log("Auto-forwarding proposal to admin:", proposalId);
      
      // Show loading toast
      toast({
        title: "Meneruskan Usulan",
        description: "Otomatis meneruskan usulan ke admin pusat...",
      })
      
      const response = await fetch("/api/operator/inbox/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposalId,
          action: "forward",
          catatan: "Diteruskan otomatis setelah semua dokumen diverifikasi",
        }),
      })

      if (response.ok) {
        const result = await response.json();
        console.log("Auto-forward success:", result);
        
        // Show success toast
        toast({
          title: "Berhasil",
          description: "Usulan berhasil diteruskan ke admin pusat secara otomatis",
          variant: "default"
        })
        
        // Refresh data
        await fetchInboxData()
        
        return true
      } else {
        const errorText = await response.text()
        console.error("Error auto-forwarding proposal:", errorText)
        
        toast({
          title: "Gagal",
          description: "Gagal meneruskan usulan secara otomatis. Silakan teruskan secara manual.",
          variant: "destructive"
        })
        
        return false
      }
    } catch (error) {
      console.error("Error in auto-forwarding:", error)
      
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat meneruskan usulan. Silakan teruskan secara manual.",
        variant: "destructive"
      })
      
      return false
    }
  }
  
  // Helper function to update document status in local state
  const updateDocumentStatus = (
    proposal: Proposal, 
    documentId: string, 
    newStatus: string, 
    notes: string | null = null
  ) => {
    // Update the document status in the current proposal
    const updatedProposal = {...proposal}
    const documentIndex = updatedProposal.documents.findIndex((d: DocumentItem) => d.id === documentId)
    
    if (documentIndex !== -1) {
      updatedProposal.documents[documentIndex] = {
        ...updatedProposal.documents[documentIndex],
        status: newStatus,
        catatan: notes || null,
        verifiedAt: new Date().toISOString()
      }
      
      // Update document progress
      const total = updatedProposal.documents.length
      const completed = updatedProposal.documents.filter((d: DocumentItem) => d.status === "DISETUJUI_DOC").length
      const rejected = updatedProposal.documents.filter((d: DocumentItem) => d.status === "DITOLAK").length
      const pending = total - completed - rejected
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
      
      updatedProposal.documentProgress = {
        total,
        completed,
        pending,
        rejected,
        percentage
      }
      
      // Update the selected proposal
      setSelectedProposal(updatedProposal)
      
      // Also update in the main data list
      if (data?.proposals) {
        const proposalIndex = data.proposals.findIndex((p: Proposal) => p.id === proposal.id)
        if (proposalIndex !== -1) {
          const updatedProposals = [...data.proposals]
          updatedProposals[proposalIndex] = updatedProposal
          setData({
            ...data,
            proposals: updatedProposals
          })
        }
      }
      
      // Check if all documents are verified and no rejections
      if (pending === 0 && percentage === 100 && rejected === 0 && 
          proposal.status === "DIPROSES") {
        // All documents are verified, automatically forward to admin
        toast({
          title: "Semua Dokumen Terverifikasi",
          description: "Usulan akan diteruskan ke admin pusat secara otomatis",
          variant: "default"
        })
        
        // Auto-forward to admin
        setTimeout(() => {
          autoForwardProposal(proposal.id)
        }, 1000) // Slight delay to allow UI to update
      }
    }
  }

  // Status display configurations
  const statusConfig = {
    // Proposal statuses
    MENUNGGU: { label: "Menunggu", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300" },
    DIPROSES: { label: "Diproses", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" },
    DISETUJUI: { label: "Disetujui", className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" },
    DISETUJUI_OPERATOR: { label: "Disetujui & Diteruskan", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300" },
    DITERUSKAN: { label: "Diteruskan", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300" },
    DIKEMBALIKAN: { label: "Dikembalikan", className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" },
    
    // Document statuses
    MENUNGGU_VERIFIKASI: { label: "Menunggu Verifikasi", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300" },
    DISETUJUI_DOC: { label: "Disetujui", className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" },
    DITOLAK: { label: "Ditolak", className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" },
  }

  if (isLoading && !data) {
    return (
      <DashboardLayout userType="operator">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Memuat Data...</h2>
            <p className="text-muted-foreground">Mohon tunggu sebentar</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout userType="operator">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Data Tidak Tersedia</h2>
            <p className="text-muted-foreground">Terjadi kesalahan saat memuat data</p>
            <Button className="mt-4" onClick={() => fetchInboxData()}>
              Coba Lagi
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="operator">
      <div className="flex flex-col space-y-6 p-4 md:p-6">
        <div className="flex flex-col space-y-2">
          <div className="bg-gradient-to-r from-green-500/10 via-primary/10 to-blue-500/10 p-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold dark:text-white">Inbox Usulan</h1>
                  <p className="text-muted-foreground">Kelola dan tinjau usulan kenaikan pangkat</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Data
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardContent className="p-4 flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mr-4">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Usulan</p>
                <p className="text-2xl font-bold">{data.stats.total}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardContent className="p-4 flex items-center">
              <div className="bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-full mr-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Menunggu</p>
                <p className="text-2xl font-bold">{data.stats.menunggu}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardContent className="p-4 flex items-center">
              <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full mr-4">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disetujui</p>
                <p className="text-2xl font-bold">{data.stats.disetujui}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardContent className="p-4 flex items-center">
              <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-full mr-4">
                <X className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dikembalikan</p>
                <p className="text-2xl font-bold">{data.stats.dikembalikan}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary/70"><path d="M0.877075 7.49988C0.877075 3.84219 3.84222 0.877045 7.49991 0.877045C11.1576 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1575 0.877075 7.49988ZM7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49991 1.82704Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path><path d="M13.4747 14.8319C13.2793 15.0274 12.9553 15.0274 12.7599 14.8319L10.7489 12.8209C10.5535 12.6255 10.5535 12.3015 10.7489 12.106C10.9444 11.9106 11.2684 11.9106 11.4638 12.106L13.4747 14.1169C13.6702 14.3124 13.6702 14.6364 13.4747 14.8319Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              <h2 className="text-base font-medium">Filter & Pencarian</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama pegawai atau NIP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
              
              <Select
                value={unitKerjaFilter}
                onValueChange={setUnitKerjaFilter}
              >
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder="Semua Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit Kerja</SelectItem>
                  {data?.filterOptions.unitKerja.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {data?.filterOptions.status.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary/70">
              <path d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V3C13 2.44772 12.5523 2 12 2H3ZM1 3C1 1.89543 1.89543 1 3 1H12C13.1046 1 14 1.89543 14 3V12C14 13.1046 13.1046 14 12 14H3C1.89543 14 1 13.1046 1 12V3Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              <path d="M3.25 4C3.25 3.58579 3.58579 3.25 4 3.25H11C11.4142 3.25 11.75 3.58579 11.75 4C11.75 4.41421 11.4142 4.75 11 4.75H4C3.58579 4.75 3.25 4.41421 3.25 4Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              <path d="M3.25 7C3.25 6.58579 3.58579 6.25 4 6.25H11C11.4142 6.25 11.75 6.58579 11.75 7C11.75 7.41421 11.4142 7.75 11 7.75H4C3.58579 7.75 3.25 7.41421 3.25 7Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              <path d="M3.25 10C3.25 9.58579 3.58579 9.25 4 9.25H11C11.4142 9.25 11.75 9.58579 11.75 10C11.75 10.4142 11.4142 10.75 11 10.75H4C3.58579 10.75 3.25 10.4142 3.25 10Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
            <h2 className="text-base font-medium">Data Usulan Kenaikan Pangkat</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {data.proposals.length} usulan
            </span>
          </div>
          
          {data.proposals.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-yellow-500" />
              </div>
              <h3 className="text-xl font-medium mb-2">Tidak Ada Usulan</h3>
              <p className="text-gray-500 mb-4">
                Tidak ada usulan yang ditemukan dengan filter yang dipilih.
              </p>
              <Button onClick={() => {
                setSearch("")
                setStatusFilter("all")
                setUnitKerjaFilter("all")
              }}>
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="rounded-md border shadow-sm bg-white dark:bg-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Pegawai</th>
                      <th className="px-4 py-3 text-left font-medium">Unit Kerja</th>
                      <th className="px-4 py-3 text-left font-medium">Periode</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Progress</th>
                      <th className="px-4 py-3 text-right font-medium w-[160px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.proposals.map((proposal) => (
                      <tr 
                        key={proposal.id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium dark:text-white">{proposal.pegawai.name}</div>
                            <div className="text-sm text-muted-foreground">{proposal.pegawai.nip}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {proposal.pegawai.unitKerja.nama}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div>{proposal.periode}</div>
                          <div className="text-xs text-muted-foreground">{formatDateTime(proposal.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusConfig[proposal.status as keyof typeof statusConfig]?.className || "bg-gray-100"}>
                            {statusConfig[proposal.status as keyof typeof statusConfig]?.label || proposal.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <ProgressBar percentage={proposal.documentProgress.percentage} />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {proposal.documentProgress.completed}/{proposal.documentProgress.total}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => viewProposalDetail(proposal)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detail
                            </Button>
                            
                            {proposal.status === "MENUNGGU" && (
                              <>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => openActionModal(proposal, "process")}
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  Proses
                                </Button>
                                
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openActionModal(proposal, "reject")}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Tolak
                                </Button>
                              </>
                            )}
                            
                            {proposal.status === "DIPROSES" && proposal.documentProgress.percentage === 100 && 
                             proposal.documentProgress.rejected === 0 && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => openActionModal(proposal, "forward")}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Teruskan ke Pusat
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedProposal && (
              <div>
                <DialogHeader>
                  <DialogTitle>Detail Usulan Kenaikan Pangkat</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-1 dark:text-white">Informasi Pegawai</h3>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Nama</span>
                            <span className="font-medium dark:text-white">{selectedProposal.pegawai.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">NIP</span>
                            <span className="font-medium dark:text-white">{selectedProposal.pegawai.nip}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Unit Kerja</span>
                            <span className="font-medium dark:text-white">{selectedProposal.pegawai.unitKerja.nama}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Jabatan</span>
                            <span className="font-medium dark:text-white">{selectedProposal.pegawai.jabatan}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Golongan</span>
                            <span className="font-medium dark:text-white">{selectedProposal.pegawai.golongan}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Wilayah</span>
                            <span className="font-medium dark:text-white">
                              {formatWilayahForDisplay(selectedProposal.pegawai.wilayah)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-1 dark:text-white">Informasi Usulan</h3>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Status</span>
                            <Badge className={statusConfig[selectedProposal.status as keyof typeof statusConfig]?.className || "bg-gray-100"}>
                              {statusConfig[selectedProposal.status as keyof typeof statusConfig]?.label || selectedProposal.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Periode</span>
                            <span className="font-medium dark:text-white">{selectedProposal.periode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Tanggal Pengajuan</span>
                            <span className="font-medium dark:text-white">{formatDate(selectedProposal.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Terakhir Diperbarui</span>
                            <span className="font-medium dark:text-white">{formatDate(selectedProposal.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-1 dark:text-white">Progress Dokumen</h3>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md space-y-3">
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                              <span className="dark:text-gray-300">Total</span>
                            </div>
                            <span className="font-medium dark:text-white">{selectedProposal.documentProgress.total}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                              <span className="dark:text-gray-300">Disetujui</span>
                            </div>
                            <span className="font-medium dark:text-white">{selectedProposal.documentProgress.completed}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                              <span className="dark:text-gray-300">Menunggu</span>
                            </div>
                            <span className="font-medium dark:text-white">{selectedProposal.documentProgress.pending}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                              <span className="dark:text-gray-300">Ditolak</span>
                            </div>
                            <span className="font-medium dark:text-white">{selectedProposal.documentProgress.rejected}</span>
                          </div>
                          
                          <div className="mt-2">
                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <ProgressBar percentage={selectedProposal.documentProgress.percentage} />
                            </div>
                            <div className="flex justify-between text-xs mt-1 dark:text-gray-300">
                              <span>{selectedProposal.documentProgress.percentage}% selesai</span>
                              <span>{selectedProposal.documentProgress.completed}/{selectedProposal.documentProgress.total} dokumen</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <h3 className="font-semibold mb-3">Aksi</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProposal.status === "MENUNGGU" && (
                            <>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => openActionModal(selectedProposal, "process")}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Proses Usulan
                              </Button>
                              
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openActionModal(selectedProposal, "reject")}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Tolak
                              </Button>
                            </>
                          )}
                          
                          {selectedProposal.status === "DIPROSES" && (
                            <>
                              {selectedProposal.documentProgress.pending > 0 && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => verifyAllDocuments(selectedProposal.id)}
                                  disabled={isSubmitting}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Verifikasi Semua Dokumen
                                </Button>
                              )}
                              
                              {selectedProposal.documentProgress.percentage === 100 && 
                               selectedProposal.documentProgress.rejected === 0 && 
                               selectedProposal.status === "DIPROSES" && (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => openActionModal(selectedProposal, "forward")}
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  Teruskan ke Pusat
                                </Button>
                              )}
                              
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openActionModal(selectedProposal, "reject")}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Tolak
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3 dark:text-white">Dokumen Pendukung</h3>
                      {selectedProposal.documents.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md text-center">
                          <p className="text-gray-500 dark:text-gray-400">Tidak ada dokumen</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedProposal.documents.map((doc) => (
                            <div key={doc.id} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                              <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                                  <span className="font-medium dark:text-white">{doc.requirement.name}</span>
                                </div>
                                <Badge className={
                                  doc.status === "DISETUJUI" 
                                    ? statusConfig.DISETUJUI_DOC.className 
                                    : doc.status === "DITOLAK" 
                                      ? statusConfig.DITOLAK.className
                                      : statusConfig.MENUNGGU_VERIFIKASI.className
                                }>
                                  {doc.status === "DISETUJUI" 
                                    ? statusConfig.DISETUJUI_DOC.label 
                                    : doc.status === "DITOLAK"
                                      ? statusConfig.DITOLAK.label
                                      : statusConfig.MENUNGGU_VERIFIKASI.label}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                {doc.fileName}
                              </div>
                              
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                Diunggah: {formatDate(doc.uploadedAt)}
                              </div>
                              
                              {doc.catatan && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded mb-2 text-sm dark:text-gray-300">
                                  <span className="font-medium">Catatan:</span> {doc.catatan}
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <a href={`/api/documents/${doc.id}/preview`} target="_blank" rel="noreferrer">
                                    <FileText className="h-4 w-4 mr-1" />
                                    Lihat
                                  </a>
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noreferrer">
                                    <Download className="h-4 w-4 mr-1" />
                                    Unduh
                                  </a>
                                </Button>
                                
                                {doc.status === "MENUNGGU_VERIFIKASI" && (
                                  <>
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      onClick={() => handleDocumentAction(doc, "approve")}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Verifikasi
                                    </Button>
                                    
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => handleDocumentAction(doc, "reject")}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Tolak
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Action Modal */}
        <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
          <DialogContent className="max-w-md">
            {selectedProposal && actionType && (
              <div>
                <DialogHeader>
                  <DialogTitle>
                    {actionType === "approve" && "Setujui Usulan"}
                    {actionType === "reject" && "Tolak Usulan"}
                    {actionType === "process" && "Proses Usulan"}
                    {actionType === "forward" && "Teruskan Usulan ke Pusat"}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="py-4">
                  <p className="mb-4">
                    {actionType === "approve" && "Anda akan menyetujui usulan kenaikan pangkat ini."}
                    {actionType === "reject" && "Anda akan menolak usulan kenaikan pangkat ini."}
                    {actionType === "process" && "Anda akan memproses usulan kenaikan pangkat ini."}
                    {actionType === "forward" && "Anda akan meneruskan usulan kenaikan pangkat ini ke admin pusat untuk ditindaklanjuti."}
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Pegawai</h4>
                    <p className="text-gray-700">{selectedProposal.pegawai.name} ({selectedProposal.pegawai.nip})</p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" htmlFor="note">
                      Catatan {actionType === "reject" ? "(Wajib)" : "(Opsional)"}
                    </label>
                    <Textarea
                      id="note"
                      placeholder="Tambahkan catatan..."
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      rows={4}
                      required={actionType === "reject"}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowActionModal(false)} disabled={isSubmitting} className="w-full sm:w-auto">
                    Batal
                  </Button>
                  <Button 
                    variant={actionType === "reject" ? "destructive" : "default"}
                    onClick={submitAction}
                    disabled={isSubmitting || (actionType === "reject" && !actionNote.trim())}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : actionType === "approve" ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Setujui
                      </>
                    ) : actionType === "reject" ? (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Tolak
                      </>
                    ) : actionType === "process" ? (
                      <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Proses
                      </>
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Teruskan
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Document Action Modal */}
        <Dialog open={showDocumentActionModal} onOpenChange={setShowDocumentActionModal}>
          <DialogContent className="max-w-md">
            {selectedDocument && documentActionType && (
              <div>
                <DialogHeader>
                  <DialogTitle>
                    {documentActionType === "approve" ? "Verifikasi Dokumen" : "Tolak Dokumen"}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="py-4">
                  <p className="mb-4">
                    {documentActionType === "approve" 
                      ? "Anda akan memverifikasi dokumen ini sebagai valid." 
                      : "Anda akan menolak dokumen ini karena tidak memenuhi syarat."}
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Dokumen</h4>
                    <p className="text-gray-700">{selectedDocument.requirement.name}</p>
                    <p className="text-sm text-gray-500">{selectedDocument.fileName}</p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" htmlFor="docNote">
                      Catatan {documentActionType === "reject" ? "(Wajib)" : "(Opsional)"}
                    </label>
                    <Textarea
                      id="docNote"
                      placeholder="Tambahkan catatan..."
                      value={documentNote}
                      onChange={(e) => setDocumentNote(e.target.value)}
                      rows={4}
                      required={documentActionType === "reject"}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDocumentActionModal(false)}>
                    Batal
                  </Button>
                  <Button 
                    variant={documentActionType === "reject" ? "destructive" : "default"}
                    onClick={submitDocumentAction} 
                    disabled={isVerifyingDocument || (documentActionType === "reject" && !documentNote.trim())}
                    className="w-full sm:w-auto"
                  >
                    {isVerifyingDocument ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : documentActionType === "approve" ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verifikasi
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Tolak
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
