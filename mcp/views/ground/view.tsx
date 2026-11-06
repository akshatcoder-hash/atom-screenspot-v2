import { useEffect, useRef, useState } from "react";
import { ThemeProvider, useToolContext } from "mcp-use/react";
import { SWOOP_MS, swoopPoint, type Point } from "./swoop.js";
import "./view.css";

export default function Ground() {
  return (
    <ThemeProvider>
      <div className="atom">
        <Result />
      </div>
    </ThemeProvider>
  );
}

function Result() {
  const view = useToolContext<"ground">();
  const [brokenSrc, setBrokenSrc] = useState<string>();

  if (view.status === "error") return <div className="atom-err">{view.error.message}</div>;
  if (view.status === "pending") {
    return (
      <>
        <div className="atom-head"><span className="atom-instr">{view.toolInput?.instruction ?? "Grounding…"}</span></div>
        <div className="atom-skel" />
      </>
    );
  }

  const { instruction, normalized, pixel, image, duration_ms } = view.toolOutput;
  const imageDataUrl = view.meta?.imageDataUrl;
  const src = typeof imageDataUrl === "string" ? imageDataUrl : undefined;
  return (
    <>
      <div className="atom-head">
        <span className="atom-instr">{instruction}</span>
        <span className="atom-meta">
          ({Math.round(pixel.x)}, {Math.round(pixel.y)}) · {image.width}×{image.height} · {duration_ms} ms
        </span>
      </div>
      {src !== undefined && src === brokenSrc ? (
        <div className="atom-err">The screenshot could not be displayed, so no click marker is shown.</div>
      ) : (
        <Stage key={`${instruction}:${normalized.x},${normalized.y}`} src={src} target={normalized} onBroken={() => setBrokenSrc(src)} />
      )}
    </>
  );
}

const TRAIL = 5;
const TRAIL_LAG = 0.05;

// The screenshot with a cursor that swoops to the predicted point; the ring appears when it lands.
function Stage({ src, target, onBroken }: { src?: string; target: Point; onBroken: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const parts = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [landed, setLanded] = useState(src === undefined);

  useEffect(() => {
    const box = stage.current;
    const layer = parts.current;
    if (!loaded || !box || !layer) return;
    const { width, height } = box.getBoundingClientRect();
    const to = { x: (target.x / 1000) * width, y: (target.y / 1000) * height };
    const from = { x: to.x < width / 2 ? width : 0, y: to.y < height / 2 ? height : 0 };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const [cursor, ...trail] = Array.from(layer.children) as HTMLElement[];
    const place = (el: HTMLElement, p: Point) => {
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      el.style.visibility = "visible";
    };
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = (now - start) / SWOOP_MS;
      place(cursor, swoopPoint(from, to, t, reduced));
      trail.forEach((dot, i) => {
        const lagged = t - (i + 1) * TRAIL_LAG;
        if (lagged > 0 && t < 1) place(dot, swoopPoint(from, to, lagged, reduced));
        else dot.style.visibility = "hidden";
      });
      if (t < 1) frame = requestAnimationFrame(step);
      else setLanded(true);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [loaded, target.x, target.y]);

  return (
    <div ref={stage} className={landed ? "atom-stage landed" : "atom-stage"}>
      {src === undefined ? (
        <div className="atom-skel" />
      ) : (
        <img src={src} alt="screenshot" onLoad={() => setLoaded(true)} onError={onBroken} />
      )}
      <div ref={parts} className="atom-swoop">
        <svg className="atom-cursor" viewBox="0 0 20 24" aria-hidden="true">
          <path d="M1 1 L1 19 L6 14.5 L9.5 22 L12.5 20.7 L9 13.5 L16 13.5 Z" fill="#fff" stroke="#111" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        {Array.from({ length: TRAIL }, (_, i) => (
          <div key={i} className="atom-trail" style={{ opacity: 0.55 - i * 0.1, scale: String(1 - i * 0.14) }} />
        ))}
      </div>
      <div className="atom-pin" style={{ left: `${target.x / 10}%`, top: `${target.y / 10}%` }}>
        <div className="atom-ring" />
        <div className="atom-dot" />
      </div>
    </div>
  );
}
