import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Shield,
  Upload,
  QrCode,
  HeartPulse,
  Lock,
  Share2,
  Moon,
  Sun,
  ArrowRight,
  FolderKanban,
  Droplet,
  AlertTriangle,
  Pill,
} from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import heroImg from "@/assets/hero-healthcare.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen hv-app-bg text-foreground">
      <header className="sticky top-0 z-30 border-b border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <HeartPulse className="h-4 w-4" />
            </span>
            HealthVault
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <a href="#benefits" className="hover:text-foreground">
              Benefits
            </a>
            {user && (
              <Link to="/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="hv-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,#E0F2FE,#FFFFFF_70%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_60%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Shield className="h-3 w-3" /> Encrypted • Owner-controlled
            </span>
            <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              Your medical history,
              <br />
              <span className="bg-gradient-to-r from-[oklch(0.65_0.18_180)] to-[oklch(0.6_0.22_25)] bg-clip-text text-transparent">
                unified and ready.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Store prescriptions, scans and reports in one secure vault. Share a single link with
              any doctor — or expose your emergency profile via QR when seconds count.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to={user ? "/dashboard" : "/signup"}>
                  {user ? "Open dashboard" : "Get started"} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to={user ? "/dashboard" : "/login"}>
                  {user ? "View records" : "I already have an account"}
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative mx-auto w-full max-w-md md:max-w-none md:pb-16"
          >
            <div
              className="relative overflow-hidden rounded-2xl border border-white/60 dark:border-white/10"
              style={{
                boxShadow: "0 20px 40px rgba(0,0,0,0.10), 0 6px 16px rgba(2,132,199,0.06)",
              }}
            >
              <img
                src={heroImg}
                alt="Doctor reviewing a patient's HealthVault dashboard on a tablet"
                width={1280}
                height={960}
                loading="eager"
                className="aspect-[4/3] w-full object-cover scale-[1.05]"
                style={{
                  filter: "contrast(1.08) brightness(0.92) saturate(1.1)",
                }}
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
            </div>

            {/* Floating glass emergency card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative -mt-10 mx-4 rounded-2xl border border-white/60 p-4 md:absolute md:-bottom-10 md:-left-6 md:mt-0 md:mx-0 md:w-[78%] md:max-w-xs md:p-5 dark:border-white/10"
              style={{
                background: theme === "dark" ? "rgba(15,23,42,0.78)" : "rgba(255,255,255,0.92)",

                backdropFilter: theme === "dark" ? "blur(12px)" : "blur(8px)",

                WebkitBackdropFilter: theme === "dark" ? "blur(12px)" : "blur(8px)",

                boxShadow:
                  theme === "dark" ? "0 20px 45px rgba(0,0,0,0.6)" : "0 18px 36px rgba(0,0,0,0.10)",

                border:
                  theme === "dark"
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(255,255,255,0.6)",

                transform: "translateZ(0)",
              }}
            >
              <div className="flex items-center gap-3 border-b border-white/40 dark:border-white/10 pb-3">
                <div className="hv-emergency-glow grid h-10 w-10 place-items-center rounded-full bg-red-500 text-white">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Emergency Profile</p>
                  <p className="text-xs text-muted-foreground">Public read-only access</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Blood
                    </p>
                    <p className="font-bold text-red-600 dark:text-red-400">O+</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Allergy
                    </p>
                    <p className="font-semibold">Penicillin</p>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-sky-500" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Medication
                    </p>
                    <p className="font-semibold">Metformin 500mg</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-muted/30 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything your records need
            </h2>
            <p className="mt-3 text-muted-foreground">A small set of features, done well.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Upload,
                title: "Secure upload",
                desc: "Drag & drop scans, PDFs, images. Encrypted-in-transit via Cloudinary.",
              },
              {
                icon: FolderKanban,
                title: "Smart organization",
                desc: "Auto-categorized by type — prescriptions, reports, scans — with timeline view.",
              },
              {
                icon: QrCode,
                title: "Emergency QR access",
                desc: "Print or save a QR — paramedics get vital info in seconds, no login required.",
              },
              {
                icon: Share2,
                title: "Token-based sharing",
                desc: "Send a secure, revocable link to any doctor. No raw IDs exposed.",
              },
              {
                icon: Lock,
                title: "Owner-controlled",
                desc: "Firestore rules ensure only you can write your records.",
              },
              {
                icon: Shield,
                title: "Privacy-first",
                desc: "Your data, your control — works anywhere with a browser.",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="hv-glass hv-card-hover p-6"
              >
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/60 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">Three steps to a unified medical history.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Upload",
                desc: "Drop in any file — image, PDF or scan. We auto-detect the category.",
              },
              {
                n: "02",
                title: "Organize",
                desc: "Records appear on a clean monthly timeline you can search and filter.",
              },
              {
                n: "03",
                title: "Share",
                desc: "Generate a secure link or QR. Doctors and paramedics view, no login.",
              },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="hv-glass hv-card-hover p-6"
              >
                <span className="text-xs font-bold tracking-[0.2em] text-primary">STEP {s.n}</span>
                <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="border-t border-border/60 bg-muted/30 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Built for the moments that matter
              </h2>
              <p className="mt-3 text-muted-foreground">
                When you change doctors, travel, or face an emergency — your full medical history is
                one tap away.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Privacy-first: your records never leave your control",
                  "Instant access from any device with a browser",
                  "Works anywhere — no app store, no installs",
                  "Free tier — runs on Firebase + Cloudinary at zero cost",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Shield className="h-3 w-3" />
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button size="lg" asChild>
                  <Link to={user ? "/dashboard" : "/signup"}>
                    {user ? "Open dashboard" : "Create your vault"}{" "}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
              <p className="text-sm font-semibold text-muted-foreground">
                "My ER doctor scanned my QR and saw my full allergy list in seconds. It probably
                saved my life."
              </p>
              <p className="mt-4 text-xs text-muted-foreground">— Patient, anonymized</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        <p>HealthVault • Built with Firebase + Cloudinary</p>
      </footer>
    </div>
  );
}
