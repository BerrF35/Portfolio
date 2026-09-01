param(
  [int]$Port = 4173
)

$siteRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$mimeTypes = @{
  '.css' = 'text/css; charset=utf-8'
  '.glb' = 'model/gltf-binary'
  '.gif' = 'image/gif'
  '.html' = 'text/html; charset=utf-8'
  '.jpg' = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.js' = 'text/javascript; charset=utf-8'
  '.png' = 'image/png'
  '.step' = 'application/step'
  '.wasm' = 'application/wasm'
}

$listener.Start()
Write-Host "Preview running at http://127.0.0.1:$Port/"
Write-Host 'Press Ctrl+C to stop it.'

try {
  while ($listener.Server.IsBound) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
      $requestLine = $reader.ReadLine()
      while ($true) {
        $header = $reader.ReadLine()
        if ($null -eq $header -or $header.Length -eq 0) { break }
      }

      $method = ''
      $rawPath = '/'
      if ($requestLine) {
        $requestParts = $requestLine -split ' '
        $method = $requestParts[0]
        if ($requestParts.Length -gt 1) { $rawPath = $requestParts[1] }
      }
      $relativePath = [System.Uri]::UnescapeDataString(($rawPath -split '\?')[0])
      if ($relativePath -eq '/') { $relativePath = '/index.html' }
      $relativePath = $relativePath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
      $target = [System.IO.Path]::GetFullPath((Join-Path $siteRoot $relativePath))

      if (-not $target.StartsWith($siteRoot, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $target -PathType Leaf)) {
        $status = '404 Not Found'
        $contentType = 'text/plain; charset=utf-8'
        $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not found')
      } else {
        $status = '200 OK'
        $extension = [System.IO.Path]::GetExtension($target).ToLowerInvariant()
        $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { 'application/octet-stream' }
        $bytes = [System.IO.File]::ReadAllBytes($target)
      }

      $responseHeader = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($responseHeader)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      if ($method -ne 'HEAD') { $stream.Write($bytes, 0, $bytes.Length) }
      $stream.Flush()
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
