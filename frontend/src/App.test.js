import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
// Update "learn react" to the actual text you want to test for
const linkElement = screen.getByText(/your actual text/i);
  expect(linkElement).toBeInTheDocument();
});
