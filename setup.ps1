# Student Management Platform - Setup Script

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Student Management Platform Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
$mongoRunning = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoRunning -and $mongoRunning.Status -eq "Running") {
    Write-Host "✓ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "⚠ MongoDB service not found or not running" -ForegroundColor Yellow
    Write-Host "  Please ensure MongoDB is installed and running" -ForegroundColor Yellow
    Write-Host "  Or update MONGODB_URI in .env.local to use MongoDB Atlas" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review and update .env.local with your configuration" -ForegroundColor White
Write-Host "2. Start the development server: npm run dev" -ForegroundColor White
Write-Host "3. Initialize admin account: Visit http://localhost:3000/api/init" -ForegroundColor White
Write-Host "4. Login at: http://localhost:3000/admin/login" -ForegroundColor White
Write-Host ""
Write-Host "Default Admin Credentials:" -ForegroundColor Yellow
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to start the development server..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Green
npm run dev
