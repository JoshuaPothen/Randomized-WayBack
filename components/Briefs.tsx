import type { WaybackItem } from '../lib/types';

export function Briefs({ items }: { items: WaybackItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="briefs">
      <div className="briefs__title">Also in this edition</div>
      <ul>
        {items.map((item) => (
          <li key={item.url}>
            <a href={item.captureUrl} target="_blank" rel="noopener noreferrer">
              <strong>{item.title}</strong> — {item.domain}, {item.year}. {item.description}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
