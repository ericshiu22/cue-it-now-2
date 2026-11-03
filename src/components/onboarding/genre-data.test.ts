import { describe, it, expect } from "vitest";
import { GENRE_LIST, GENRE_SHOWS, getDedupedGenreShows, normalizeTitle } from "./genre-data";
import { GenreShowMap } from "./types";

const show = (title: string) => ({ title, poster: "🎬", year: "2024", service: "Netflix" });

describe("getDedupedGenreShows", () => {
  it("shows a title only under the first selected genre that has it", () => {
    const map: GenreShowMap = {
      Drama: [show("The Bear"), show("Shogun")],
      Comedy: [show("the bear"), show("Shrinking")],
    };
    expect(getDedupedGenreShows(["Drama", "Comedy"], map)).toEqual([
      { genre: "Drama", shows: [show("The Bear"), show("Shogun")] },
      { genre: "Comedy", shows: [show("Shrinking")] },
    ]);
    // Selection order decides which genre keeps it.
    expect(getDedupedGenreShows(["Comedy", "Drama"], map)[1].shows).toEqual([show("Shogun")]);
  });

  it("matches titles regardless of case, spacing or punctuation", () => {
    expect(normalizeTitle("  X-Men '97 ")).toBe(normalizeTitle("x men 97"));
  });

  it("never repeats a title for any 3 genres in the real data", () => {
    for (const a of GENRE_LIST)
      for (const b of GENRE_LIST)
        for (const c of GENRE_LIST) {
          if (new Set([a, b, c]).size < 3) continue;
          const titles = getDedupedGenreShows([a, b, c], GENRE_SHOWS).flatMap((g) =>
            g.shows.map((s) => normalizeTitle(s.title))
          );
          expect(new Set(titles).size).toBe(titles.length);
        }
  });
});
