"use client";
import { useState } from "react";
const steps = ["Story", "Credits", "Accessibility", "Rights", "Assets"];
const field =
  "w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-amber/60";
export function FilmSubmissionWizard() {
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [submissionId, setSubmissionId] = useState("");
  const [data, setData] = useState({
    title: "",
    synopsis: "",
    description: "",
    contentFormat: "FEATURE_FILM",
    genre: "",
    themes: "",
    languageCode: "en",
    countryCode: "KE",
    releaseYear: new Date().getFullYear(),
    runtimeMinutes: 90,
    director: "",
    audienceClassification: "",
    productionCompany: "",
    castAndCrew: "",
    audioLanguages: "en",
    subtitleLanguages: "",
    closedCaptions: false,
    audioDescription: false,
    territories: "Worldwide",
    declaration:
      "I confirm that I control the rights required to submit and distribute this film on ORUN.",
    ownsRights: false,
  });
  const set = (key: string, value: string | number | boolean) =>
    setData((current) => ({ ...current, [key]: value }));
  async function saveDraft() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/creator/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          metadata: {
            title: data.title,
            synopsis: data.synopsis,
            description: data.description,
            contentFormat: data.contentFormat,
            genreIds: data.genre
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            subgenreIds: [],
            themeIds: data.themes
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            languageCode: data.languageCode,
            countryCode: data.countryCode.toUpperCase(),
            releaseYear: Number(data.releaseYear),
            runtimeMinutes: Number(data.runtimeMinutes),
            director: data.director,
            credits: data.productionCompany
              ? [{ name: data.productionCompany, role: "Production company" }]
              : [],
            castAndCrew: data.castAndCrew
              .split("\n")
              .filter(Boolean)
              .map((value) => ({ name: value, role: "Cast / crew" })),
            audienceClassification: data.audienceClassification,
            audioLanguages: data.audioLanguages
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            subtitleLanguages: data.subtitleLanguages
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            closedCaptions: data.closedCaptions,
            audioDescription: data.audioDescription,
          },
          rightsDeclaration: {
            ownsRights: data.ownsRights,
            territories: data.territories
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            declaration: data.declaration,
          },
        }),
      });
      const body = (await response.json()) as { error?: string; submission: { id: string } };
      if (!response.ok) throw new Error(body.error || "Unable to save draft");
      setSubmissionId(body.submission.id);
      setStep(4);
      setNotice(
        "Draft saved. You can now create private upload tickets for its assets.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to save draft",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[.035] p-5 md:p-8">
      <div className="mb-8 grid grid-cols-5 gap-2">
        {steps.map((label, index) => (
          <button
            type="button"
            key={label}
            onClick={() => setStep(index)}
            className={`rounded-full px-2 py-2 text-xs ${index === step ? "bg-amber text-black" : "bg-white/5 text-white/45"}`}
          >
            {index + 1}. <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
      {step === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className={field}
            placeholder="Film title"
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
          />
          <select
            className={field}
            value={data.contentFormat}
            onChange={(e) => set("contentFormat", e.target.value)}
          >
            <option>FEATURE_FILM</option>
            <option>SHORT_FILM</option>
            <option>DOCUMENTARY</option>
            <option>SERIES</option>
          </select>
          <textarea
            className={`${field} md:col-span-2`}
            placeholder="Short synopsis"
            value={data.synopsis}
            onChange={(e) => set("synopsis", e.target.value)}
          />
          <textarea
            className={`${field} min-h-32 md:col-span-2`}
            placeholder="Full description"
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <input
            className={field}
            placeholder="Genre IDs, comma-separated"
            value={data.genre}
            onChange={(e) => set("genre", e.target.value)}
          />
          <input
            className={field}
            placeholder="Theme IDs, comma-separated"
            value={data.themes}
            onChange={(e) => set("themes", e.target.value)}
          />
          <input
            className={field}
            placeholder="Language code"
            value={data.languageCode}
            onChange={(e) => set("languageCode", e.target.value)}
          />
          <input
            className={field}
            placeholder="Country code"
            value={data.countryCode}
            onChange={(e) => set("countryCode", e.target.value)}
          />
          <input
            className={field}
            type="number"
            value={data.releaseYear}
            onChange={(e) => set("releaseYear", Number(e.target.value))}
          />
          <input
            className={field}
            type="number"
            placeholder="Runtime minutes"
            value={data.runtimeMinutes}
            onChange={(e) => set("runtimeMinutes", Number(e.target.value))}
          />
          <input
            className={field}
            placeholder="Audience classification"
            value={data.audienceClassification}
            onChange={(e) => set("audienceClassification", e.target.value)}
          />
        </div>
      )}
      {step === 1 && (
        <div className="grid gap-4">
          <input
            className={field}
            placeholder="Director"
            value={data.director}
            onChange={(e) => set("director", e.target.value)}
          />
          <input
            className={field}
            placeholder="Production company"
            value={data.productionCompany}
            onChange={(e) => set("productionCompany", e.target.value)}
          />
          <textarea
            className={`${field} min-h-40`}
            placeholder="Cast and crew — one name per line"
            value={data.castAndCrew}
            onChange={(e) => set("castAndCrew", e.target.value)}
          />
        </div>
      )}
      {step === 2 && (
        <div className="grid gap-4">
          <input
            className={field}
            placeholder="Audio languages"
            value={data.audioLanguages}
            onChange={(e) => set("audioLanguages", e.target.value)}
          />
          <input
            className={field}
            placeholder="Subtitle languages"
            value={data.subtitleLanguages}
            onChange={(e) => set("subtitleLanguages", e.target.value)}
          />
          <label className="flex gap-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={data.closedCaptions}
              onChange={(e) => set("closedCaptions", e.target.checked)}
            />{" "}
            Closed captions available
          </label>
          <label className="flex gap-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={data.audioDescription}
              onChange={(e) => set("audioDescription", e.target.checked)}
            />{" "}
            Audio description available
          </label>
        </div>
      )}
      {step === 3 && (
        <div className="grid gap-4">
          <input
            className={field}
            placeholder="Licensed territories"
            value={data.territories}
            onChange={(e) => set("territories", e.target.value)}
          />
          <textarea
            className={`${field} min-h-40`}
            value={data.declaration}
            onChange={(e) => set("declaration", e.target.value)}
          />
          <label className="flex gap-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={data.ownsRights}
              onChange={(e) => set("ownsRights", e.target.checked)}
            />{" "}
            I accept the rights and distribution declaration.
          </label>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-display text-2xl">Private assets</h2>
          <p className="text-sm text-white/50">
            Poster, thumbnail, trailer, main video, subtitles, captions, audio
            tracks and supporting files remain private until the exact
            submission version is approved and separately published.
          </p>
          {submissionId ? (
            <p className="rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-300">
              Draft reference: {submissionId}. Asset upload tickets are issued
              through the protected upload API.
            </p>
          ) : (
            <p className="rounded-xl bg-amber/10 p-4 text-sm text-amber">
              Save the metadata draft before uploading assets.
            </p>
          )}
        </div>
      )}
      <div className="mt-8 flex flex-wrap justify-between gap-3">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          className="rounded-full border border-white/15 px-5 py-2 text-sm disabled:opacity-30"
        >
          Back
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((value) => value + 1)}
            className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-black"
          >
            Continue
          </button>
        ) : step === 3 ? (
          <button
            type="button"
            disabled={busy || !data.ownsRights}
            onClick={saveDraft}
            className="rounded-full bg-amber px-6 py-2 text-sm font-semibold text-black disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save private draft"}
          </button>
        ) : null}
      </div>
      {notice && (
        <p role="status" className="mt-5 text-sm text-amber">
          {notice}
        </p>
      )}
    </section>
  );
}
