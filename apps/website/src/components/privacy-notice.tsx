"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "oncologo_privacy_notice_seen";

/**
 * Minimal first-visit privacy notice. We currently load no third-party
 * scripts, so this is informational rather than gating. Persists dismissal
 * in localStorage; survives reloads, forgotten on browser data clear.
 */
export function PrivacyNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // SSR-safe pattern: render hidden first so server + client agree,
        // then surface after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
      }
    } catch {
      // private mode / storage disabled — silently skip the banner
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Informativa sulla privacy"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-lg border border-border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:inset-x-auto sm:right-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2 text-sm">
          <p className="font-medium text-foreground">
            Usiamo solo cookie tecnici
          </p>
          <p className="text-muted-foreground">
            Questo sito utilizza esclusivamente cookie strettamente necessari al
            funzionamento. Nessun tracciamento.{" "}
            <Link
              href="/cookie-policy"
              className="font-medium text-foreground underline hover:no-underline"
            >
              Cookie policy
            </Link>
            {" · "}
            <Link
              href="/privacy-policy"
              className="font-medium text-foreground underline hover:no-underline"
            >
              Privacy
            </Link>
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-1 inline-flex items-center justify-center rounded-md bg-foreground px-3 py-1 text-xs font-medium text-background hover:opacity-90"
          >
            Ho capito
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Chiudi"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
