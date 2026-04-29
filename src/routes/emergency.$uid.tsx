import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HeartPulse, Phone, AlertTriangle, FileWarning, Pill, Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/emergency/$uid")({
  component: EmergencyPublicPage,
});

function EmergencyPublicPage() {
  const { uid } = Route.useParams();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setStatus((s) => (s === "loading" ? "error" : s));
    }, 10000);

    (async () => {
      try {
        const snap = await getDoc(doc(db, "publicEmergency", uid));
        if (cancelled) return;
        if (!snap.exists()) { setStatus("missing"); return; }
        setData(snap.data());
        setStatus("ok");
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [uid]);

  if (status === "loading") return <div className="mx-auto max-w-md p-6"><Skeleton className="h-72 w-full" /></div>;
  if (status === "missing" || status === "error") {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <FileWarning className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">
          {status === "error" ? "Couldn't load profile" : "Profile not found"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {status === "error"
            ? "Please check your connection and try again."
            : "This patient hasn't published an emergency profile yet."}
        </p>
        <Button asChild className="mt-6"><Link to="/">Go home</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/15 via-background to-background p-4 md:p-10">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold">
            <HeartPulse className="h-4 w-4 text-primary" /> HealthVault
          </Link>
          <Badge variant="destructive" className="hv-emergency-glow gap-1">
            <AlertTriangle className="h-3 w-3" /> Emergency Mode
          </Badge>
        </div>

        <Card className="overflow-hidden border-destructive/40 shadow-xl">
          <div className="bg-destructive px-6 py-4 text-destructive-foreground">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Emergency medical info</p>
            <h1 className="mt-1 text-2xl font-bold">{data.name}</h1>
          </div>
          <CardContent className="space-y-5 p-6">
            {/* Blood group — prominent */}
            {data.bloodGroup && (
              <div className="flex items-center gap-4 rounded-xl border-2 border-destructive/40 bg-destructive/10 p-4">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-destructive text-destructive-foreground">
                  <Droplet className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Blood group</p>
                  <p className="text-3xl font-extrabold text-destructive">{data.bloodGroup}</p>
                </div>
              </div>
            )}

            {/* Allergies — alert section */}
            <section className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" /> Allergies
              </div>
              <p className="text-sm">{data.allergies?.trim() || "None reported"}</p>
            </section>

            {/* Medications */}
            <section className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Pill className="h-4 w-4 text-primary" /> Current medications
              </div>
              <p className="text-sm">{data.medications?.trim() || "None reported"}</p>
            </section>

            {/* Contact */}
            {data.contact && (
              <Button asChild className="w-full" size="lg" variant="destructive">
                <a href={`tel:${data.contact}`}>
                  <Phone className="h-4 w-4" /> Call emergency contact — {data.contact}
                </a>
              </Button>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Read-only public profile. For full medical history, contact the listed person above.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
