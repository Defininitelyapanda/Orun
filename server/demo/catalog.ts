export type Film = {
  id: string;
  slug: string;
  title: string;
  year: number;
  runtime: number;
  country: string;
  genres: string[];
  score?: number;
  ageRating: string;
  synopsis: string;
  director: string;
  isOriginal?: boolean;
  moods: string[];
  youtubeId?: string;
  posterUrl?: string;
};

const youtubePoster = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

export const films: Film[] = [
  { id: "b28-threshold", slug: "threshold", title: "Threshold", year: 2026, runtime: 12, country: "Kenya", genres: ["Drama", "Romance"], ageRating: "Unrated", synopsis: "A Kenyan story exploring the pressure, hope and heartbreak inside young relationships.", director: "B28 Entertainment", moods: ["Emotional", "Romantic"], youtubeId: "mN1VCgEjXcg", posterUrl: youtubePoster("mN1VCgEjXcg") },
  { id: "b28-shattered", slug: "shattered", title: "Shattered", year: 2026, runtime: 18, country: "Kenya", genres: ["Drama", "Short"], ageRating: "Unrated", synopsis: "A short film about the invisible emotional weight people carry behind ordinary appearances.", director: "B28 Entertainment", moods: ["Emotional", "Thought-provoking"], youtubeId: "vIvOkmZxvYg", posterUrl: youtubePoster("vIvOkmZxvYg") },
  { id: "b28-betrayed", slug: "betrayed", title: "Betrayed", year: 2025, runtime: 9, country: "Kenya", genres: ["Drama", "Short"], ageRating: "Unrated", synopsis: "A compact Kenyan drama about trust, loyalty and the consequences of betrayal.", director: "B28 Entertainment", moods: ["Intense", "Short watch"], youtubeId: "faBS1DkOivM", posterUrl: youtubePoster("faBS1DkOivM") },
  { id: "b28-please-call-me", slug: "please-call-me", title: "Please Call Me", year: 2025, runtime: 0, country: "Kenya", genres: ["Drama"], ageRating: "Unrated", synopsis: "A Nairobi-set film confronting the quiet struggles carried by a woman whose story is too easily overlooked.", director: "B28 Entertainment", moods: ["Emotional", "Cultural"], youtubeId: "JJ8rAKMJOfA", posterUrl: youtubePoster("JJ8rAKMJOfA") },
  { id: "b28-kiza", slug: "kiza", title: "Kiza", year: 2025, runtime: 19, country: "Kenya", genres: ["Drama", "Youth"], ageRating: "Unrated", synopsis: "A Kenyan youth drama centered on the uncertainty and struggles of finding a way forward.", director: "B28 Entertainment", moods: ["Emotional", "Inspirational"], youtubeId: "JpKsOGtn5J0", posterUrl: youtubePoster("JpKsOGtn5J0") },
  { id: "b28-fragile-hearts", slug: "fragile-hearts", title: "Fragile Hearts", year: 2024, runtime: 0, country: "Kenya", genres: ["Drama", "Romance"], ageRating: "Unrated", synopsis: "A Kenyan relationship drama about vulnerable hearts and the choices that test them.", director: "B28 Entertainment", moods: ["Romantic", "Emotional"], youtubeId: "sSmx-umq-lU", posterUrl: youtubePoster("sSmx-umq-lU") },
];

export const homeSections = [
  { title: "B28 Film Premiere", kicker: "Now showing on ORUN", filmIds: films.map((film) => film.id) },
  { title: "Kenyan stories", filmIds: ["b28-threshold", "b28-please-call-me", "b28-kiza", "b28-fragile-hearts"] },
  { title: "Short films", kicker: "Watch something powerful", filmIds: ["b28-shattered", "b28-betrayed", "b28-threshold"] },
];
