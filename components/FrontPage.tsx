import { ItemCard } from './ItemCard';
import { Briefs } from './Briefs';
import type { WaybackItem } from '../lib/types';

export function FrontPage({ items }: { items: WaybackItem[] }) {
  const lead = items.find((item) => item.tier === 'lead');
  const runnerUp = items.find((item) => item.tier === 'runnerUp');
  const mid = items.filter((item) => item.tier === 'mid');
  const briefs = items.filter((item) => item.tier === 'brief');

  return (
    <div className="front-page">
      <div className="top-row">
        {lead && <ItemCard item={lead} variant="lead" />}
        {runnerUp && <ItemCard item={runnerUp} variant="runnerUp" />}
      </div>
      <div className="mid-row">
        {mid.map((item) => (
          <ItemCard key={item.url} item={item} variant="mid" />
        ))}
      </div>
      <Briefs items={briefs} />
    </div>
  );
}
