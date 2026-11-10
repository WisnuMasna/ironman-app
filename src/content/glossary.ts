/**
 * Plain-language glossary for Tri-plan jargon.
 * SOURCE: PLAN.md §6.4 item 3 / DESIGN.md §5.9
 */

export type GlossaryEntry = {
  term: string;
  plain: string;
  detail: string;
  sourceUrl?: string;
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "FTP",
    plain: "your bike threshold power",
    detail:
      "Functional Threshold Power — roughly the highest power you can hold for about an hour. Zones are percentages of FTP.",
    sourceUrl: "https://www.trainingpeaks.com/blog/power-training-levels/",
  },
  {
    term: "CSS",
    plain: "your steady swim pace",
    detail:
      "Critical Swim Speed from a 400 m + 200 m test: (T400 − T200) / 2, in seconds per 100 m.",
    sourceUrl: "https://www.trainingpeaks.com/blog/threshold-tests-for-swim-bike-and-run/",
  },
  {
    term: "Zone",
    plain: "how hard the session should feel",
    detail:
      "Training intensity band. Z2 is easy conversational work; Z4 is threshold effort.",
  },
  {
    term: "Z2",
    plain: "Easy, can chat",
    detail: "Aerobic endurance. You should be able to hold a conversation.",
  },
  {
    term: "Brick",
    plain: "bike then run straight away",
    detail:
      "A combined session that practices the bike-to-run transition used on race day.",
  },
  {
    term: "Taper",
    plain: "cutting volume before race day",
    detail:
      "Two weeks of reduced volume while keeping intensity and frequency, so you arrive fresh.",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/17762369/",
  },
  {
    term: "RPE",
    plain: "how hard it felt (1–10)",
    detail: "Rate of Perceived Exertion. Used in skill mode when zones are not set yet.",
  },
  {
    term: "Cut-off",
    plain: "time limit that ends your race",
    detail:
      "Official time limits for swim, swim+T1+bike, and the whole race from the athlete guide.",
  },
  {
    term: "T1",
    plain: "swim-to-bike transition",
    detail: "Time spent changing from swim kit to bike kit in transition.",
  },
  {
    term: "T2",
    plain: "bike-to-run transition",
    detail: "Time spent racking the bike and starting the run.",
  },
  {
    term: "B race",
    plain: "important practice race",
    detail:
      "A race you prepare for with a short mini-taper, but that is not your main A race.",
  },
  {
    term: "Skill mode",
    plain: "learning checkpoints instead of zones",
    detail:
      "Used when a sport has no test result yet. Sessions use RPE and skill goals, not power/pace zones.",
  },
];

export function findGlossaryTerm(term: string): GlossaryEntry | null {
  const needle = term.trim().toLowerCase();
  return (
    GLOSSARY.find((entry) => entry.term.toLowerCase() === needle) ?? null
  );
}
