import type { PhaseName } from "./phases";
import type { PlannedSession } from "./sessions";

export type SessionStep = {
  name: string;
  durationMin: number;
  cue: string;
  zone?: string;
  skill?: string;
};

export type SessionPurpose = {
  title: string;
  headline: string;
  effortCue: string;
  why: string[];
  steps: SessionStep[];
};

export function sessionTitle(session: PlannedSession): string {
  if (session.sport === "brick") return "Brick: ride + run";
  if (session.sport === "bike" && session.outdoor) return "Outdoor ride";
  if (session.sport === "bike" && session.type === "spin") return "Spin bridge";
  if (session.type === "skill" || session.targets.kind === "skill") {
    return `${capitalize(session.sport)} lesson`;
  }
  if (session.type === "easy") return `Easy ${session.sport}`;
  return `${capitalize(session.type)} ${session.sport}`;
}

export function buildSessionPurpose(input: {
  session: PlannedSession;
  athleteFirstName: string;
  phase: PhaseName;
}): SessionPurpose {
  const { session, athleteFirstName, phase } = input;
  const title = sessionTitle(session);
  const name = athleteFirstName.trim() || "there";
  const steps = buildSteps(session);

  if (session.targets.kind === "skill") {
    const checkpoint = session.targets.checkpointHint;
    const sportNoun = session.sport === "swim" ? "water" : "bike";
    return {
      title,
      headline: `Skill work toward ${checkpoint}`,
      effortCue: `RPE ${session.targets.rpe} · keep it calm and curious`,
      why: [
        `${name}, this is a skill session — not a fitness test. You're building comfort and control in the ${sportNoun} so later training can use real zones safely.`,
        `Stay with ${checkpoint}: short, repeatable drills beat long grinding. Leave feeling more confident than when you started. ${phase} is the right time to bank these habits.`,
      ],
      steps,
    };
  }

  if (session.sport === "run" && (session.type === "easy" || session.targets.zone === "Z2")) {
    return {
      title,
      headline: `${session.durationMin} min at a conversational pace`,
      effortCue: "Z2 · Easy, can chat — a limit, not a target",
      why: [
        `Easy run day, ${name}. These are the runs where you don't have to think about training. No intervals, no mental maths — just head out, keep the effort relaxed, and let your mind wander.`,
        `Easy volume builds the aerobic base you'll race on and helps you absorb harder work later in the week. Enjoy the time for yourself; you'll come back feeling better than when you left.`,
      ],
      steps,
    };
  }

  if (session.sport === "bike" && session.outdoor) {
    return {
      title,
      headline: `${session.durationMin} min outdoor ride`,
      effortCue: zoneCue(session),
      why: [
        `${name}, this ride is about time in the saddle outdoors — handling, looking ahead, and keeping a steady effort you could hold while chatting.`,
        `Outdoor practice now means race-day roads feel familiar. Stay within your comfort zone for traffic and corners; fitness can wait until the bike skills are solid.`,
      ],
      steps,
    };
  }

  if (session.sport === "bike") {
    return {
      title,
      headline: `${session.durationMin} min indoor bridge`,
      effortCue: zoneCue(session),
      why: [
        `${name}, until the bike and fit are ready, indoor spins keep your legs turning without outdoor risk.`,
        `Treat it as a bridge: smooth cadence, easy breathing, and a posture you could hold for the full ${session.durationMin} minutes. Outdoor rides unlock once equipment and skills checkpoints say so.`,
      ],
      steps,
    };
  }

  if (session.sport === "swim") {
    return {
      title,
      headline: `${session.durationMin} min swim`,
      effortCue: zoneCue(session),
      why: [
        `${name}, this swim builds continuous, relaxed metres so open-water race pace feels less foreign later.`,
        `Focus on long exhales and an easy rhythm. Stop for technique resets if form falls apart — quality metres beat tired thrashing.`,
      ],
      steps,
    };
  }

  if (session.sport === "brick") {
    return {
      title,
      headline: "Ride + run off the bike",
      effortCue: "Steady bike → quick T2 → easy run legs",
      why: [
        `${name}, bricks teach your legs what race day feels like: finishing a ride and then running when they feel heavy.`,
        `Keep the bike controlled, practise a tidy T2, and start the run easy. The win is the transition skill, not a hero pace.`,
      ],
      steps,
    };
  }

  if (session.sport === "strength") {
    return {
      title,
      headline: `${session.durationMin} min strength`,
      effortCue: "Controlled, full range — leave two reps in reserve",
      why: [
        `${name}, strength work supports durable swim/bike/run posture and helps you stay injury-resistant through ${phase}.`,
        `Move smoothly, breathe, and stop before form breaks. This is insurance for the long plan, not a max-out day.`,
      ],
      steps,
    };
  }

  return {
    title,
    headline: `${session.durationMin} min ${session.sport}`,
    effortCue: zoneCue(session),
    why: [
      `${name}, this session earns its place in ${phase}: the right dose of ${session.sport} work without stealing recovery from key days.`,
      `Hit the planned effort, then stop. Consistency beats one heroic outing.`,
    ],
    steps,
  };
}

