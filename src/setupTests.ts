import '@testing-library/jest-dom';
import { beforeAll, vi } from 'vitest';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

beforeAll(() => {
  // Add any global setup
});
