interface SectionIntroProps {
  eyebrow: string;
  title: string;
  body?: string;
  align?: "left" | "center";
}

export function SectionIntro({ eyebrow, title, body, align = "left" }: SectionIntroProps) {
  return (
    <div className={align === "center" ? "section-intro center" : "section-intro"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}
