import { useCallback, useEffect, useState } from 'react';
import { Masthead } from '../components/Masthead';
import { FrontPage } from '../components/FrontPage';
import type { WaybackItem } from '../lib/types';

type LoadState = 'loading' | 'ready' | 'error';

export default function Home() {
  const [items, setItems] = useState<WaybackItem[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  const loadEdition = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch('/api/edition');
      const data = await res.json();
      if (!res.ok || !data.items) {
        setState('error');
        return;
      }
      setItems(data.items);
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    loadEdition();
  }, [loadEdition]);

  return (
    <main>
      <Masthead itemCount={items.length} onNewEdition={loadEdition} />
      {state === 'loading' && <p className="status">Fetching an edition from the archive…</p>}
      {state === 'error' && (
        <div className="status status--error">
          <p>The archive isn&apos;t responding right now.</p>
          <button onClick={loadEdition}>Retry</button>
        </div>
      )}
      {state === 'ready' && <FrontPage items={items} />}
    </main>
  );
}
