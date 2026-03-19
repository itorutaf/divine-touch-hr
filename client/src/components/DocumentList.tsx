import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  FileText, Download, Trash2, MoreVertical, Eye, 
  CheckCircle2, XCircle, Clock, AlertTriangle,
  FileImage, File
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  clearance_patch: "PATCH Clearance",
  clearance_fbi: "FBI Clearance",
  clearance_child_abuse: "Child Abuse Clearance",
  id_drivers_license: "Driver's License",
  id_social_security: "Social Security Card",
  id_passport: "Passport",
  id_work_authorization: "Work Authorization",
  medical_physical: "Physical Exam",
  medical_tb_test: "TB Test",
  certification_cpr: "CPR Certification",
  certification_license: "Professional License",
  certification_training: "Training Certificate",
  form_i9: "I-9 Form",
  form_w4: "W-4 Form",
  form_direct_deposit: "Direct Deposit Form",
  application: "Application",
  resume: "Resume",
  reference: "Reference Letter",
  other: "Other Document",
};

const STATUS_BADGES: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending_review: { 
    label: "Pending Review", 
    className: "bg-amber-100 text-amber-700",
    icon: <Clock className="h-3 w-3" />
  },
  approved: { 
    label: "Approved", 
    className: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  rejected: { 
    label: "Rejected", 
    className: "bg-red-100 text-red-700",
    icon: <XCircle className="h-3 w-3" />
  },
  expired: { 
    label: "Expired", 
    className: "bg-muted text-foreground",
    icon: <AlertTriangle className="h-3 w-3" />
  },
};

interface DocumentListProps {
  employeeId: number;
  canReview?: boolean;
  canDelete?: boolean;
}

export default function DocumentList({ employeeId, canReview = false, canDelete = false }: DocumentListProps) {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: documents, isLoading, refetch } = trpc.documents.getForEmployee.useQuery({ employeeId });

  const reviewMutation = trpc.documents.review.useMutation({
    onSuccess: () => {
      toast.success(`Document ${reviewStatus}`);
      setReviewDialogOpen(false);
      setSelectedDoc(null);
      setReviewNotes("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      setDeleteDialogOpen(false);
      setSelectedDoc(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <FileImage className="h-4 w-4 text-blue-500" />;
    }
    if (mimeType === "application/pdf") {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const isExpiringSoon = (expirationDate: Date | null) => {
    if (!expirationDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(expirationDate) <= thirtyDaysFromNow;
  };

  const handleReview = () => {
    if (!selectedDoc) return;
    reviewMutation.mutate({
      id: selectedDoc.id,
      status: reviewStatus,
      reviewNotes,
    });
  };

  const handleDelete = () => {
    if (!selectedDoc) return;
    deleteMutation.mutate({ id: selectedDoc.id });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
          <CardDescription>
            {documents?.length || 0} document{documents?.length !== 1 ? "s" : ""} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!documents || documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const status = STATUS_BADGES[doc.status || "pending_review"];
                  const expiring = isExpiringSoon(doc.expirationDate);
                  
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.mimeType)}
                          <div>
                            <p className="font-medium text-sm">{doc.originalFileName}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{CATEGORY_LABELS[doc.category] || doc.category}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.className} gap-1`}>
                          {status.icon}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString()}
                        {doc.uploadedByName && (
                          <p className="text-xs text-muted-foreground">by {doc.uploadedByName}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.expirationDate ? (
                          <span className={`text-sm ${expiring ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            {new Date(doc.expirationDate).toLocaleDateString()}
                            {expiring && " ⚠️"}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={doc.s3Url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={doc.s3Url} download={doc.originalFileName}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </a>
                            </DropdownMenuItem>
                            {canReview && doc.status === "pending_review" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setReviewDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Review
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
            <DialogDescription>
              Review and approve or reject this document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="font-medium">{selectedDoc?.originalFileName}</p>
              <p className="text-sm text-muted-foreground">
                {CATEGORY_LABELS[selectedDoc?.category] || selectedDoc?.category}
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                variant={reviewStatus === "approved" ? "default" : "outline"}
                className={reviewStatus === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                onClick={() => setReviewStatus("approved")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant={reviewStatus === "rejected" ? "default" : "outline"}
                className={reviewStatus === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
                onClick={() => setReviewStatus("rejected")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add review notes..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              className={reviewStatus === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
            >
              {reviewMutation.isPending ? "Saving..." : `${reviewStatus === "approved" ? "Approve" : "Reject"} Document`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="font-medium text-red-700">{selectedDoc?.originalFileName}</p>
              <p className="text-sm text-red-600">
                {CATEGORY_LABELS[selectedDoc?.category] || selectedDoc?.category}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
