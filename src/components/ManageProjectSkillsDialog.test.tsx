import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageProjectSkillsDialog } from './ManageProjectSkillsDialog';
import { Project } from '@/hooks/useAppStore';
import { invoke } from '@tauri-apps/api/core';
import { readDir } from '@tauri-apps/plugin-fs';
import { act } from 'react';

// Mock dependencies
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  readDir: vi.fn(),
}));

// Provide proper lucide mock
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    RefreshCw: () => <span data-testid="refresh-icon" />,
    Trash2: () => <span data-testid="trash-icon" />,
    FolderOpen: () => <span data-testid="folder-icon" />,
    X: () => <span data-testid="x-icon" />,
  };
});

describe('ManageProjectSkillsDialog Integration', () => {
  const mockProject: Project = {
    name: 'test-project',
    path: '/users/home/workspace/test-project',
    has_git: true,
    has_mcp: false,
    has_agents_md: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup generic successful invoke
    (invoke as any).mockResolvedValue(null);
  });

  it('renders correctly and tries to load skills from project directories', async () => {
    // Setup mock responses
    (readDir as any).mockImplementation((path: string) => {
      if (path.includes('.cursor')) {
        return Promise.resolve([
          { name: 'cursor-skill-1', isDirectory: true },
        ]);
      }
      return Promise.reject(new Error('Directory not found'));
    });

    await act(async () => {
      render(
        <ManageProjectSkillsDialog 
          isOpen={true} 
          onClose={() => {}} 
          project={mockProject} 
        />
      );
    });

    // Initial render checks
    expect(screen.getByText('Manage Project Skills')).toBeInTheDocument();
    expect(screen.getByText('Skills installed in test-project')).toBeInTheDocument();

    // Wait for the simulated filesystem read to complete
    await waitFor(() => {
      expect(screen.getByText('cursor-skill-1')).toBeInTheDocument();
    });
  });

  it('handles deleting a skill via invoke', async () => {
    (readDir as any).mockImplementation((path: string) => {
      if (path.includes('.cursor')) {
        return Promise.resolve([
          { name: 'cursor-skill-1', isDirectory: true },
        ]);
      }
      return Promise.reject(new Error('Directory not found'));
    });

    await act(async () => {
      render(
        <ManageProjectSkillsDialog 
          isOpen={true} 
          onClose={() => {}} 
          project={mockProject} 
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('cursor-skill-1')).toBeInTheDocument();
    });

    // Mock confirm dialog
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);

    // Find and click delete button
    const deleteButton = screen.getByTestId('trash-icon').closest('button');
    expect(deleteButton).toBeInTheDocument();
    
    if (deleteButton) {
      await act(async () => {
        fireEvent.click(deleteButton);
      });
    }

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('delete_skill', {
        path: '/users/home/workspace/test-project/.cursor/skills/cursor-skill-1'
      });
    });

    // Restore
    window.confirm = originalConfirm;
  });
});
