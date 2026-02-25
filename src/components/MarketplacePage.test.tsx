import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { MarketplacePage } from './MarketplacePage';

// Mock dependencies
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@/hooks/useAppStore', () => ({
  useAppStore: () => ({
    skills: [], // Mock installed skills
    refreshSkills: vi.fn(),
  }),
}));

// Mock react-window and auto-sizer to simplify rendering
vi.mock('react-window', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FixedSizeGrid: ({ children, itemData }: any) => (
    <div data-testid="grid">
      {/* Render first item for testing */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {children({ columnIndex: 0, rowIndex: 0, style: {}, data: itemData })}
    </div>
  ),
}));

vi.mock('react-virtualized-auto-sizer', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children }: any) => children({ height: 500, width: 500 }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('MarketplacePage', () => {
  const mockSkills = [
    {
      id: '1',
      name: 'Test Skill',
      author: 'Tester',
      authorAvatar: 'avatar.png',
      description: 'A test skill',
      githubUrl: 'https://github.com/test/skill',
      stars: 10,
      forks: 2,
      updatedAt: 1234567890,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock fetch
    global.fetch = vi.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads from cache immediately if available', async () => {
    // Setup cache
    localStorage.setItem('marketplace_cache', JSON.stringify(mockSkills));
    
    // Mock fetch to delay
    (global.fetch as Mock).mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve([])
        } as Response), 100);
    }));

    render(<MarketplacePage />);

    // Should show skill from cache immediately
    expect(screen.getByText('Test Skill')).toBeInTheDocument();
    
    // Should NOT show full screen loading spinner (because we have cache)
    expect(screen.queryByText('Syncing marketplace...')).not.toBeInTheDocument();
  });

  it('shows loading spinner if no cache', async () => {
    // No cache
    (global.fetch as Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<MarketplacePage />);

    expect(screen.getByText('Syncing marketplace...')).toBeInTheDocument();
  });

  it('updates cache after successful fetch', async () => {
    // Mock fetch returns new data
    const newSkills = [{ ...mockSkills[0], name: 'Updated Skill' }];
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(newSkills),
    } as Response);

    render(<MarketplacePage />);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(screen.getByText('Updated Skill')).toBeInTheDocument();
    });

    // Check localStorage updated
    expect(localStorage.getItem('marketplace_cache')).toContain('Updated Skill');
  });

  it('handles fetch error gracefully when cache exists', async () => {
    localStorage.setItem('marketplace_cache', JSON.stringify(mockSkills));
    
    // Mock fetch failure
    (global.fetch as Mock).mockRejectedValue(new Error('Network error'));

    render(<MarketplacePage />);

    // Should still show cached data
    expect(screen.getByText('Test Skill')).toBeInTheDocument();
    
    // Should NOT show error message replacing content
    expect(screen.queryByText(/Failed to load marketplace data/)).not.toBeInTheDocument();
  });

  it('shows error when fetch fails and no cache', async () => {
    // No cache
    (global.fetch as Mock).mockRejectedValue(new Error('Network error'));

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load marketplace data/)).toBeInTheDocument();
    });
  });
});
