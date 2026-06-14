$ErrorActionPreference = "Stop"

$rawDir    = "$PSScriptRoot/StakeholderApi.Tests/coverage/raw"
$reportDir = "$PSScriptRoot/StakeholderApi.Tests/coverage/report"

# Run tests with coverage collection
dotnet test "$PSScriptRoot/StakeholderApi.Tests/StakeholderApi.Tests.csproj" `
    --collect:"XPlat Code Coverage" `
    --results-directory $rawDir `
    --settings "$PSScriptRoot/coverage.runsettings"

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Install reportgenerator if not already available
if (-not (Get-Command reportgenerator -ErrorAction SilentlyContinue)) {
    dotnet tool install --global dotnet-reportgenerator-globaltool
}

# Generate HTML report
reportgenerator `
    -reports:"$rawDir/**/coverage.cobertura.xml" `
    -targetdir:$reportDir `
    -reporttypes:Html `
    -verbosity:Warning

Write-Host ""
Write-Host "Coverage report: $reportDir/index.html"
