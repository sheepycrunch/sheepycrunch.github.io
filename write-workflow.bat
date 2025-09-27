@echo off
chcp 65001 >nul
echo ========================================
echo    Write 워크플로우 통합 스크립트
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

REM 임시 폴더 생성
set TEMP_DIR=%TEMP%\write-workflow
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

echo 1단계: 다운로드 폴더에서 파일 수집 중...

REM 다운로드 폴더에서 posts.json 찾기
set DOWNLOADS=%USERPROFILE%\Downloads
if exist "%DOWNLOADS%\posts.json" (
    copy "%DOWNLOADS%\posts.json" "%TEMP_DIR%\posts.json" >nul
    echo ✓ posts.json 수집 완료
) else (
    echo ⚠ posts.json을 찾을 수 없습니다.
)

REM 다운로드 폴더에서 이미지 파일들 찾기
set IMAGE_COUNT=0
for %%f in ("%DOWNLOADS%\*.jpg" "%DOWNLOADS%\*.jpeg" "%DOWNLOADS%\*.png" "%DOWNLOADS%\*.gif" "%DOWNLOADS%\*.webp") do (
    if exist "%%f" (
        copy "%%f" "%TEMP_DIR%\" >nul
        echo ✓ 이미지 수집: %%~nxf
        set /a IMAGE_COUNT+=1
    )
)

if %IMAGE_COUNT% GTR 0 (
    echo ✓ 총 %IMAGE_COUNT%개 이미지 수집 완료
) else (
    echo ⚠ 이미지 파일을 찾을 수 없습니다.
)

echo.
echo 2단계: 파일 복사 및 이미지 처리 중...

REM posts.json 복사
if exist "%TEMP_DIR%\posts.json" (
    copy "%TEMP_DIR%\posts.json" "src\posts.json" >nul
    echo ✓ posts.json 복사 완료
    
    REM Base64 이미지를 실제 파일로 변환
    echo Base64 이미지 처리 중...
    node process-images.js "src\posts.json"
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠ 이미지 처리 중 오류 발생
    ) else (
        echo ✓ 이미지 처리 완료
    )
) else (
    echo ⚠ posts.json을 찾을 수 없습니다.
)

REM 이미지 파일들 복사
if exist "%TEMP_DIR%\*.jpg" (
    copy "%TEMP_DIR%\*.jpg" "src\images\uploaded\" >nul
)
if exist "%TEMP_DIR%\*.jpeg" (
    copy "%TEMP_DIR%\*.jpeg" "src\images\uploaded\" >nul
)
if exist "%TEMP_DIR%\*.png" (
    copy "%TEMP_DIR%\*.png" "src\images\uploaded\" >nul
)
if exist "%TEMP_DIR%\*.gif" (
    copy "%TEMP_DIR%\*.gif" "src\images\uploaded\" >nul
)
if exist "%TEMP_DIR%\*.webp" (
    copy "%TEMP_DIR%\*.webp" "src\images\uploaded\" >nul
)

echo ✓ 파일 복사 완료

echo.
echo 3단계: 사이트 빌드 중...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 빌드 실패
    goto cleanup
)

echo ✓ 빌드 완료

echo.
echo 4단계: Neocities 배포 중...
node deploy-to-neocities.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 배포 실패
    goto cleanup
)

echo ✓ 배포 완료

echo.
echo 5단계: 임시 파일 정리 중...

:cleanup
REM 임시 폴더 삭제
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"

REM 다운로드 폴더에서 처리된 파일들 삭제
if exist "%DOWNLOADS%\posts.json" del "%DOWNLOADS%\posts.json" >nul
for %%f in ("%DOWNLOADS%\*.jpg" "%DOWNLOADS%\*.jpeg" "%DOWNLOADS%\*.png" "%DOWNLOADS%\*.gif" "%DOWNLOADS%\*.webp") do (
    if exist "%%f" del "%%f" >nul
)

echo ✓ 정리 완료

echo.
echo ========================================
echo    워크플로우가 완료되었습니다!
echo    - 파일 수집: 완료
echo    - 파일 복사: 완료  
echo    - 사이트 빌드: 완료
echo    - Neocities 배포: 완료
echo    - 임시 파일 정리: 완료
echo ========================================
