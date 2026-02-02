
Write-Host "Starting Online Banking System..."
Write-Host "1. Compiling Backend..."
javac backend/*.java

if ($LASTEXITCODE -eq 0) {
    Write-Host "2. Starting Server..."
    Write-Host "Server running at http://localhost:8080"
    Write-Host "Press Ctrl+C to stop."
    java backend.BankServer
} else {
    Write-Host "Compilation Failed!"
    exit 1
}
