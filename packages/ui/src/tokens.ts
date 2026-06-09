export const inkrouteTheme = {
  color: {
    canvas: "bg-stone-950 text-stone-50",
    panel: "bg-stone-950/80 border-stone-800",
    panelSoft: "bg-stone-900/70 border-stone-800",
    accent: "bg-amber-300 text-stone-950",
    accentSoft: "bg-amber-300/10 text-amber-200 border-amber-300/30",
    danger: "bg-rose-500/10 text-rose-200 border-rose-400/30",
    success: "bg-emerald-500/10 text-emerald-200 border-emerald-400/30",
    warning: "bg-orange-400/10 text-orange-200 border-orange-300/30",
  },
  focusRing: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950",
  radius: {
    control: "rounded-xl",
    panel: "rounded-3xl",
    pill: "rounded-full",
  },
  typography: {
    eyebrow: "text-xs font-bold uppercase tracking-[0.28em] text-amber-200/80",
    title: "text-2xl font-black tracking-tight text-stone-50",
    body: "text-sm leading-6 text-stone-300",
    subtle: "text-xs leading-5 text-stone-500",
  },
} as const;

export type InkrouteTheme = typeof inkrouteTheme;