function zoneCue(session: PlannedSession): string {
  if (session.targets.kind === "skill") {
    return `RPE ${session.targets.rpe}`;
  }
  const zone = session.targets.zone;
  if (zone.startsWith("Z1")) return "Z1 · Very easy, recovery";
  if (zone.startsWith("Z2")) return "Z2 · Easy, can chat";
  if (zone.startsWith("Z3")) return "Z3 · Steady, short sentences";
  if (zone.startsWith("Z4")) return "Z4 · Hard, a few words";
  return `${zone} · Very hard, can't talk`;
}

function buildSteps(session: PlannedSession): SessionStep[] {
  const total = session.durationMin;
  const warm = Math.max(5, Math.round(total * 0.2));
  const cool = Math.max(5, Math.round(total * 0.15));
  const main = Math.max(5, total - warm - cool);

  if (session.sport === "brick") {
    const bike = Math.max(10, Math.round(total * 0.6));
    const t2 = 5;
    const run = Math.max(8, total - bike - t2);
    return [
      {
        name: "Bike warm-up",
        durationMin: Math.min(10, Math.round(bike * 0.2)),
        cue: "Easy spin, check gears",
        zone: "Z1",
      },
      {
        name: "Steady endurance",
        durationMin: bike - Math.min(10, Math.round(bike * 0.2)),
        cue: "Smooth cadence you could hold",
        zone: "Z2",
      },
      {
        name: "T2 practice",
        durationMin: t2,
        cue: "Rack, shoes, first steps easy",
      },
      {
        name: "Run off the bike",
        durationMin: run,
        cue: "Settle into easy run form",
        zone: "Z2",
      },
    ];
  }

  if (session.targets.kind === "skill") {
    return [
      {
        name: "Warm-up",
        durationMin: warm,
        cue: "Settle in, no rush",
        skill: session.targets.checkpointHint,
      },
      {
        name: "Skill focus",
        durationMin: main,
        cue: `Work on ${session.targets.checkpointHint}`,
        skill: session.targets.checkpointHint,
      },
      {
        name: "Cool-down",
        durationMin: cool,
        cue: "Easy finish, note what felt better",
        skill: session.targets.checkpointHint,
      },
    ];
  }

  const zone = session.targets.zone;
  return [
    {
      name: "Warm-up",
      durationMin: warm,
      cue: "Ease in until breathing is quiet",
      zone: "Z1",
    },
    {
      name: "Main set",
      durationMin: main,
      cue: zoneCue(session),
      zone,
    },
    {
      name: "Cool-down",
      durationMin: cool,
      cue: "Spin or jog down gently",
      zone: "Z1",
    },
  ];
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
