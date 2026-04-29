import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { collection, deleteDoc, doc, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Trash2,
  Share2,
  QrCode as QrIcon,
  Search,
  Upload as UploadIcon,
  FileText,
  AlertTriangle,
  Pill,
  Stethoscope,
  ScanLine,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { getOrCreateShareToken, shareUrl } from "@/lib/shares";
import emptyImg from "@/assets/empty-records.png";

export const Route = createFileRoute("/dashboard/records")({
  component: RecordsPage,
});

type RecordItem = {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  createdAt?: { seconds: number };
};

const CATEGORY_STYLE: Record<string, { dot: string; bg: string; text: string; bar: string; icon: any; label: string }> = {
  Prescription: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", icon: Pill, label: "Prescription" },
  Report:       { dot: "bg-sky-500",     bg: "bg-sky-500/10",     text: "text-sky-600 dark:text-sky-400",         bar: "bg-sky-500",     icon: Stethoscope, label: "Report" },
  Scan:         { dot: "bg-violet-500",  bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400",   bar: "bg-violet-500",  icon: ScanLine, label: "Scan" },
};

function styleOf(cat: string) {
  return CATEGORY_STYLE[cat] || { dot: "bg-muted-foreground", bg: "bg-muted", text: "text-muted-foreground", bar: "bg-muted-foreground", icon: FileText, label: cat };
}

function monthLabel(seconds?: number) {
  if (!seconds) return "Undated";
  return new Date(seconds * 1000).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function RecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RecordItem[] | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<"new" | "old">("new");
  const [qrFor, setQrFor] = useState<{ token: string } | null>(null);
  const [shareBusyId, setShareBusyId] = useState<string | null>(null);

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
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as RecordItem[]);
        setState("ok");
      } catch (e) {
        console.error(e);
        if (!cancelled) setState("error");
      }
    })();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [user]);

  const filtered = useMemo(() => {
    if (!records) return null;
    let out = records.filter((r) => (filter === "all" ? true : r.category === filter));
    if (search.trim()) {
      const s = search.toLowerCase();
      out = out.filter((r) => r.title.toLowerCase().includes(s) || r.category.toLowerCase().includes(s));
    }
    out = [...out].sort((a, b) => {
      const av = a.createdAt?.seconds ?? 0;
      const bv = b.createdAt?.seconds ?? 0;
      return sort === "new" ? bv - av : av - bv;
    });
    return out;
  }, [records, search, filter, sort]);

  // Group by month
  const groups = useMemo(() => {
    if (!filtered) return null;
    const map = new Map<string, RecordItem[]>();
    for (const r of filtered) {
      const key = monthLabel(r.createdAt?.seconds);
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "records", id));
      setRecords((r) => r?.filter((x) => x.id !== id) ?? null);
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function copyShare(r: RecordItem) {
    if (!user) return;
    setShareBusyId(r.id);
    try {
      const token = await getOrCreateShareToken(r.id, user.uid);
      const url = shareUrl(token);
      await navigator.clipboard.writeText(url);
      toast.success("Secure share link copied");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't create share link");
    } finally {
      setShareBusyId(null);
    }
  }

  async function openQr(r: RecordItem) {
    if (!user) return;
    setShareBusyId(r.id);
    try {
      const token = await getOrCreateShareToken(r.id, user.uid);
      setQrFor({ token });
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't create share link");
    } finally {
      setShareBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Records</h1>
          <p className="text-muted-foreground">{records?.length ?? 0} total</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/upload">
            <UploadIcon className="h-4 w-4" /> Upload
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records…" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="Prescription">Prescription</SelectItem>
            <SelectItem value="Report">Report</SelectItem>
            <SelectItem value="Scan">Scan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v: any) => setSort(v)}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Newest first</SelectItem>
            <SelectItem value="old">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {state === "error" ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
          <div className="flex-1">
            <p className="font-medium">Couldn't load records</p>
            <p className="text-muted-foreground">Check your connection and Firestore rules.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : state === "loading" ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : filtered!.length === 0 ? (
        <div className="hv-glass p-12 text-center">
          <img src={emptyImg} alt="" width={140} height={140} className="mx-auto opacity-90" loading="lazy" />
          <p className="mt-4 text-lg font-semibold">Start building your health vault</p>
          <p className="mt-1 text-sm text-muted-foreground">Try changing filters, or upload your first medical record.</p>
          <Button asChild className="mt-5 hv-btn-pop">
            <Link to="/dashboard/upload"><UploadIcon className="h-4 w-4" /> Upload your first record</Link>
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border md:left-[19px]" aria-hidden />
          <div className="space-y-8">
            <AnimatePresence>
              {groups!.map(([month, items]) => (
                <motion.section
                  key={month}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-xs font-bold md:h-10 md:w-10">
                      {month.split(" ")[0].slice(0, 3)}
                    </span>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{month}</h2>
                  </div>

                  <div className="ml-10 space-y-3 md:ml-14">
                    {items.map((r) => {
                      const s = styleOf(r.category);
                      const Icon = s.icon;
                      return (
                        <motion.div
                          key={r.id}
                          layout
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="group relative overflow-hidden rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md p-4 pl-5 hv-card-hover"
                        >
                          <span className={`absolute inset-y-0 left-0 w-1.5 ${s.bar}`} aria-hidden />
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${s.bg} ${s.text}`}>
                                <Icon className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">{r.title}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <Badge variant="outline" className={`gap-1 ${s.text}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                                    {s.label}
                                  </Badge>
                                  {r.createdAt && (
                                    <span>{new Date(r.createdAt.seconds * 1000).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <a href={r.fileUrl} target="_blank" rel="noreferrer"><Eye className="h-3.5 w-3.5" /> View</a>
                              </Button>
                              <Button size="sm" variant="outline" disabled={shareBusyId === r.id} onClick={() => copyShare(r)}>
                                {shareBusyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />} Share
                              </Button>
                              <Button size="sm" variant="outline" disabled={shareBusyId === r.id} onClick={() => openQr(r)}>
                                <QrIcon className="h-3.5 w-3.5" /> QR
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.section>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <Dialog open={!!qrFor} onOpenChange={(o) => !o && setQrFor(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Scan to view</DialogTitle></DialogHeader>
          {qrFor && (
            <div className="flex flex-col items-center gap-3 p-2">
              <div className="rounded-xl bg-white p-4">
                <QRCodeSVG value={shareUrl(qrFor.token)} size={200} />
              </div>
              <p className="break-all text-center text-xs text-muted-foreground">
                {shareUrl(qrFor.token)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
