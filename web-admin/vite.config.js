import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O plugin do React liga o JSX automático: sem ele o Vite compila JSX como
// React.createElement e o painel quebra ("React is not defined") em todo
// arquivo que não importa React. Não remover.
export default defineConfig({
  plugins: [react()],
});
