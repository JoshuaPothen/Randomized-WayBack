import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from '../../pages/index';

describe('Home page', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows a loading state, then renders items on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            url: 'http://example.com/x',
            captureUrl: 'https://web.archive.org/web/19990101000000if_/http://example.com/x',
            domain: 'example.com',
            year: 1999,
            title: 'Test Item',
            description: 'A test item.',
            hostType: 'Personal Homepage',
            tier: 'lead',
            thumbnail: { imageUrl: null, color: '#e8e2d0' },
          },
        ],
      }),
    }) as jest.Mock;

    render(<Home />);
    expect(screen.getByText(/Fetching an edition/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Test Item')).toBeInTheDocument());
  });

  it('shows an error state with a retry button when the fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'nope' }) }) as jest.Mock;

    render(<Home />);
    await waitFor(() => expect(screen.getByText(/isn't responding/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('re-fetches when New Edition is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    }) as jest.Mock;

    render(<Home />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /new edition/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });
});
