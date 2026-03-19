import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, X, FileText, Check, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

const DOCUMENT_CATEGORIES = [
  { value: "clearance_patch", label: "PATCH Clearance", group: "Clearances" },
  { value: "clearance_fbi", label: "FBI Clearance", group: "Clearances" },
  { value: "clearance_child_abuse", label: "Child Abuse Clearance", group: "Clearances" },
  { value: "id_drivers_license", label: "Driver's License", group: "Identification" },
  { value: "id_social_security", label: "Social Security Card", group: "Identification" },
  { value: "id_passport", label: "Passport", group: "Identification" },
  { value: "id_work_authorization", label: "Work Authorization", group: "Identification" },
  { value: "medical_physical", label: "Physical Exam", group: "Medical" },
  { value: "medical_tb_test", label: "TB Test", group: "Medical" },
  { value: "certification_cpr", label: "CPR Certification", group: "Certifications" },
  { value: "certification_license", label: "Professional License", group: "Certifications" },
  { value: "certification_training", label: "Training Certificate", group: "Certifications" },
  { value: "form_i9", label: "I-9 Form", group: "Forms" },
  { value: "form_w4", label: "W-4 Form", group: "Forms" },
  { value: "form_direct_deposit", label: "Direct Deposit Form", group: "Forms" },
  { value: "application", label: "Application", group: "Other" },
  { value: "resume", label: "Resume", group: "Other" },
  { value: "reference", label: "Reference Letter", group: "Other" },
  { value: "other", label: "Other Document", group: "Other" },
] as const;

type DocumentCategory = typeof DOCUMENT_CATEGORIES[number]["value"];

interface DocumentUploadProps {
  employeeId: number;
  onUploadComplete?: () => void;
}

export default function DocumentUpload({ employeeId, onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [expirationDate, setExpirationDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      setSelectedFile(null);
      setCategory("");
      setExpirationDate("");
      setUploadProgress(0);
      onUploadComplete?.();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploading(false);
      setUploadProgress(0);
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, images, and Word documents are allowed");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !category) {
      toast.error("Please select a file and category");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        setUploadProgress(30);
        
        const base64 = reader.result as string;
        const base64Data = base64.split(",")[1];
        
        // Generate unique filename
        const timestamp = Date.now();
        const ext = selectedFile.name.split(".").pop();
        const fileName = `${employeeId}/${category}/${timestamp}.${ext}`;
        
        setUploadProgress(50);

        // Upload to S3 via API
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName,
            fileData: base64Data,
            mimeType: selectedFile.type,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to upload file to storage");
        }

        const { key, url } = await response.json();
        setUploadProgress(80);

        // Save document record
        await uploadMutation.mutateAsync({
          employeeId,
          fileName: key,
          originalFileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          s3Key: key,
          s3Url: url,
          category,
          expirationDate: expirationDate || undefined,
        });

        setUploadProgress(100);
        setUploading(false);
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        setUploading(false);
        setUploadProgress(0);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Upload failed");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Group categories for display
  const groupedCategories = DOCUMENT_CATEGORIES.reduce((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = [];
    acc[cat.group].push(cat);
    return acc;
  }, {} as Record<string, typeof DOCUMENT_CATEGORIES[number][]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
        <CardDescription>
          Upload required documents for this employee. Supported formats: PDF, images, Word documents (max 10MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-emerald-500 bg-emerald-500/10"
              : selectedFile
              ? "border-emerald-300 bg-emerald-500/10"
              : "border-border hover:border-slate-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
            onChange={handleFileSelect}
          />
          
          {selectedFile ? (
            <div className="flex items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                Drag and drop a file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                PDF, images, or Word documents up to 10MB
              </p>
            </>
          )}
        </div>

        {/* Category Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Document Category *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedCategories).map(([group, cats]) => (
                  <div key={group}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                      {group}
                    </div>
                    {cats.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="expiration">Expiration Date (optional)</Label>
            <Input
              id="expiration"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              For clearances, certifications, and licenses
            </p>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !category || uploading}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
