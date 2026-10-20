export type Film = {
  id: string;
  slug: string;
  title: string;
  year: number;
  runtime: number;
  country: string;
  genres: string[];
  score?: number;
  ratingCount?: number;
  ageRating: string;
  synopsis: string;
  director: string;
  isOriginal?: boolean;
  moods: string[];
  youtubeId?: string;
  posterUrl?: string;
  trailerUrl?: string;
  trailerLowBandwidthUrl?: string;
  trailerDuration?: number;
  themes: string[];
  region: string;
  contentFormat: "Feature Films" | "Short Films" | "Documentaries" | "Series" | "Mini-Series" | "TV Specials" | "Anthologies" | "Animation and Shorts";
  audioLanguages: string[];
  subtitleLanguages: string[];
  videoQualities: string[];
  access: "Free" | "Subscription" | "Rental" | "Purchase";
  popularity: number;
  addedAt: string;
  featured?: boolean;
  trending?: boolean;
  heroOrder?: number;
  heroDisplaySeconds?: number;
};

const youtubePoster = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

export const films: Film[] = [
  { id: "b28-threshold", slug: "threshold", title: "Threshold", year: 2026, runtime: 12, country: "Kenya", region: "East Africa", genres: ["Drama", "Romance"], themes: ["Love and Relationships", "Coming of Age"], contentFormat: "Short Films", audioLanguages: ["English"], subtitleLanguages: [], videoQualities: ["720p"], access: "Subscription", popularity: 88, addedAt: "2026-10-15", featured: true, trending: true, ageRating: "Unrated", synopsis: "A Kenyan story exploring the pressure, hope and heartbreak inside young relationships.", director: "B28 Entertainment", moods: ["Emotional", "Romantic"], youtubeId: "mN1VCgEjXcg", posterUrl: youtubePoster("mN1VCgEjXcg") },
  { id: "b28-shattered", slug: "shattered", title: "Shattered", year: 2026, runtime: 18, country: "Kenya", region: "East Africa", genres: ["Drama", "Short Films"], themes: ["Psychological Drama", "Identity and Belonging"], contentFormat: "Short Films", audioLanguages: ["English"], subtitleLanguages: [], videoQualities: ["720p"], access: "Subscription", popularity: 77, addedAt: "2026-10-14", featured: true, ageRating: "Unrated", synopsis: "A short film about the invisible emotional weight people carry behind ordinary appearances.", director: "B28 Entertainment", moods: ["Emotional", "Thought-provoking"], youtubeId: "vIvOkmZxvYg", posterUrl: youtubePoster("vIvOkmZxvYg") },
  { id: "b28-betrayed", slug: "betrayed", title: "Betrayed", year: 2025, runtime: 9, country: "Kenya", region: "East Africa", genres: ["Drama", "Short Films"], themes: ["Betrayal", "Revenge"], contentFormat: "Short Films", audioLanguages: ["English"], subtitleLanguages: [], videoQualities: ["720p"], access: "Free", popularity: 81, addedAt: "2026-10-13", trending: true, ageRating: "Unrated", synopsis: "A compact Kenyan drama about trust, loyalty and the consequences of betrayal.", director: "B28 Entertainment", moods: ["Intense", "Short watch"], youtubeId: "faBS1DkOivM", posterUrl: youtubePoster("faBS1DkOivM") },
  { id: "b28-please-call-me", slug: "please-call-me", title: "Please Call Me", year: 2025, runtime: 0, country: "Kenya", region: "East Africa", genres: ["Drama"], themes: ["Social Justice", "Identity and Belonging"], contentFormat: "Feature Films", audioLanguages: ["English", "Swahili"], subtitleLanguages: [], videoQualities: ["720p"], access: "Subscription", popularity: 69, addedAt: "2026-10-12", ageRating: "Unrated", synopsis: "A Nairobi-set film confronting the quiet struggles carried by a woman whose story is too easily overlooked.", director: "B28 Entertainment", moods: ["Emotional", "Cultural"], youtubeId: "JJ8rAKMJOfA", posterUrl: youtubePoster("JJ8rAKMJOfA") },
  { id: "b28-kiza", slug: "kiza", title: "Kiza", year: 2025, runtime: 19, country: "Kenya", region: "East Africa", genres: ["Drama"], themes: ["Coming of Age", "Survival"], contentFormat: "Short Films", audioLanguages: ["Swahili"], subtitleLanguages: ["English"], videoQualities: ["720p"], access: "Subscription", popularity: 72, addedAt: "2026-10-11", ageRating: "Unrated", synopsis: "A Kenyan youth drama centered on the uncertainty and struggles of finding a way forward.", director: "B28 Entertainment", moods: ["Emotional", "Inspirational"], youtubeId: "JpKsOGtn5J0", posterUrl: youtubePoster("JpKsOGtn5J0") },
  { id: "b28-fragile-hearts", slug: "fragile-hearts", title: "Fragile Hearts", year: 2024, runtime: 0, country: "Kenya", region: "East Africa", genres: ["Drama", "Romance"], themes: ["Love and Relationships", "Family Conflict"], contentFormat: "Feature Films", audioLanguages: ["English"], subtitleLanguages: [], videoQualities: ["720p"], access: "Subscription", popularity: 64, addedAt: "2026-10-10", ageRating: "Unrated", synopsis: "A Kenyan relationship drama about vulnerable hearts and the choices that test them.", director: "B28 Entertainment", moods: ["Romantic", "Emotional"], youtubeId: "sSmx-umq-lU", posterUrl: youtubePoster("sSmx-umq-lU") },
];

export const homeSections = [
  { title: "B28 Film Premiere", kicker: "Now showing on ORUN", filmIds: films.map((film) => film.id) },
  { title: "Kenyan stories", filmIds: ["b28-threshold", "b28-please-call-me", "b28-kiza", "b28-fragile-hearts"] },
  { title: "Short films", kicker: "Watch something powerful", filmIds: ["b28-shattered", "b28-betrayed", "b28-threshold"] },
];
