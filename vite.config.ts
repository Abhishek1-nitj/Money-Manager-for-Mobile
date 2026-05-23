import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Money-Manager-for-Mobile/',
  plugins: [react()],
})
