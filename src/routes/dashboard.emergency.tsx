import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { HeartPulse, Loader2, Share2, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/dashboard/emergency")({
  component: EmergencyPage,
});

type EP = { bloodGroup: string; allergies: string; medications: string; contact: string; name?: string };

function EmergencyPage() {
  const { user } = useAuth();
  const [data, setData] = useState<EP>({ bloodGroup: "", allergies: "", medications: "", contact: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      const d = snap.data();
      if (d?.emergencyProfile) setData(d.emergencyProfile);
      setLoading(false);
    })();
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      // private (full) copy
      await setDoc(doc(db, "users", user.uid), { emergencyProfile: data }, { merge: true });
      // public mirror — what is exposed via /emergency/:uid
      await setDoc(doc(db, "publicEmergency", user.uid), {
        name: user.displayName || user.email?.split("@")[0] || "Patient",
        bloodGroup: data.bloodGroup,
        allergies: data.allergies,
        medications: data.medications,
        contact: data.contact,
        updatedAt: Date.now(),
      });
      toast.success("Emergency profile saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const url = user ? `${typeof window !== "undefined" ? window.location.origin : ""}/emergency/${user.uid}` : "";

  function copy() {
    navigator.clipboard.writeText(url);
    toast.success("Public link copied");
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-6 md:grid-cols-3 md:p-10">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-destructive" /> Emergency profile</CardTitle>
          <CardDescription>Visible to anyone with the public link or QR. Keep it minimal & accurate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Blood group</Label>
                  <Input value={data.bloodGroup} onChange={(e) => setData({ ...data, bloodGroup: e.target.value })} placeholder="O+" />
                </div>
                <div>
                  <Label>Emergency contact</Label>
                  <Input value={data.contact} onChange={(e) => setData({ ...data, contact: e.target.value })} placeholder="+91 ..." />
                </div>
              </div>
              <div>
                <Label>Allergies</Label>
                <Textarea value={data.allergies} onChange={(e) => setData({ ...data, allergies: e.target.value })} placeholder="Penicillin, peanuts…" />
              </div>
              <div>
                <Label>Current medications</Label>
                <Textarea value={data.medications} onChange={(e) => setData({ ...data, medications: e.target.value })} placeholder="Metformin 500mg…" />
              </div>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" /> Public link</CardTitle>
          <CardDescription>Print, save, or share with first responders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center rounded-xl bg-white p-4">
            {url && <QRCodeSVG value={url} size={180} />}
          </div>
          <div className="space-y-2">
            <Input readOnly value={url} className="text-xs" />
            <Button variant="outline" className="w-full" onClick={copy}><Copy className="h-4 w-4" /> Copy link</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
