import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⚠️ สำคัญ: เปลี่ยน 'REPO_NAME' เป็นชื่อ Repository ของคุณบน GitHub
  // ตัวอย่าง: ถ้า repo ชื่อ 'driver-score', ให้ใส่ base: '/driver-score/'
  base: '/DriverScore2026/', 
})
