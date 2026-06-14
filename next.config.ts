import type { NextConfig } from 'next'
import path from 'path'
import os from 'os'

// Em produção (Vercel/CI) usa o diretório padrão .next
// Localmente no Windows com OneDrive, redireciona para %TEMP% para evitar
// conflito de bloqueio de arquivo do OneDrive durante o build
const isVercel = Boolean(process.env.VERCEL)

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { distDir: path.join(os.tmpdir(), 'legislativo-next-build') }),
}

export default nextConfig
