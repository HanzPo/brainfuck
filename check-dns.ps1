Write-Host "DNS Configuration Check for brainfuck.hanzpo.com" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check CNAME record for subdomain
Write-Host "Checking CNAME record for brainfuck.hanzpo.com..." -ForegroundColor Yellow
$cname = Resolve-DnsName -Name "brainfuck.hanzpo.com" -Type CNAME -ErrorAction SilentlyContinue

if ($cname) {
    Write-Host "CNAME record found:" -ForegroundColor Green
    Write-Host "  brainfuck.hanzpo.com -> $($cname.NameHost)" -ForegroundColor White
    
    if ($cname.NameHost -eq "hanzpo.github.io") {
        Write-Host "  CNAME is correctly pointing to hanzpo.github.io" -ForegroundColor Green
    } else {
        Write-Host "  CNAME should point to hanzpo.github.io" -ForegroundColor Red
    }
} else {
    Write-Host "No CNAME record found for brainfuck.hanzpo.com" -ForegroundColor Red
}

Write-Host ""

# Check A records for root domain
Write-Host "Checking A records for hanzpo.com (root domain)..." -ForegroundColor Yellow
$aRecords = Resolve-DnsName -Name "hanzpo.com" -Type A -ErrorAction SilentlyContinue

if ($aRecords) {
    Write-Host "A records found for hanzpo.com:" -ForegroundColor White
    foreach ($record in $aRecords) {
        Write-Host "  - $($record.IPAddress)" -ForegroundColor White
    }
    
    # Check if it's pointing to wrong IP
    $wrongIP = $aRecords | Where-Object { $_.IPAddress -eq "76.76.21.21" }
    if ($wrongIP) {
        Write-Host "  WARNING: Found incorrect IP 76.76.21.21 - This should be removed!" -ForegroundColor Red
        Write-Host "  This IP is not a GitHub Pages server and will cause DNS resolution issues." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "GitHub Pages IP addresses (for reference):" -ForegroundColor Cyan
Write-Host "  185.199.108.153"
Write-Host "  185.199.109.153"
Write-Host "  185.199.110.153"
Write-Host "  185.199.111.153"

Write-Host ""
Write-Host "Recommendations:" -ForegroundColor Yellow
Write-Host "1. Remove the A record for @ pointing to 76.76.21.21" -ForegroundColor White
Write-Host "2. Keep only the CNAME record: brainfuck.hanzpo.com -> hanzpo.github.io" -ForegroundColor White
Write-Host "3. Wait 5-30 minutes for DNS propagation" -ForegroundColor White
Write-Host "4. Check GitHub Pages settings to ensure DNS Check completes" -ForegroundColor White 