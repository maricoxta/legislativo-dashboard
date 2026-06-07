# Legislativo Dashboard – servidor HTTP local (PowerShell puro, sem dependências)
# Execute: powershell -ExecutionPolicy Bypass -File start-server.ps1

$port = 3000
$root = Join-Path $PSScriptRoot "legislativo-dashboard"
$prefix = "http://localhost:$port/"

$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host ""
Write-Host "  ✅  Legislativo Dashboard rodando em $prefix" -ForegroundColor Green
Write-Host "  Abrindo no navegador..." -ForegroundColor Cyan
Write-Host "  Pressione Ctrl+C para parar." -ForegroundColor Yellow
Write-Host ""

Start-Process $prefix

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $urlPath = $req.Url.LocalPath
    if ($urlPath -eq '/' -or $urlPath -eq '') { $urlPath = '/index.html' }

    $filePath = Join-Path $root ($urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar))

    if (Test-Path $filePath -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($filePath)
      $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
      $content = [System.IO.File]::ReadAllBytes($filePath)

      $res.StatusCode = 200
      $res.ContentType = $mime
      $res.Headers.Add('Access-Control-Allow-Origin', '*')
      $res.Headers.Add('Cache-Control', 'no-cache')
      $res.ContentLength64 = $content.Length
      $res.OutputStream.Write($content, 0, $content.Length)
    } else {
      # SPA fallback – return index.html
      $indexPath = Join-Path $root "index.html"
      if (Test-Path $indexPath) {
        $content = [System.IO.File]::ReadAllBytes($indexPath)
        $res.StatusCode = 200
        $res.ContentType = 'text/html; charset=utf-8'
        $res.ContentLength64 = $content.Length
        $res.OutputStream.Write($content, 0, $content.Length)
      } else {
        $res.StatusCode = 404
        $body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
        $res.OutputStream.Write($body, 0, $body.Length)
      }
    }
    $res.OutputStream.Close()
    Write-Host "  $($req.HttpMethod) $($req.Url.PathAndQuery) -> $($res.StatusCode)" -ForegroundColor DarkGray
  }
} finally {
  $listener.Stop()
  Write-Host "Servidor encerrado." -ForegroundColor Yellow
}
