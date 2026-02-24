import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
  };

  const mockTools: Tool[] = [
    { key: 'cursor', display_name: 'Cursor', installed: true }
  ];

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

    // Assuming the Wrench icon button is the configure button
    const buttons = screen.getAllByRole('button');
    // First button is Wrench based on UI layout
    fireEvent.click(buttons[0]);
    expect(onConfigureMock).toHaveBeenCalledWith(mockSkill);
  });
});
