import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadToCloudinary, detectCategory } from "@/lib/cloudinary";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { UploadCloud, Loader2, FileIcon, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/upload")({
  component: UploadPage,
});

function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Prescription" | "Report" | "Scan">("Report");
  const [autoDetected, setAutoDetected] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  // Smart category detection from filename
  useEffect(() => {
    if (!file) return;
    const detected = detectCategory(file.name);
    setCategory(detected);
    setAutoDetected(true);
    if (!title.trim()) {
      const stem = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
      setTitle(stem.slice(0, 80));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !file) return;
    if (!title.trim()) return toast.error("Title is required");
    setBusy(true);
    setPct(0);
    try {
      const result = await uploadToCloudinary(file, setPct);
      await addDoc(collection(db, "records"), {
        ownerId: user.uid,
        title: title.trim(),
        category,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        createdAt: serverTimestamp(),
        isEmergency: false,
      });
      toast.success("Record saved");
      navigate({ to: "/dashboard/records" });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Upload medical record</CardTitle>
          <CardDescription>Files go to Cloudinary; metadata is stored in Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g. Blood test — Apr 2026" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                Category
                {autoDetected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    <Sparkles className="h-2.5 w-2.5" /> Auto-detected
                  </span>
                )}
              </Label>
              <Select value={category} onValueChange={(v: any) => { setCategory(v); setAutoDetected(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prescription">Prescription</SelectItem>
                  <SelectItem value="Report">Report</SelectItem>
                  <SelectItem value="Scan">Scan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>File</Label>
              <label
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
                className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${drag ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
              >
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} accept="image/*,application/pdf" />
                {file ? (
                  <>
                    <FileIcon className="h-8 w-8 text-primary" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Click or drag a file here</p>
                    <p className="text-xs text-muted-foreground">PDF or image, up to ~10MB</p>
                  </>
                )}
              </label>
            </div>
            {busy && (
              <div className="space-y-1">
                <Progress value={pct} />
                <p className="text-xs text-muted-foreground">Uploading… {pct}%</p>
              </div>
            )}
            <Button type="submit" disabled={busy || !file} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Upload record
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
