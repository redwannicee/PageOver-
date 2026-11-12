import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import App from './App';
import './index.css';
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
createRoot(document.getElementById('root')!).render(
  <StrictMode><QueryClientProvider client={new QueryClient()}><App /></QueryClientProvider></StrictMode>);
