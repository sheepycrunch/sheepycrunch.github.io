# PowerShell 배포 스크립트
Write-Host "========================================"
Write-Host "   로컬 배포 스크립트"
Write-Host "========================================"
Write-Host ""

# 환경변수 로드
if (Test-Path "key.env") {
    Write-Host "key.env 파일에서 환경변수를 로드합니다..."
    Get-Content "key.env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "환경변수 로드 완료."
} elseif (Test-Path ".env") {
    Write-Host ".env 파일에서 환경변수를 로드합니다..."
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "환경변수 로드 완료."
} else {
    Write-Host "환경변수 파일이 없습니다. key.env 또는 .env 파일을 생성하세요."
    Read-Host "Press Enter to continue"
    exit 1
}

# 환경변수 확인
if (-not $env:USERNAME -or -not $env:PASSWORD) {
    Write-Host "ERROR: USERNAME 또는 PASSWORD 환경변수가 설정되지 않았습니다."
    Read-Host "Press Enter to continue"
    exit 1
}

if (-not $env:USERNAME) {
    $env:USERNAME = "dakimakura"
    Write-Host "SITE_NAME이 설정되지 않아 기본값 'dakimakura'를 사용합니다."
}

Write-Host "사이트: $env:USERNAME"
Write-Host "사용자명: $env:USERNAME"
Write-Host ""

# 1. 이미지 업로드
Write-Host "1단계: 이미지 업로드 중..."
node upload-images.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "이미지 업로드 실패"
    Read-Host "Press Enter to continue"
    exit 1
}

# 2. Eleventy 빌드
Write-Host ""
Write-Host "2단계: 사이트 빌드 중..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "빌드 실패"
    Read-Host "Press Enter to continue"
    exit 1
}

# 3. Neocities 배포
Write-Host ""
Write-Host "3단계: Neocities 배포 중..."
node deploy-to-neocities.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "배포 실패"
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "   배포가 완료되었습니다!"
Write-Host "   - Neocities: 업데이트됨"
Write-Host "   - 로컬에서만 처리됨 (GitHub 푸시 없음)"
Write-Host "========================================"
Read-Host "Press Enter to continue"
