import { render, screen, fireEvent } from '@testing-library/react';
import { HubPage } from './HubPage';
import { describe, it, expect, vi } from 'vitest';
import type { LocalSkill, Tool } from '@/hooks/useAppStore';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="icon-plus" />,
  ScanSearch: () => <div data-testid="icon-scan" />,
  RefreshCw: () => <div data-testid="icon-refresh" />,
  LayoutGrid: () => <div data-testid="icon-grid" />,
  Search: () => <div data-testid="icon-search" />,
  ExternalLink: () => <div data-testid="icon-link" />,
  Settings: () => <div data-testid="icon-settings" />,
}));

// Mock SkillCard since we only care about the list rendering
vi.mock('@/components/SkillCard', () => ({
  SkillCard: ({ skill }: { skill: LocalSkill }) => (
    <div data-testid="skill-card">
      <h3>{skill.name}</h3>
      <p>{skill.description}</p>
    </div>
  ),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'> & { layoutId?: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { layoutId, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockSkills: LocalSkill[] = [
  {
    name: 'Skill A',
    description: 'Description A',
    path: '/Users/test/.xskill/hub/skill-a',
    tool_key: 'xskill',
    disable_model_invocation: false,
    allowed_tools: [],
    content: '',
  },
  {
    name: 'Skill B',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    description: undefined as any, // Simulate missing description
    path: '/Users/test/.xskill/hub/skill-b',
    tool_key: 'xskill',
    disable_model_invocation: false,
    allowed_tools: [],
    content: '',
  },
  {
    name: 'Skill C',
    description: 'Description C',
    path: '/Users/test/.xskill/hub/skill-c',
    tool_key: 'xskill',
    disable_model_invocation: false,
    allowed_tools: [],
    content: '',
  },
];

const mockTools: Tool[] = [
  { key: 'cursor', display_name: 'Cursor', skills_dir: '', installed: true },
];

describe('HubPage Filtering', () => {
  const defaultProps = {
    skills: mockSkills,
    loading: false,
    onRefresh: vi.fn(),
    tools: mockTools,
    onConfigure: vi.fn(),
    onImport: vi.fn(),
    onNewSkill: vi.fn(),
  };

  it('renders all skills initially', () => {
    render(<HubPage {...defaultProps} />);
    expect(screen.getByText('Skill A')).toBeInTheDocument();
    expect(screen.getByText('Skill B')).toBeInTheDocument();
    expect(screen.getByText('Skill C')).toBeInTheDocument();
  });

  it('filters skills based on search query', () => {
    render(<HubPage {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search skills...');
    
    fireEvent.change(searchInput, { target: { value: 'Skill A' } });
    expect(screen.getByText('Skill A')).toBeInTheDocument();
    expect(screen.queryByText('Skill B')).not.toBeInTheDocument();
    expect(screen.queryByText('Skill C')).not.toBeInTheDocument();
  });

  it('handles missing description safely', () => {
    render(<HubPage {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search skills...');
    
    // Search for something that shouldn't match anything, to force description check
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
    expect(screen.queryByText('Skill A')).not.toBeInTheDocument();
    expect(screen.queryByText('Skill B')).not.toBeInTheDocument();
    
    // Search for Skill B's name
    fireEvent.change(searchInput, { target: { value: 'Skill B' } });
    expect(screen.getByText('Skill B')).toBeInTheDocument();
  });

  it('shows all skills when search is cleared', () => {
    render(<HubPage {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search skills...');
    
    // Type something
    fireEvent.change(searchInput, { target: { value: 'Skill A' } });
    expect(screen.queryByText('Skill C')).not.toBeInTheDocument();
    
    // Clear it
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Skill A')).toBeInTheDocument();
    expect(screen.getByText('Skill B')).toBeInTheDocument();
    expect(screen.getByText('Skill C')).toBeInTheDocument();
  });
});
