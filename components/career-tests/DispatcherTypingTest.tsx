"use client";

import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { calculateTypingMetrics } from "@/lib/career-test-scenarios";
import { Check, Clock3, Keyboard, RotateCcw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const PASSAGES = [
  `Unit twelve requested a welfare check at an apartment building near Harbor Avenue. The caller is a neighbor who has not seen the resident since yesterday afternoon. The caller reports that newspapers are still outside the door and a small dog can be heard barking inside. There is no visible smoke, fire, or property damage. The building manager is responding with a key and will meet officers near the east entrance. The caller will remain in the lobby and can be reached at the callback number already provided.`,
  `A delivery driver reports a disabled silver sedan blocking the right lane of River Road near the Pine Street intersection. The vehicle has its hazard lights on and appears to have a flat front tire. Two adults are standing on the shoulder and no injuries are reported. Traffic is moving slowly around the vehicle. The caller did not see a collision and does not believe another vehicle was involved. The sedan was last seen facing northbound. The caller has continued to the next delivery and is no longer at the scene.`,
  `The store manager at a neighborhood market reports water entering the rear stockroom from a broken pipe. Employees have moved customers away from the affected area and turned off power to nearby equipment. No one is injured and there is no fire. The manager says the water shutoff valve is difficult to reach because several boxes are blocking the utility closet. A maintenance employee is on the way. The manager requests assistance from the water utility and will wait near the loading entrance behind the building.`,
  `A caller at a city bus stop reports an older adult who became dizzy while waiting for the bus. The patient is awake, breathing normally, and able to answer questions. The caller has helped the patient sit on a bench and is keeping the walkway clear. The patient has not fallen and reports no injury. A blue backpack and walking cane are beside the bench. The bus stop is on the west side of Lakeview Boulevard, across from the public library. The caller will stay with the patient until responders arrive.`,
  `A resident reports that a traffic signal is completely dark at the intersection of Cedar Street and Westfield Drive. Vehicles are moving through the intersection slowly, but several drivers have stopped in uncertain positions. No collision or injury is reported. The caller first noticed the outage about five minutes ago after nearby streetlights flickered. A utility crew is not visible in the area. The caller is parked safely in a shopping center lot and can see the intersection from the south entrance.`,
  `A security guard at a community recreation center reports an alarm sounding near a rear storage room. The building has been cleared and all visitors are waiting in the front parking lot. The guard does not see smoke and cannot smell anything unusual. A maintenance supervisor is checking the alarm panel from a safe location. The rear service door is locked, and the guard has a master key available for responders. Access to the property is from the circular driveway on Grant Avenue.`,
  `A motorist reports several wooden boards scattered across two lanes of the eastbound parkway just beyond the Hillcrest exit. Drivers are slowing and changing lanes to avoid the debris. The caller did not witness the boards fall from a vehicle and cannot identify the truck that may have carried them. No crash or vehicle damage is visible. The caller has pulled into a marked emergency area and will remain there long enough to direct responders toward the correct section of roadway.`,
  `The front desk employee at a small hotel reports that an elevator has stopped between the second and third floors. Two guests inside are speaking through the emergency phone and say they are not injured. The elevator lights and ventilation are still operating. Staff members have placed signs at each floor so no one else attempts to use the elevator. A service technician has been contacted but has not provided an arrival time. Responders should enter through the main lobby on Madison Street.`,
  `A park employee reports a loose dog running near the north picnic area and occasionally entering the bicycle path. The animal is medium sized, wearing a red collar, and does not appear aggressive. Several visitors have moved away from the path while the employee watches from a utility cart. No owner has responded to announcements made at the information booth. The employee requests animal control and will meet the responding unit beside the green maintenance shed near the north gate.`,
  `A tenant reports a strong water leak from a ceiling fixture in the hallway of an apartment building. Water is collecting on the tile floor near the stairwell, and residents are using another corridor. The tenant has notified the property manager and placed a plastic container beneath the leak. No electrical sparks, smoke, or injuries are reported. The source of the water is unknown. The tenant will wait outside unit fourteen and can unlock the utility room if responders need access.`,
];

const DURATION_OPTIONS = [60, 180, 300] as const;
const PASSAGE_COUNTS: Record<(typeof DURATION_OPTIONS)[number], number> = {
  60: 1,
  180: 3,
  300: 5,
};
const DURATION_LABELS: Record<(typeof DURATION_OPTIONS)[number], string> = {
  60: "Quick",
  180: "Standard",
  300: "Endurance",
};

type TestState = "idle" | "running" | "result";
type Metrics = ReturnType<typeof calculateTypingMetrics>;

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function shuffledPassages() {
  const passages = [...PASSAGES];
  for (let index = passages.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [passages[index], passages[randomIndex]] = [passages[randomIndex], passages[index]];
  }
  return passages;
}

function buildTypingReference(duration: (typeof DURATION_OPTIONS)[number]) {
  return shuffledPassages().slice(0, PASSAGE_COUNTS[duration]).join("\n\n");
}

function saveBestScore(duration: number, netWpm: number) {
  try {
    const key = `career-tests:dispatcher-typing:${duration}`;
    const previous = Number(localStorage.getItem(key) ?? 0);
    if (netWpm > previous) localStorage.setItem(key, String(netWpm));
  } catch {
    // The test remains fully usable without storage.
  }
}

export default function DispatcherTypingTest() {
  const [duration, setDuration] = useState<(typeof DURATION_OPTIONS)[number]>(60);
  const [remaining, setRemaining] = useState(60);
  const [displayedReference, setDisplayedReference] = useState(PASSAGES[0]);
  const [typed, setTyped] = useState("");
  const [state, setState] = useState<TestState>("idle");
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(60);
  const startedAtRef = useRef(0);
  const typedRef = useRef("");
  const terminalRef = useRef<HTMLDivElement>(null);
  const currentCharacterRef = useRef<HTMLSpanElement>(null);

  const finish = useCallback(() => {
    if (!startedAtRef.current) return;
    const actualElapsed = Math.max(
      1,
      Math.min(duration, Math.round((Date.now() - startedAtRef.current) / 1000))
    );
    const result = calculateTypingMetrics(
      displayedReference.slice(0, Math.max(typedRef.current.length, 1)),
      typedRef.current,
      actualElapsed
    );
    setElapsedSeconds(actualElapsed);
    setMetrics(result);
    setState("result");
    saveBestScore(duration, result.netWpm);
    analytics.game.complete({
      game_id: "911-dispatcher-typing-test",
      mode: `${duration}-seconds`,
      score: result.netWpm,
      accuracy: result.accuracy,
      duration_ms: actualElapsed * 1000,
    });
  }, [displayedReference, duration]);

  useEffect(() => {
    if (state !== "running" || !hasStartedTyping) return;
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const nextRemaining = Math.max(0, duration - elapsed);
      setRemaining(nextRemaining);
      if (nextRemaining <= 0) finish();
    }, 250);
    return () => window.clearInterval(timer);
  }, [duration, finish, hasStartedTyping, state]);

  useEffect(() => {
    currentCharacterRef.current?.scrollIntoView({ block: "nearest" });
  }, [typed.length]);

  const start = () => {
    let nextReference = buildTypingReference(duration);
    for (let attempt = 0; attempt < 4 && nextReference === displayedReference; attempt += 1) {
      nextReference = buildTypingReference(duration);
    }
    setDisplayedReference(nextReference);
    setTyped("");
    typedRef.current = "";
    setMetrics(null);
    setRemaining(duration);
    setHasStartedTyping(false);
    setState("running");
    startedAtRef.current = 0;
    window.setTimeout(() => terminalRef.current?.focus(), 0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "Backspace") {
      event.preventDefault();
      const nextValue = typedRef.current.slice(0, -1);
      typedRef.current = nextValue;
      setTyped(nextValue);
      return;
    }

    if (event.key.length !== 1 || typedRef.current.length >= displayedReference.length) {
      return;
    }

    event.preventDefault();
    if (!startedAtRef.current) {
      startedAtRef.current = Date.now();
      setHasStartedTyping(true);
      analytics.game.start({
        game_id: "911-dispatcher-typing-test",
        mode: `${duration}-seconds`,
      });
    }

    const nextValue = typedRef.current + event.key;
    typedRef.current = nextValue;
    setTyped(nextValue);
    if (nextValue.length === displayedReference.length) {
      window.setTimeout(finish, 0);
    }
  };

  if (state === "idle") {
    return (
      <section className="mx-auto max-w-5xl py-4 sm:py-8" aria-labelledby="typing-terminal-title">
        <Keyboard aria-hidden="true" className="h-12 w-12 text-primary" />
        <h2 id="typing-terminal-title" className="mt-4 text-3xl font-semibold tracking-tight">Dispatcher typing terminal</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Type original, non-graphic incident notes. Your score is calculated locally and is not an agency qualification score.
        </p>

        <fieldset className="mt-7">
          <legend className="text-sm font-medium">Choose a test length</legend>
          <div className="mt-3 grid max-w-xl grid-cols-3 gap-1.5 rounded-2xl bg-muted/55 p-1.5">
            {DURATION_OPTIONS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                onClick={() => {
                  setDuration(seconds);
                  setRemaining(seconds);
                }}
                aria-pressed={duration === seconds}
                className={`relative rounded-xl px-2 py-4 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3 ${duration === seconds ? "bg-background text-foreground shadow-sm ring-1 ring-border/60" : "text-muted-foreground hover:bg-background/50 hover:text-foreground"}`}
              >
                {duration === seconds && (
                  <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                <span className="block text-lg font-bold sm:text-xl">{seconds / 60} min</span>
                <span className="mt-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {DURATION_LABELS[seconds]}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <Button size="lg" className="mt-7" onClick={start}>Start typing test</Button>
      </section>
    );
  }

  if (state === "result" && metrics) {
    return (
      <section className="mx-auto max-w-5xl space-y-6 py-4 sm:py-8" aria-live="polite">
        <div>
          <p className="text-sm font-medium text-primary">Practice complete</p>
          <h2 className="mt-1 text-3xl font-semibold">Your dispatcher typing result</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Net WPM", metrics.netWpm],
            ["Gross WPM", metrics.grossWpm],
            ["Accuracy", `${metrics.accuracy}%`],
            ["Character errors", metrics.errors],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-muted/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            This was a {elapsedSeconds}-second practice run. Hiring agencies set their own typing requirements, test lengths, and scoring rules. Confirm the exact standard in your job announcement.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={start}>
            <RotateCcw aria-hidden="true" />
            Try the same length again
          </Button>
          <Button variant="outline" size="lg" onClick={() => setState("idle")}>Change test length</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-5" aria-labelledby="active-typing-title">
      <div className="flex items-center justify-between rounded-2xl bg-muted/35 px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Time remaining</p>
          <p className="mt-1 flex items-center gap-2 font-mono text-3xl font-bold" aria-live="polite">
            <Clock3 aria-hidden="true" className="h-6 w-6 text-primary" />
            {formatClock(remaining)}
          </p>
          {!hasStartedTyping && (
            <p className="mt-1 text-xs text-muted-foreground">Starts with your first keystroke</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Characters</p>
          <p className="mt-1 text-2xl font-bold">{typed.length}</p>
        </div>
      </div>

      <div>
        <p id="typing-instructions" className="mb-3 text-sm text-muted-foreground">
          Click the passage, then type the highlighted text. Backspace corrects your last character. Pasting is disabled.
        </p>
        <div
          ref={terminalRef}
          role="textbox"
          aria-label="Dispatcher typing test input"
          aria-describedby="typing-instructions"
          aria-multiline="false"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPaste={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
          onClick={() => terminalRef.current?.focus()}
          className="max-h-96 min-h-56 cursor-text overflow-y-auto rounded-2xl border border-border/60 bg-muted/25 p-5 font-mono text-base leading-8 outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 sm:p-7"
        >
          <span className="whitespace-pre-wrap">
            {Array.from(displayedReference).map((character, index) => {
              if (index < typed.length) {
                const isCorrect = typed[index] === character;
                return (
                  <span
                    key={index}
                    className={
                      isCorrect
                        ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                        : "bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200"
                    }
                  >
                    {character}
                  </span>
                );
              }

              if (index === typed.length) {
                return (
                  <span
                    key={index}
                    ref={currentCharacterRef}
                    className="border-b-2 border-primary bg-primary/15 text-foreground"
                  >
                    {character}
                  </span>
                );
              }

              return (
                <span key={index} className="text-muted-foreground">
                  {character}
                </span>
              );
            })}
          </span>
        </div>
      </div>

      <Button variant="outline" onClick={finish} disabled={!hasStartedTyping}>End and score now</Button>
    </section>
  );
}
