// src/App.tsx
import { AppRoutes } from './routes';
import { ThemeProvider } from '@/providers/ThemeProvider';
import {Button} from "./components/ui/Button"

import { ToastRenderer } from '@/components/ToastRenderer';
import { useEffect } from 'react';
 
import './App.css';
import '@/styles/framer-motion.css';
export default function App() {
  useEffect(() => {}, []);

  return (
    <ThemeProvider>
      <AppRoutes />
      <ToastRenderer />
    </ThemeProvider>
  );
}
