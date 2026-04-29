import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, Download, ArrowLeft, FileWarning } from "lucide-react";

export const Route = createFileRoute("/view/$recordId")({
  component: ViewPage,
});

function ViewPage() {
  const { recordId } = Route.useParams();
  const [record, setRecord] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "records", recordId));
        if (!snap.exists()) return setStatus("missing");
        setRecord({ id: snap.id, ...snap.data() });
        setStatus("ok");
      } catch {
        setStatus("missing");
      }
    })();
  }, [recordId]);

  if (status === "loading") {
    return <div className="mx-auto max-w-3xl p-6"><Skeleton className="h-96 w-full" /></div>;
  }
  if (status === "missing") {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <FileWarning className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Record not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">This link may have been revoked.</p>
        <Button asChild className="mt-6"><Link to="/">Go home</Link></Button>
      </div>
    );
  }

  const isImage = record.resourceType === "image" || /\.(png|jpe?g|webp|gif)$/i.test(record.fileUrl);
  const isPdf = record.format === "pdf" || record.fileUrl.endsWith(".pdf");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold">
            <HeartPulse className="h-4 w-4 text-primary" /> HealthVault
          </Link>
          <Badge variant="secondary">Public view</Badge>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>{record.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {record.category}
                {record.createdAt?.seconds && ` • ${new Date(record.createdAt.seconds * 1000).toLocaleDateString()}`}
              </p>
            </div>
            <Button asChild variant="outline">
              <a href={record.fileUrl} target="_blank" rel="noreferrer" download>
                <Download className="h-4 w-4" /> Download
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            {isImage ? (
              <img src={record.fileUrl} alt={record.title} className="mx-auto max-h-[70vh] rounded-lg border border-border" />
            ) : isPdf ? (
              <iframe src={record.fileUrl} className="h-[75vh] w-full rounded-lg border border-border" title={record.title} />
            ) : (
              <a href={record.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Open file
              </a>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
