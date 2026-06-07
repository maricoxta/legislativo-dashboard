param([int]$Port = 8080)
$root = "C:\Users\Mariana\OneDrive\Área de Trabalho\setup\legislativo-dashboard"
$mimes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json'
  '.ico'  = 'image/x-icon'
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() } catch { Write-Error "Porta $Port em uso. $_"; exit 1 }

Write-Output "Servidor em http://localhost:$Port/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  $req = $ctx.Request
  $p = $req.Url.LocalPath
  if ($p -eq '/' -or $p -eq '') { $p = '/index.html' }
  $f = Join-Path $root $p.TrimStart('/')
  try {
    if (Test-Path $f -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($f)
      $mime = if ($mimes.ContainsKey($ext)) { $mimes[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($f)
      $res.StatusCode = 200
      $res.ContentType = $mime
      $res.Headers.Add('Access-Control-Allow-Origin', '*')
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $bytes = [System.IO.File]::ReadAllBytes((Join-Path $root 'index.html'))
      $res.StatusCode = 200
      $res.ContentType = 'text/html; charset=utf-8'
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch {
    $res.StatusCode = 500
  }
  try { $res.OutputStream.Close() } catch {}
}
