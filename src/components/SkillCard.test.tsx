import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillCard } from './SkillCard';
import { LocalSkill, Tool } from '@/hooks/useAppStore';

// Mock Tooltip to just render children to simplify testing
vi.mock('@/components/ui/tooltip-simple', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>
}));

describe('SkillCard', () => {
  const mockSkill: LocalSkill = {
    name: 'Test Skill',
    description: 'A test skill description',
    path: '/users/home/.xskill/hub/test-skill',
    tool_key: 'xskill',
    disable_model_invocation: false,
    allowed_tools: [],
    content: ''
  };

  const mockTools: Tool[] = [
    { key: 'cursor', display_name: 'Cursor', installed: true, skills_dir: '' }
  ];

  beforeEach(() => {
    // Mock clipboard API for jsdom environment
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn()
      }
    });
  });

  it('renders skill information correctly', () => {
    render(
      <SkillCard 
        skill={mockSkill} 
        tools={mockTools} 
        onRefresh={() => {}} 
        onConfigure={() => {}} 
      />
    );

    expect(screen.getByText('Test Skill')).toBeInTheDocument();
    expect(screen.getByText('A test skill description')).toBeInTheDocument();
    expect(screen.getByText('Hub Skill')).toBeInTheDocument(); // because path includes .xskill/hub
  });

  it('handles configure click', () => {
    const onConfigureMock = vi.fn();
    render(
      <SkillCard 
        skill={mockSkill} 
        tools={mockTools} 
        onRefresh={() => {}} 
        onConfigure={onConfigureMock} 
      />
    );

    // Find the Configure button (Wrench icon) - it's the third button in the card
    const buttons = screen.getAllByRole('button');
    // Button order: Copy Path, Open Folder, Configure, Collect, Sync... 
    // Configure is at index 2 (0-based)
    const configureButton = buttons[2];
    fireEvent.click(configureButton);
    expect(onConfigureMock).toHaveBeenCalledWith(mockSkill);
  });
});
