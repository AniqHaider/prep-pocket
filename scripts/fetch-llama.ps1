# Windows/PowerShell equivalent of fetch-llama.sh: fetches llama.cpp at the exact commit this app was built against.
$ErrorActionPreference = 'Stop'
$Commit = '4413a192410fad1f054e9216114087a3e01527a0'
$Dir = Join-Path $PSScriptRoot '..\android\app\src\main\cpp\llama.cpp'
if (-not (Test-Path (Join-Path $Dir '.git'))) { git clone https://github.com/ggml-org/llama.cpp.git $Dir }
git -C $Dir fetch --depth 1 origin $Commit 2>$null
if ($LASTEXITCODE -ne 0) { git -C $Dir fetch origin }
git -C $Dir checkout -q $Commit
Write-Host ("llama.cpp @ " + (git -C $Dir rev-parse --short HEAD))
