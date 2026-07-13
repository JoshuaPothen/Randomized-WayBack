interface MastheadProps {
  itemCount: number;
  onNewEdition: () => void;
}

export function Masthead({ itemCount, onNewEdition }: MastheadProps) {
  const dateLabel = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date()
  );

  return (
    <div className="masthead">
      <h1>The Wayback Dispatch</h1>
      <div className="masthead__meta">
        Edition of {dateLabel} · {itemCount} finds ·{' '}
        <button className="masthead__button" onClick={onNewEdition}>
          New Edition
        </button>
      </div>
    </div>
  );
}
