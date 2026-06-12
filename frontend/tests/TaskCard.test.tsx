import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/TaskCard';
import type { Task } from '@/types';

const baseTask: Task = {
  id: 'task-1',
  title: 'Buy groceries',
  description: 'Milk, bread, eggs',
  status: 'PENDING',
  priority: 'HIGH',
  dueDate: '2099-01-01T00:00:00Z',
  userId: 'user-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('<TaskCard />', () => {
  it('renders title, description, and badges', () => {
    render(<TaskCard task={baseTask} onToggleComplete={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText('Milk, bread, eggs')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('calls onToggleComplete when the checkbox is clicked', () => {
    const onToggleComplete = vi.fn();
    render(
      <TaskCard task={baseTask} onToggleComplete={onToggleComplete} onDelete={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggleComplete).toHaveBeenCalledWith(baseTask);
  });

  it('calls onDelete when the delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<TaskCard task={baseTask} onToggleComplete={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /delete buy groceries/i }));
    expect(onDelete).toHaveBeenCalledWith(baseTask);
  });

  it('shows the overdue marker when the due date is in the past', () => {
    const overdue: Task = { ...baseTask, dueDate: '2000-01-01T00:00:00Z' };
    render(<TaskCard task={overdue} onToggleComplete={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it('renders the checkbox as checked when the task is completed', () => {
    const completed: Task = { ...baseTask, status: 'COMPLETED' };
    render(<TaskCard task={completed} onToggleComplete={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});
