import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TodoApp from '../components/TodoApp';

beforeEach(() => {
  localStorage.clear();
});

describe('TodoApp basic flows', () => {
  test('adds a task with title, due, priority, tags, and notes', () => {
    render(<TodoApp />);
    fireEvent.change(screen.getByLabelText(/New task title/i), { target: { value: 'Water plants' } });
    fireEvent.change(screen.getByLabelText(/Due date/i), { target: { value: '2025-08-15' } });
    fireEvent.change(screen.getByLabelText(/Repeat/i), { target: { value: 'daily' } });
    fireEvent.change(screen.getByLabelText(/Priority/i), { target: { value: 'high' } });
    fireEvent.change(screen.getByLabelText(/New tag input/i), { target: { value: 'home' } });
    fireEvent.keyDown(screen.getByLabelText(/New tag input/i), { key: 'Enter' });
    fireEvent.change(screen.getByPlaceholderText(/Notes/i), { target: { value: 'in the morning' } });
    fireEvent.click(screen.getByRole('button', { name: /Add task/i }));

    expect(screen.getByText('Water plants')).toBeInTheDocument();
    expect(screen.getByText(/Due: 2025-08-15/)).toBeInTheDocument();
    expect(screen.getByText(/high/i)).toBeInTheDocument();
    expect(screen.getByText('#home')).toBeInTheDocument();
  });

  test('completing a daily recurring task updates due and shows streak', () => {
    render(<TodoApp />);
    fireEvent.change(screen.getByLabelText(/New task title/i), { target: { value: 'Meditate' } });
    fireEvent.change(screen.getByLabelText(/Repeat/i), { target: { value: 'daily' } });
    fireEvent.click(screen.getByRole('button', { name: /Add task/i }));
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    expect(screen.getByText(/🔥/)).toBeInTheDocument();
  });
});
