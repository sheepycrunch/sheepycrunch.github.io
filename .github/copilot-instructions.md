---
description:
globs:
alwaysApply: true
---

## 프로젝트 개요
- **사이트**: sheepycrunch.github.io (GitHub Pages)
- **용도**: BeeRef Pinterest Helper 앱의 정책 페이지 호스팅 + 개인 랜딩 페이지
- **빌드 도구**: Eleventy v3.1.2 (11ty), Nunjucks 템플릿
- **소스**: `src/` → `_site/` (빌드 산출물)

## 사이트 구조
- `src/index.njk` — 홈페이지 (layout.njk)
- `src/404.njk` — 404 페이지 (독립 레이아웃)
- `src/app.njk` — BeeRef Pinterest Helper 소개 (legal.njk)
- `src/privacy.njk` — 개인정보처리방침 (legal.njk)
- `src/terms.njk` — 이용약관 (legal.njk)
- `src/_includes/layout.njk` — 메인 레이아웃
- `src/_includes/legal.njk` — 법률/정책 페이지 독립 레이아웃

## PowerShell 명령어 주의사항
- **`&&` 연산자 사용 금지**: PowerShell에서는 `&&` 연산자가 지원되지 않음
  - 올바른 대안: 세미콜론(`;`)으로 명령어 연결
- **curl 대신 Invoke-RestMethod 사용**

## WSL 빌드 주의사항
- WSL에서 `npx`가 동작하지 않을 수 있음
- 대안 명령어: `"/mnt/c/Program Files/nodejs/node.exe" node_modules/@11ty/eleventy/cmd.cjs`
- Windows에서 직접 빌드: `npx @11ty/eleventy`

## 금지사항
- 반응형 스케일 설정 코드 사용 금지 (transform: scale() 등)
- 모바일 반응형 레이아웃 대신 고정 레이아웃 사용
- 이모지 사용 금지 — 대신 특수문자 사용 (*, >, - 등)

## 빌드 및 개발
- **빌드**: `npm run build` 또는 `npx @11ty/eleventy`
- **개발 서버**: `npm run serve` (포트 8080, http://localhost:8080)
- **서버 중복 실행 방지**: 이미 포트 8080이 열려있으면 새로 실행하지 않음
- `_site/`는 빌드 산출물이므로 버전 관리에 포함하지 않음 (.gitignore)

## 배포
- GitHub Pages로 배포 (현재 비활성화 상태: 소스가 gh-pages 브랜치로 설정됨)
- 배포 시 GitHub repo Settings > Pages에서 소스를 변경해야 함
- Neocities 관련 코드/설정은 모두 제거됨

## 관련 저장소
- `sheepycrunch/beeref-custom` (private) — BeeRef Pinterest 통합 포크
- `sheepycrunch/beeref-pinterest-helper` (private) — Pinterest Helper 서버

## 디자인 참고 자료
- `src/_data/style-tone-archive.md` — yuinoid.neocities.org (100%health) 분석
- `src/_data/style-tone-archive-axayacatl.md` — axayacatl.neocities.org 분석
- legal.njk 스타일: 모노크롬, 40px 좌측 보더, 점선 구분선, hover 반전