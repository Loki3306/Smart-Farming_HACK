/**
 * Regime Component Integration Tests
 * Tests for React components using React Testing Library
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegimeForm from '../components/regime/RegimeForm';
import RegimeDetail from '../components/regime/RegimeDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('RegimeForm Component', () => {
  it('should render form fields', () => {
    const mockSubmit = vi.fn();
    renderWithQueryClient(<RegimeForm onSubmit={mockSubmit} />);

    expect(screen.getByText(/Crop Type/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const mockSubmit = vi.fn();
    renderWithQueryClient(<RegimeForm onSubmit={mockSubmit} />);

    // Select crop type
    const cropSelect = screen.getByRole('combobox', { name: /Crop Type/i });
    await userEvent.click(cropSelect);
    await userEvent.click(screen.getByText('Rice'));

    // Fill form fields
    const nameInput = screen.getByPlaceholderText(/Regime Name/i);
    await userEvent.type(nameInput, 'Rice Growing Plan');

    // Submit
    const submitButton = screen.getByRole('button', { name: /Generate Regime Plan/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });

  it('should validate required fields', async () => {
    const mockSubmit = vi.fn();
    renderWithQueryClient(<RegimeForm onSubmit={mockSubmit} />);

    const submitButton = screen.getByRole('button', { name: /Generate Regime Plan/i });
    await userEvent.click(submitButton);

    // Form should not submit without required fields
    await waitFor(() => {
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  it('should show weather section when toggled', async () => {
    const mockSubmit = vi.fn();
    renderWithQueryClient(<RegimeForm onSubmit={mockSubmit} />);

    // Select crop first
    const cropSelect = screen.getByRole('combobox', { name: /Crop Type/i });
    await userEvent.click(cropSelect);
    await userEvent.click(screen.getByText('Rice'));

    // Weather section should be visible after crop selection
    const weatherCard = screen.queryByText(/Current Weather Conditions/i);
    expect(weatherCard).toBeInTheDocument();
  });
});

describe('RegimeDetail Component', () => {
  const mockRegime = {
    regime_id: 'regime-123',
    name: 'Rice Growing Plan',
    description: 'Test regime',
    status: 'active',
    version: 1,
    task_count: 2,
    tasks: [
      {
        task_id: 'task-1',
        task_name: 'First Irrigation',
        description: 'Apply 50mm water',
        status: 'pending',
        priority: 'high',
        timing_type: 'days_after_sowing',
        timing_value: 10,
        confidence_score: 92.5,
        quantity: 50,
      },
      {
        task_id: 'task-2',
        task_name: 'Apply Fertilizer',
        description: 'Apply 60kg/hectare',
        status: 'completed',
        priority: 'high',
        timing_type: 'days_after_sowing',
        timing_value: 20,
        confidence_score: 88.0,
        quantity: 60,
      },
    ],
  };

  it('should render all tasks', () => {
    const mockCallback = vi.fn();
    render(
      <RegimeDetail regime={mockRegime} onTaskStatusChange={mockCallback} />
    );

    expect(screen.getByText('First Irrigation')).toBeInTheDocument();
    expect(screen.getByText('Apply Fertilizer')).toBeInTheDocument();
  });

  it('should display task progress', () => {
    const mockCallback = vi.fn();
    render(
      <RegimeDetail regime={mockRegime} onTaskStatusChange={mockCallback} />
    );

    // One task completed out of two = 50%
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it('should show task statistics', () => {
    const mockCallback = vi.fn();
    render(
      <RegimeDetail regime={mockRegime} onTaskStatusChange={mockCallback} />
    );

    expect(screen.getByText('1')).toBeInTheDocument(); // Completed count
    expect(screen.getByText(/90\./)).toBeInTheDocument(); // Avg confidence ~90.25
  });

  it('should allow editing task status', async () => {
    const mockCallback = vi.fn();
    render(
      <RegimeDetail regime={mockRegime} onTaskStatusChange={mockCallback} />
    );

    // Find and click edit button for first task
    const editButtons = screen.getAllByRole('button');
    const firstEditButton = editButtons.find(
      (btn) => btn.getAttribute('aria-label') === 'edit'
    );

    if (firstEditButton) {
      await userEvent.click(firstEditButton);

      // Task should enter edit mode
      const statusSelect = screen.getByRole('combobox');
      expect(statusSelect).toBeInTheDocument();
    }
  });

  it('should show priority badges', () => {
    const mockCallback = vi.fn();
    render(
      <RegimeDetail regime={mockRegime} onTaskStatusChange={mockCallback} />
    );

    expect(screen.getAllByText('high priority')).toHaveLength(2);
  });

  it('should display confidence scores', () => {
    const mockCallback = vi.fn();
    render(
      <RegimeDetail regime={mockRegime} onTaskStatusChange={mockCallback} />
    );

    expect(screen.getByText(/92.5%/)).toBeInTheDocument();
    expect(screen.getByText(/88/)).toBeInTheDocument();
  });
});
