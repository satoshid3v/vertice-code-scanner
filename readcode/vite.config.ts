import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/core', 'src/hooks', 'src/index.ts']
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VerticeCodeScanner',
      formats: ['es', 'umd'],
      fileName: (format) => `vertice-code-scanner.${format}.js`,
    },
    rollupOptions: {
      // Asegurarse de externalizar react y evitar que se incluya en el bundle final
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
})
