"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Minus, Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  createDigitSpanWorksheet,
  worksheetRandom,
} from "@/lib/digit-span-worksheet";

const PRINT_ROOT = "digit-span-print-root";
const PRINT_CLASS = "digit-span-printing";
const printStyles = `
#${PRINT_ROOT} { display: none; }
@media print {
  @page { size: A4 portrait; margin: 12mm; }
  html:has(body.${PRINT_CLASS}) { height: auto !important; min-height: 0 !important; overflow: visible !important; }
  body.${PRINT_CLASS} { background: #fff !important; color: #000 !important; margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; overflow: visible !important; }
  body.${PRINT_CLASS} > :not(#${PRINT_ROOT}) { display: none !important; }
  body.${PRINT_CLASS} > #${PRINT_ROOT} { display: block !important; }
  #${PRINT_ROOT} { color: #000; background: #fff; font: 10pt/1.35 Arial, sans-serif; }
  #${PRINT_ROOT} { margin: 0; padding: 0; height: auto; min-height: 0; }
  #${PRINT_ROOT} .worksheet-page { break-after: auto; page-break-after: auto; }
  #${PRINT_ROOT} .worksheet-page + .worksheet-page { break-before: page; page-break-before: always; }
  #${PRINT_ROOT} .worksheet-page > :last-child { margin-bottom: 0; }
  #${PRINT_ROOT} h1 { font-size: 17pt; margin: 0 0 4mm; }
  #${PRINT_ROOT} h2 { font-size: 13pt; margin: 0 0 3mm; }
  #${PRINT_ROOT} p { margin: 0 0 3mm; }
  #${PRINT_ROOT} table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 4mm 0; font-size: 9pt; }
  #${PRINT_ROOT} th, #${PRINT_ROOT} td { border: 1px solid #777; padding: 2.5mm 1.5mm; vertical-align: middle; overflow-wrap: anywhere; }
  #${PRINT_ROOT} .digits { font-family: monospace; letter-spacing: .3mm; }
  #${PRINT_ROOT} thead { display: table-header-group; }
  #${PRINT_ROOT} tr { break-inside: avoid; page-break-inside: avoid; }
  #${PRINT_ROOT} .worksheet-footer { font-size: 8pt; }
}
`;

export default function DigitSpanWorksheet({
  sourceUrl,
}: {
  sourceUrl: string;
}) {
  const t = useTranslations("games.digitSpanTest.worksheet");
  const modeText = useTranslations("games.digitSpanTest.game");
  const [lengthInput, setLengthInput] = useState("10");
  const maxLength = Number(lengthInput);
  const validLength = Number.isInteger(maxLength) && maxLength >= 3 && maxLength <= 100;
  const [seed, setSeed] = useState(20261008);
  const sheets = useMemo(
    () => createDigitSpanWorksheet(worksheetRandom(seed), validLength ? maxLength : 10),
    [seed, maxLength, validLength],
  );
  const [root, setRoot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = document.createElement("div");
    node.id = PRINT_ROOT;
    document.body.appendChild(node);
    setRoot(node);
    const beforePrint = () => document.body.classList.add(PRINT_CLASS);
    const afterPrint = () => document.body.classList.remove(PRINT_CLASS);
    const media = window.matchMedia("print");
    const mediaChanged = (event: MediaQueryListEvent) => {
      if (event.matches) beforePrint();
      else afterPrint();
    };
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    media.addEventListener("change", mediaChanged);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
      media.removeEventListener("change", mediaChanged);
      afterPrint();
      node.remove();
    };
  }, []);

  const table = (rows: (typeof sheets)[number]["rows"]) => (
    <table>
      <colgroup>
        {["9%", "7%", "26%", "24%", "25%", "9%"].map((width, index) => <col key={index} style={{ width }} />)}
      </colgroup>
      <thead><tr>
        {["length", "attempt", "sequence", "answer", "response", "correct"].map((key) => <th key={key}>{t(`columns.${key}`)}</th>)}
      </tr></thead>
      <tbody>{rows.map((row) => (
        <tr key={`${row.length}-${row.attempt}`}>
          <td>{row.length}</td><td>{row.attempt}</td>
          <td className="digits">{row.sequence.split("").join(" ")}</td>
          <td className="digits">{row.answer}</td>
          <td>&nbsp;</td><td>&nbsp;</td>
        </tr>
      ))}</tbody>
    </table>
  );
  const pages = (
    <>
      {sheets.map((sheet) => (
        <section key={sheet.mode} className="worksheet-page">
          <h1>{t("title")}</h1>
          <h2>{modeText(sheet.mode)}</h2>
          <p>{t("hostInstructions")}</p>
          <p>
            {t(
              sheet.mode === "forward"
                ? "forwardInstructions"
                : "backwardInstructions",
            )}
          </p>
          <p>{t("rules", { min: 3 })}</p>
          <p>{t("range", { min: 3, max: maxLength })}</p>
          {table(sheet.rows)}
          <p>{t("recordFields")}</p>
          <p className="worksheet-footer">{t("paperLimitations")}</p>
          <p className="worksheet-footer">
            {t("source")}: {sourceUrl}
          </p>
        </section>
      ))}
    </>
  );

  return (
    <>
      <style>{printStyles}</style>
      <Dialog onOpenChange={(open) => { if (open) setSeed(Math.floor(Math.random() * 4294967296)); }}>
        <DialogTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />{t("button")}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100%_-_2rem)] max-w-md min-w-0 max-h-[calc(100dvh_-_2rem)] overflow-y-auto [&>*]:min-w-0">
          <DialogHeader>
            <DialogTitle className="pr-6 break-words">{t("title")}</DialogTitle>
            <DialogDescription className="break-words">{t("intro")}</DialogDescription>
          </DialogHeader>
          <div className="min-w-0 space-y-2 text-sm">
            <label htmlFor="digit-span-max-length" className="block">{t("maxLength")}</label>
            <div className="flex w-fit max-w-full items-center overflow-hidden rounded-md border border-input bg-background">
              <Button
                type="button" variant="ghost"
                className="h-10 w-10 shrink-0 rounded-none p-0"
                aria-label={t("decreaseLength")}
                disabled={validLength && maxLength <= 3}
                onClick={() => setLengthInput(String(Math.max(3, (validLength ? maxLength : 10) - 1)))}
              ><Minus className="h-4 w-4" /></Button>
              <input
                id="digit-span-max-length"
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={lengthInput}
                onChange={(event) => setLengthInput(event.target.value)}
                aria-invalid={!validLength}
                aria-describedby="digit-span-length-help"
                className="box-border h-10 w-16 min-w-0 border-x border-input bg-transparent px-2 text-center tabular-nums"
              />
              <Button
                type="button" variant="ghost"
                className="h-10 w-10 shrink-0 rounded-none p-0"
                aria-label={t("increaseLength")}
                disabled={validLength && maxLength >= 100}
                onClick={() => setLengthInput(String(Math.min(100, (validLength ? maxLength : 10) + 1)))}
              ><Plus className="h-4 w-4" /></Button>
            </div>
            <p id="digit-span-length-help" className="text-xs text-muted-foreground">{t("lengthHelp")}</p>
          </div>
          <DialogFooter className="min-w-0">
            <Button type="button" className="h-auto min-h-9 max-w-full gap-2 whitespace-normal text-center" disabled={!root || !validLength} onClick={() => window.print()}>
              <Printer className="h-4 w-4 shrink-0" />{t("print")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {root && createPortal(pages, root)}
    </>
  );
}
