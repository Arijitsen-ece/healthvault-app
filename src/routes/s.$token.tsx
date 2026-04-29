import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, Download, ArrowLeft, FileWarning } from "lucide-react";
import { cldThumb } from "@/lib/cloudinary";

export const Route = createFileRoute("/s/$token")({
  component: SharePage,
});

function SharePage() {
  const { token } = Route.useParams();
  const [record, setRecord] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled && status === "loading") setStatus("error");
    }, 10000);

    (async () => {
      try {
        const q = query(collection(db, "shares"), where("token", "==", token), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          if (!cancelled) setStatus("missing");
          return;
        }
        const share = snap.docs[0].data() as any;
        const recSnap = await getDoc(doc(db, "records", share.recordId));
        if (!recSnap.exists()) {
          if (!cancelled) setStatus("missing");
          return;
        }
        if (cancelled) return;
        setRecord({ id: recSnap.id, ...recSnap.data() });
        setStatus("ok");
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [token]);

  if (status === "loading") {
    return <div className="mx-auto max-w-3xl p-6"><Skeleton className="h-96 w-full" /></div>;
  }
  if (status === "missing" || status === "error") {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <FileWarning className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">
          {status === "error" ? "Couldn't load this record" : "Record not found"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {status === "error" ? "Please check your connection and try again." : "This link may have been revoked."}
        </p>
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
          <Badge variant="secondary">Shared record</Badge>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
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
              <img src={cldThumb(record.fileUrl, 1200)} alt={record.title} className="mx-auto max-h-[70vh] rounded-lg border border-border" loading="lazy" />
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
