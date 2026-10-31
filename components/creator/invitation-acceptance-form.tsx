"use client";
import { useState } from "react";
const field =
  "w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-amber/60";
export function InvitationAcceptanceForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [form, setForm] = useState({
      displayName: "",
      productionCompany: "",
      biography: "",
      websiteUrl: "",
      countryCode: "KE",
      acceptTerms: false,
      acceptContentTerms: false,
    });
  const set = (key: string, value: string | boolean) =>
    setForm((valueBefore) => ({ ...valueBefore, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(
          `/api/creator/invitations/${encodeURIComponent(token)}/accept`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(form),
          },
        ),
        body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error);
      setNotice(
        "Application received. The ORUN owner must approve access before the filmmaker portal opens.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to accept invitation",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <input
        required
        className={field}
        placeholder="Filmmaker or studio name"
        value={form.displayName}
        onChange={(e) => set("displayName", e.target.value)}
      />
      <input
        className={field}
        placeholder="Production company (optional)"
        value={form.productionCompany}
        onChange={(e) => set("productionCompany", e.target.value)}
      />
      <textarea
        className={`${field} min-h-28`}
        placeholder="Creator biography"
        value={form.biography}
        onChange={(e) => set("biography", e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
        <input
          className={field}
          type="url"
          placeholder="Website (optional)"
          value={form.websiteUrl}
          onChange={(e) => set("websiteUrl", e.target.value)}
        />
        <input
          required
          className={field}
          maxLength={2}
          value={form.countryCode}
          onChange={(e) => set("countryCode", e.target.value.toUpperCase())}
        />
      </div>
      <label className="flex gap-3 text-sm text-white/65">
        <input
          required
          type="checkbox"
          checked={form.acceptTerms}
          onChange={(e) => set("acceptTerms", e.target.checked)}
        />{" "}
        I accept the ORUN platform terms.
      </label>
      <label className="flex gap-3 text-sm text-white/65">
        <input
          required
          type="checkbox"
          checked={form.acceptContentTerms}
          onChange={(e) => set("acceptContentTerms", e.target.checked)}
        />{" "}
        I accept the content-submission and rights requirements.
      </label>
      <button
        disabled={busy}
        className="w-full rounded-full bg-amber px-6 py-3 font-semibold text-black disabled:opacity-50"
      >
        {busy ? "Submitting…" : "Submit for owner approval"}
      </button>
      {notice && (
        <p role="status" className="text-sm text-amber">
          {notice}
        </p>
      )}
    </form>
  );
}
