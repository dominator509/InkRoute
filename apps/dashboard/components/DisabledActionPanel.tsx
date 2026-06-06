interface DisabledActionPanelProps {
  title: string;
  description: string;
  actions: string[];
}

export function DisabledActionPanel({ title, description, actions }: DisabledActionPanelProps) {
  return (
    <section className="card action-panel">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="button-row">
        {actions.map((action) => (
          <button key={action} type="button" disabled>
            {action}
          </button>
        ))}
      </div>
    </section>
  );
}
