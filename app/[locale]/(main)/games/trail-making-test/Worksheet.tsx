"use client";

import { useEffect, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createTrailLayout, trailLabels, TRAIL_BOARD_SIZE, TRAIL_POINT_RADIUS, type TrailPart } from "@/lib/trail-making";

const PRINT_ROOT = "trail-making-print-root";
const PRINT_CLASS = "trail-making-printing";
const printStyles = `
#${PRINT_ROOT} { display: none; }
@media print {
  @page { size: A4 portrait; margin: 12mm; }
  html:has(body.${PRINT_CLASS}) { height: auto !important; min-height: 0 !important; overflow: visible !important; }
  body.${PRINT_CLASS} { background: #fff !important; color: #000 !important; margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; overflow: visible !important; }
  body.${PRINT_CLASS} > :not(#${PRINT_ROOT}) { display: none !important; }
  body.${PRINT_CLASS} > #${PRINT_ROOT} { display: block !important; }
  #${PRINT_ROOT} { margin: 0; padding: 0; height: auto; color: #000; background: #fff; font: 10pt/1.35 Arial, sans-serif; }
  #${PRINT_ROOT} .worksheet-page { break-after: auto; }
  #${PRINT_ROOT} .worksheet-page + .worksheet-page { break-before: page; }
  #${PRINT_ROOT} h1 { font-size: 16pt; margin: 0 0 3mm; }
  #${PRINT_ROOT} h2 { font-size: 12pt; margin: 0 0 3mm; }
  #${PRINT_ROOT} p { margin: 0 0 3mm; }
  #${PRINT_ROOT} .worksheet-board { display: block; width: 174mm; max-width: 100%; height: auto; margin: 3mm auto 5mm; break-inside: avoid; }
  #${PRINT_ROOT} .worksheet-footer { font-size: 8pt; }
  #${PRINT_ROOT} .worksheet-page > :last-child { margin-bottom: 0; }
}
`;

export default function TrailMakingWorksheet({ sourceUrl }: { sourceUrl: string }) {
  const t = useTranslations("games.trailMakingTest.worksheet");
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [seed, setSeed] = useState(20261009);

  useEffect(() => {
    const node = document.createElement("div");
    node.id = PRINT_ROOT;
    document.body.appendChild(node);
    setRoot(node);
    const afterPrint = () => document.body.classList.remove(PRINT_CLASS);
    window.addEventListener("afterprint", afterPrint);
    const media = window.matchMedia("print");
    const mediaChanged = (event: MediaQueryListEvent) => { if (!event.matches) afterPrint(); };
    media.addEventListener("change", mediaChanged);
    return () => {
      window.removeEventListener("afterprint", afterPrint);
      media.removeEventListener("change", mediaChanged);
      afterPrint();
      node.remove();
    };
  }, []);

  const print = () => {
    // Commit a fresh layout to the print portal before opening native print preview.
    flushSync(() => setSeed(Math.floor(Math.random() * 4294967296)));
    document.body.classList.add(PRINT_CLASS);
    try { window.print(); } catch { document.body.classList.remove(PRINT_CLASS); }
  };

  const pages = (['a', 'b'] as TrailPart[]).map((part, partIndex) => {
    const points = createTrailLayout((seed + partIndex) >>> 0);
    const labels = trailLabels(part);
    return (
      <section key={part} className="worksheet-page">
        <h1>{t("title")}</h1>
        <h2>{t(part === 'a' ? "partA" : "partB")}</h2>
        <p>{t(part === 'a' ? "instructionsA" : "instructionsB")}</p>
        <p>{t("timing")}</p>
        <svg className="worksheet-board" viewBox={`0 0 ${TRAIL_BOARD_SIZE} ${TRAIL_BOARD_SIZE}`} xmlns="http://www.w3.org/2000/svg">
          {points.map((point, index) => (
            <g key={index}>
              <circle cx={point.x} cy={point.y} r={TRAIL_POINT_RADIUS} fill="white" stroke="black" strokeWidth={1.5} />
              <text x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central" fontFamily={labels[index] === "I" ? "Georgia, 'Times New Roman', serif" : "Arial, sans-serif"} fontWeight={labels[index] === "I" ? 700 : 400} fontSize={18} fill="black">{labels[index]}</text>
              {(index === 0 || index === points.length - 1) && <text x={point.x} y={point.y + TRAIL_POINT_RADIUS + 12} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={9} fill="black">{t(index === 0 ? "start" : "end")}</text>}
            </g>
          ))}
        </svg>
        <p>{t("record")}</p>
        <p className="worksheet-footer">{t("limitations")}</p>
        <p className="worksheet-footer">{t("source")}: {sourceUrl}</p>
      </section>
    );
  });

  return <>
    <style>{printStyles}</style>
    <Button type="button" variant="ghost" size="sm" className="gap-2" disabled={!root} onClick={print}>
      <Printer className="h-4 w-4" />{t("button")}
    </Button>
    {root && createPortal(pages, root)}
  </>;
}
