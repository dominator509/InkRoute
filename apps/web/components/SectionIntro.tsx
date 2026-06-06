interface SectionIntroProps {
  eyebrow: string;
  title: string;
  description?: string;
  body?: string;
  align?: "left" | "center";
}

export function SectionIntro({ eyebrow, title, description, body, align = "left" }: SectionIntroProps) {
  const resolvedBody = body ?? description;
  return (
    <div className={align === "center" ? "section-intro center" : "section-intro"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {resolvedBody ? <p>{resolvedBody}</p> : null}
    </div>
  );
}
