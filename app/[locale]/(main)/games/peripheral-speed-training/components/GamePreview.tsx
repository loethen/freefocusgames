import { CarFront } from 'lucide-react'

export function PeripheralSpeedPreview() {
  const positions = [
    'left-1/2 top-[15%]',
    'left-[73%] top-[25%]',
    'left-[83%] top-1/2',
    'left-[73%] top-[75%]',
    'left-1/2 top-[85%]',
    'left-[27%] top-[75%]',
    'left-[17%] top-1/2',
    'left-[27%] top-[25%]',
  ]

  return (
    <div
      aria-hidden="true"
      className="relative h-full min-h-[220px] w-full overflow-hidden rounded-xl bg-[#e6eee8]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,.9),transparent_42%)]" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(71,85,105,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,.16)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute -right-5 inset-y-0 w-16 bg-sky-200/80" />

      <svg
        viewBox="0 0 400 240"
        className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
      >
        <path
          d="M-18 190 C70 120 142 196 228 142 S338 72 430 108"
          fill="none"
          stroke="rgba(255,255,255,.94)"
          strokeWidth="30"
          strokeLinecap="round"
        />
        <path
          d="M-18 190 C70 120 142 196 228 142 S338 72 430 108"
          fill="none"
          stroke="#9aa8a0"
          strokeWidth="2"
          strokeDasharray="8 9"
        />
        <path
          d="M56 -14 C78 60 145 75 204 110 S294 178 326 258"
          fill="none"
          stroke="rgba(255,255,255,.94)"
          strokeWidth="27"
          strokeLinecap="round"
        />
        <path
          d="M56 -14 C78 60 145 75 204 110 S294 178 326 258"
          fill="none"
          stroke="#9aa8a0"
          strokeWidth="2"
          strokeDasharray="8 9"
        />
      </svg>

      {positions.map((position, index) => (
        <div
          key={position}
          className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
            index === 7 ? 'bg-amber-500' : 'bg-slate-500/35'
          } ${position}`}
        />
      ))}

      <div className="absolute left-[27%] top-[25%] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[42%_42%_48%_48%] border-2 border-slate-900 bg-white text-[7px] font-black leading-none text-slate-900 shadow-[0_0_0_7px_rgba(251,191,36,.22)] transition-transform duration-300 group-hover:scale-110">
        <span>ROUTE</span>
        <span className="text-sm">66</span>
      </div>

      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-500/15" />
      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-[0_12px_30px_rgba(15,23,42,.14)]" />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-slate-900 transition-transform duration-300 group-hover:scale-110">
        <CarFront className="h-10 w-10" strokeWidth={1.7} />
      </div>
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white" />

      <div className="absolute bottom-4 left-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Visual speed
        </div>
        <div className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">
          Double Decision
        </div>
      </div>
      <div className="absolute bottom-4 right-4 rounded-full bg-white/75 px-2.5 py-1 font-mono text-[10px] text-slate-600 backdrop-blur">
        2 choices · 8 zones
      </div>
    </div>
  )
}
