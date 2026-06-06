interface TimelineItem {
  at: string;
  title: string;
  detail: string;
  actor: string;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={`${item.at}-${item.title}`}>
          <span>{item.at}</span>
          <div>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
            <small>Actor: {item.actor}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}
