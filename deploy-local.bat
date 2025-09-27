@echo off
chcp 65001 >nul
echo ========================================
echo    로컬 배포 스크립트
echo ========================================
echo.

REM 환경변수 로드
call load-env.bat
if %ERRORLEVEL% NEQ 0 (
    echo 환경변수 로드 실패
    pause
    exit /b 1
)

REM 프로덕션 빌드 환경변수 설정 (write.njk 제외)
set ELEVENTY_ENV=production

echo 사이트: %SITE_NAME%
echo 사용자명: %NEOCITIES_USERNAME%
echo.

REM 1. 이미지 업로드
echo 1단계: 이미지 업로드 중...
node upload-images.js
if %ERRORLEVEL% NEQ 0 (
    echo 이미지 업로드 실패
    pause
    exit /b 1
)

REM 2. Eleventy 빌드
echo.
echo 2단계: 사이트 빌드 중...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo 빌드 실패
    pause
    exit /b 1
)

REM 3. Neocities 배포
echo.
echo 3단계: Neocities 배포 중...
node deploy-to-neocities.js
if %ERRORLEVEL% NEQ 0 (
    echo 배포 실패
    pause
    exit /b 1
)

echo.
echo ========================================
echo    배포가 완료되었습니다!
echo    - Neocities: 업데이트됨
echo    - 로컬에서만 처리됨 (GitHub 푸시 없음)
echo ========================================
echo.
echo 아무 키나 누르면 종료됩니다...
pause >nul