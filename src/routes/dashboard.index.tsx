import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  HeartPulse,
  ArrowRight,
  Stethoscope,
  Pill,
  ScanLine,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

type LoadState = "loading" | "ok" | "error";

function DashboardHome() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<{ total: number; prescription: number; report: number; scan: number } | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [hasEmergency, setHasEmergency] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setState("loading");

    const timeout = setTimeout(() => {
      if (!cancelled) setState((s) => (s === "loading" ? "error" : s));
    }, 12000);

    (async () => {
      try {
        const q = query(
          collection(db, "records"),
          where("ownerId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(50),
        );
        const [snap, em] = await Promise.all([
          getDocs(q),
          getDoc(doc(db, "publicEmergency", user.uid)),
        ]);
        if (cancelled) return;
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
        setRecent(items.slice(0, 5));
        setCounts({
          total: items.length,
          prescription: items.filter((i) => i.category === "Prescription").length,
          report: items.filter((i) => i.category === "Report").length,
          scan: items.filter((i) => i.category === "Scan").length,
        });
        const data = em.data() as any;
        setHasEmergency(!!(em.exists() && (data?.bloodGroup || data?.allergies || data?.medications || data?.contact)));
        setState("ok");
      } catch (e) {
        console.error(e);
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [user]);

  const greeting = user?.displayName?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {greeting}</h1>
        <p className="mt-1 text-muted-foreground">Here's what's in your vault.</p>
      </div>

      {state === "error" && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
          <div className="flex-1">
            <p className="font-medium text-foreground">Couldn't load your records</p>
            <p className="text-muted-foreground">Check your connection or Firestore rules and try again.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total records", value: counts?.total, icon: FileText },
          { label: "Prescriptions", value: counts?.prescription, icon: Pill },
          { label: "Reports", value: counts?.report, icon: Stethoscope },
          { label: "Scans", value: counts?.scan, icon: ScanLine },
        ].map((s) => (
          <Card key={s.label} className="hv-glass hv-card-hover border-0">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                {state === "loading" ? (
                  <Skeleton className="mt-2 h-8 w-12" />
                ) : (
                  <p className="mt-1 text-3xl font-bold">{s.value ?? 0}</p>
                )}
              </div>
              <s.icon className="h-8 w-8 text-primary/70" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting started checklist when empty */}
      {state === "ok" && counts?.total === 0 && (
        <Card className="hv-glass border-primary/30 bg-gradient-to-br from-sky-50/80 to-indigo-50/60 dark:from-sky-500/10 dark:to-indigo-500/10">
          <CardHeader>
            <CardTitle className="text-lg">Getting started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ChecklistItem
              done={!!hasEmergency}
              label="Complete your emergency profile"
              cta="Set up"
              to="/dashboard/emergency"
            />
            <ChecklistItem
              done={false}
              label="Upload your first medical record"
              cta="Upload"
              to="/dashboard/upload"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hv-glass border-0 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent records</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/records">View all <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {state === "loading" ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : recent.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No records yet.{" "}
                <Link to="/dashboard/upload" className="font-medium text-primary hover:underline">
                  Upload your first
                </Link>
              </div>
            ) : (
              recent.map((r) => (
                <Link
                  key={r.id}
                  to="/dashboard/records"
                  className="flex items-center justify-between rounded-lg border border-white/50 dark:border-white/10 bg-white/50 dark:bg-white/5 p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.category}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="hv-glass hv-card-hover border-0">
            <CardContent className="space-y-3 p-5">
              <Upload className="h-6 w-6 text-primary" />
              <p className="font-semibold">Upload a record</p>
              <p className="text-sm text-muted-foreground">Add prescriptions, reports, or scans.</p>
              <Button className="w-full" asChild>
                <Link to="/dashboard/upload">Upload</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="hv-glass hv-card-hover border-0">
            <CardContent className="space-y-3 p-5">
              <HeartPulse className="h-6 w-6 text-destructive" />
              <p className="font-semibold">Emergency profile</p>
              <p className="text-sm text-muted-foreground">QR + public link for first responders.</p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard/emergency">Manage</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ done, label, cta, to }: { done: boolean; label: string; cta: string; to: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-card p-3">
      <div className="flex items-center gap-3">
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
        <span className={done ? "text-muted-foreground line-through" : "font-medium"}>{label}</span>
      </div>
      {!done && (
        <Button size="sm" asChild>
          <Link to={to}>{cta}</Link>
        </Button>
      )}
    </div>
  );
}
