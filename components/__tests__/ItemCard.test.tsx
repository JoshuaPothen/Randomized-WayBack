import { render, screen, fireEvent } from '@testing-library/react';
import { ItemCard } from '../ItemCard';
import type { WaybackItem } from '../../lib/types';

const baseItem: WaybackItem = {
  url: 'http://example.com/reef',
  captureUrl: 'https://web.archive.org/web/19990101000000if_/http://example.com/reef',
  domain: 'example.com',
  year: 1999,
  title: "Dave's Reef Tank",
  description: 'A 20-gallon reef tank journal.',
  hostType: 'Personal Homepage',
  tier: 'lead',
  thumbnail: { imageUrl: 'http://example.com/reef.jpg', color: '#e8e2d0' },
};

describe('ItemCard', () => {
  it('renders title, host type, year, and links to the capture URL', () => {
    render(<ItemCard item={baseItem} variant="lead" />);
    expect(screen.getByText("Dave's Reef Tank")).toBeInTheDocument();
    expect(screen.getByText('Personal Homepage')).toBeInTheDocument();
    expect(screen.getByText(/1999/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', baseItem.captureUrl);
  });

  it('renders an image when imageUrl is present', () => {
    render(<ItemCard item={baseItem} variant="lead" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', baseItem.thumbnail.imageUrl);
  });

  it('falls back to a color swatch when the image fails to load', () => {
    render(<ItemCard item={baseItem} variant="lead" />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders a color swatch directly when there is no imageUrl', () => {
    const colorOnlyItem = { ...baseItem, thumbnail: { imageUrl: null, color: '#123456' } };
    render(<ItemCard item={colorOnlyItem} variant="mid" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
