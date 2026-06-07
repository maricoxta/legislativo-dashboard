import type { NextConfig } from 'next'
import path from 'path'
import os from 'os'

// Coloca .next fora do OneDrive para evitar conflito de bloqueio de arquivo
const nextConfig: NextConfig = {
  distDir: path.join(os.tmpdir(), 'legislativo-next-build'),
}

export default nextConfig
