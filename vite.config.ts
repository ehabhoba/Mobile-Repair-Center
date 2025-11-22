import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Using a global constant for stability
    '__AI_KEYS__': JSON.stringify([
      "AIzaSyCZ6floCUrzH_Bqt1ThaZtHoLAUaJEERhc", // New Key 1
      "AIzaSyBiy_ANyBBr51UWVXVFfoRXAeIGc-BW_mY", // New Key 2
      "AIzaSyBkboUKYhrZA2gRx_86tBzJ-YbtSnIEuB8"  // New Key 3
    ]),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});