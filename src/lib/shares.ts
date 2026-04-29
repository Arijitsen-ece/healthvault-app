import { addDoc, collection, getDocs, query, serverTimestamp, where, limit } from "firebase/firestore";
import { db } from "./firebase";

/** Cryptographically random URL-safe token. */
function randomToken(len = 24): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, len);
}

/**
 * Create or reuse an active share token for a record.
 * Returns the token string.
 */
export async function getOrCreateShareToken(recordId: string, ownerId: string): Promise<string> {
  // Reuse an existing active token if present
  const q = query(
    collection(db, "shares"),
    where("recordId", "==", recordId),
    where("ownerId", "==", ownerId),
    limit(1),
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0].data() as any;
    if (d.token) return d.token as string;
  }
  const token = randomToken(24);
  await addDoc(collection(db, "shares"), {
    token,
    recordId,
    ownerId,
    createdAt: serverTimestamp(),
    expiresAt: null, // future: set TTL
  });
  return token;
}

export function shareUrl(token: string): string {
  if (typeof window === "undefined") return `/s/${token}`;
  return `${window.location.origin}/s/${token}`;
}
