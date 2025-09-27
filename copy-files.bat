@echo off
echo 파일 복사 중...

REM 다운로드 폴더에서 posts.json 찾기
set DOWNLOADS=%USERPROFILE%\Downloads
if exist "%DOWNLOADS%\posts.json" (
    copy "%DOWNLOADS%\posts.json" "src\posts.json"
    echo posts.json 복사 완료
) else (
    echo posts.json을 찾을 수 없습니다.
)

REM 다운로드 폴더에서 이미지 파일들 찾기
for %%f in ("%DOWNLOADS%\*.jpg" "%DOWNLOADS%\*.jpeg" "%DOWNLOADS%\*.png" "%DOWNLOADS%\*.gif" "%DOWNLOADS%\*.webp") do (
    if exist "%%f" (
        copy "%%f" "src\images\uploaded\"
        echo 이미지 복사: %%~nxf
    )
)

echo 파일 복사 완료!
pause
