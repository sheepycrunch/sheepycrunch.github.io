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

REM 프로덕션 빌드 환경변수 설정 
set ELEVENTY_ENV=production

echo 사이트: %SITE_NAME%
echo 사용자명: %NEOCITIES_USERNAME%
echo.

REM 1. Eleventy 빌드
echo 1단계: 사이트 빌드 중...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo 빌드 실패
    pause
    exit /b 1
)

REM 2. Neocities 배포
echo.
echo 2단계: Neocities 배포 중...
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
echo ========================================
echo.