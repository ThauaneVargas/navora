import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Sem este arquivo o Vite compila o JSX no modo antigo (React.createElement),
// e o painel quebra no navegador com "React is not defined" (tela branca).
export default defineConfig({
  plugins: [react()],
});
