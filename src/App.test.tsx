import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders operations dashboard', () => {
  render(<App />);
  expect(screen.getByText(/Дашборд инцидентов/i)).toBeInTheDocument();
});
