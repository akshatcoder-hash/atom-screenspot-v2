import { useState } from "react";
import { ThemeProvider, useToolContext } from "mcp-use/react";
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
        <div className="atom-stage">
          {src === undefined ? <div className="atom-skel" /> : <img src={src} alt="screenshot" onError={() => setBrokenSrc(src)} />}
          <div className="atom-pin" style={{ left: `${normalized.x / 10}%`, top: `${normalized.y / 10}%` }}>
            <div className="atom-ring" />
            <div className="atom-dot" />
          </div>
        </div>
      )}
    </>
  );
}
