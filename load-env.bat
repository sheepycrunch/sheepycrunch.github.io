@echo off
REM .env 파일에서 환경변수 로드

if exist key.env (
    echo key.env 파일에서 환경변수를 로드합니다...
    for /f "tokens=1,2 delims==" %%a in (key.env) do (
        if "%%a"=="NEOCITIES_USERNAME" set NEOCITIES_USERNAME=%%b
        if "%%a"=="NEOCITIES_PASSWORD" set NEOCITIES_PASSWORD=%%b
        if "%%a"=="SITE_NAME" set SITE_NAME=%%b
    )
    echo 환경변수 로드 완료.
    goto :end
)

if exist .env (
    echo .env 파일에서 환경변수를 로드합니다...
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="NEOCITIES_USERNAME" set NEOCITIES_USERNAME=%%b
        if "%%a"=="NEOCITIES_PASSWORD" set NEOCITIES_PASSWORD=%%b
        if "%%a"=="SITE_NAME" set SITE_NAME=%%b
    )
    echo 환경변수 로드 완료.
    goto :end
)

echo 환경변수 파일이 없습니다. key.env 또는 .env 파일을 생성하세요.
echo.
echo 1. key.env 파일 생성
echo 2. NEOCITIES_USERNAME, NEOCITIES_PASSWORD, SITE_NAME 설정
echo 3. 다시 실행
echo.
pause
exit /b 1

:end