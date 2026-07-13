import { render, screen } from '@testing-library/react';
import { FrontPage } from '../FrontPage';
import type { WaybackItem } from '../../lib/types';

function makeItem(overrides: Partial<WaybackItem>): WaybackItem {
  return {
    url: 'http://example.com/x',
    captureUrl: 'https://web.archive.org/web/19990101000000if_/http://example.com/x',
    domain: 'example.com',
    year: 1999,
    title: 'Title',
    description: 'Description.',
    hostType: 'Personal Homepage',
    tier: 'brief',
    thumbnail: { imageUrl: null, color: '#e8e2d0' },
    ...overrides,
  };
}

describe('FrontPage', () => {
  it('renders lead, runnerUp, mid, and brief tiers in their sections', () => {
    const items: WaybackItem[] = [
      makeItem({ url: 'http://example.com/lead', title: 'Lead Story', tier: 'lead' }),
      makeItem({ url: 'http://example.com/runner', title: 'Runner Up', tier: 'runnerUp' }),
      makeItem({ url: 'http://example.com/mid1', title: 'Mid One', tier: 'mid' }),
      makeItem({ url: 'http://example.com/brief1', title: 'Brief One', tier: 'brief' }),
    ];

    render(<FrontPage items={items} />);

    expect(screen.getByText('Lead Story')).toBeInTheDocument();
    expect(screen.getByText('Runner Up')).toBeInTheDocument();
    expect(screen.getByText('Mid One')).toBeInTheDocument();
    expect(screen.getByText(/Brief One/)).toBeInTheDocument();
  });

  it('renders nothing extra for briefs when there are none', () => {
    const items: WaybackItem[] = [makeItem({ tier: 'lead', title: 'Only Lead' })];
    render(<FrontPage items={items} />);
    expect(screen.queryByText('Also in this edition')).not.toBeInTheDocument();
  });
});
