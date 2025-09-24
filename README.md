# DIY Hamster Dungeon 블로그

11ty(Static Site Generator)를 사용한 개인 블로그입니다.

## 개발 환경 설정

### 필수 요구사항
- Node.js 18 이상
- npm

### 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 개발 서버 실행:
```bash
npm run serve
```

3. 빌드:
```bash
npm run build
```

## 프로젝트 구조

```
src/
├── _includes/          # 공통 템플릿
│   └── layout.njk     # 기본 레이아웃
├── _data/             # 데이터 파일
│   └── site.json      # 사이트 설정
├── index.njk          # 홈페이지
├── 404.njk            # 404 페이지
├── style.css          # 스타일시트
└── robots.txt         # 검색엔진 설정
```

## 배포

이 프로젝트는 GitHub Actions를 통해 자동으로 GitHub Pages에 배포됩니다.

- `main` 브랜치에 푸시하면 자동으로 빌드되고 배포됩니다.
- 빌드 결과물은 `_site/` 디렉토리에 생성됩니다.

## 사용된 기술

- [11ty](https://www.11ty.dev/) - Static Site Generator
- [Nunjucks](https://mozilla.github.io/nunjucks/) - 템플릿 엔진
- GitHub Pages - 호스팅
- GitHub Actions - CI/CD
