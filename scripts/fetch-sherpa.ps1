# Windows/PowerShell equivalent of fetch-sherpa.sh: fetches the prebuilt sherpa-onnx native libs (arm64-v8a) for offline TTS.
$ErrorActionPreference = 'Stop'
$Version = '1.13.8'
$Root = Join-Path $PSScriptRoot '..'
$Out = Join-Path $Root 'android\app\src\main\jniLibs\arm64-v8a'
$Stamp = Join-Path $Out '.sherpa-version'
if ((Test-Path $Stamp) -and ((Get-Content $Stamp -Raw).Trim() -eq $Version) -and (Test-Path (Join-Path $Out 'libsherpa-onnx-jni.so'))) {
  Write-Host "sherpa-onnx $Version already present"; exit 0
}
$Tmp = Join-Path ([IO.Path]::GetTempPath()) ("sherpa-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $Tmp | Out-Null
try {
  $Url = "https://github.com/k2-fsa/sherpa-onnx/releases/download/v$Version/sherpa-onnx-v$Version-android.tar.bz2"
  Write-Host "Downloading $Url (~46 MB)"
  Invoke-WebRequest -Uri $Url -OutFile (Join-Path $Tmp 'android.tar.bz2')
  tar -xjf (Join-Path $Tmp 'android.tar.bz2') -C $Tmp   # tar.exe ships with Windows 10+
  $Src = Get-ChildItem -Path $Tmp -Recurse -Directory -Filter 'arm64-v8a' | Select-Object -First 1
  if (-not $Src) { throw 'arm64-v8a libs not found in the archive' }
  New-Item -ItemType Directory -Force -Path $Out | Out-Null
  Copy-Item (Join-Path $Src.FullName 'libonnxruntime.so'), (Join-Path $Src.FullName 'libsherpa-onnx-jni.so') $Out -Force
  Set-Content -Path $Stamp -Value $Version
  Write-Host "sherpa-onnx $Version -> $Out"
} finally { Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue }
