import { useState } from 'react';
import type { WaybackItem } from '../lib/types';

interface ItemCardProps {
  item: WaybackItem;
  variant: 'lead' | 'runnerUp' | 'mid' | 'brief';
}

export function ItemCard({ item, variant }: ItemCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = item.thumbnail.imageUrl !== null && !imageFailed;

  return (
    <a
      className={`item-card item-card--${variant}`}
      href={item.captureUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div
        className="item-card__visual"
        style={!showImage ? { backgroundColor: item.thumbnail.color } : undefined}
      >
        {showImage && (
          <img src={item.thumbnail.imageUrl as string} alt="" onError={() => setImageFailed(true)} />
        )}
      </div>
      <div className="item-card__body">
        <span className="item-card__tag">{item.hostType}</span>
        <div className="item-card__year">Captured {item.year}</div>
        <h3 className="item-card__title">{item.title}</h3>
        <div className="item-card__domain">{item.domain}</div>
        <p className="item-card__description">{item.description}</p>
      </div>
    </a>
  );
}
