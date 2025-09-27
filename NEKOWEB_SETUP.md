# Nekoweb 자동 배포 설정 가이드

## API 키 생성 및 설정

### 1. Nekoweb API 키 생성

**⚠️ 주의: USERNAME과 PASSWORD는 개인정보이므로 코드에 포함하지 마세요!**

Nekoweb 계정에 로그인한 후 API 키를 수동으로 생성합니다:

1. **Nekoweb 웹사이트에서 직접 생성:**
   - [Nekoweb.org](https://nekoweb.org)에 로그인
   - 계정 설정에서 API 키 생성
   - 생성된 API 키를 복사하여 저장

2. **또는 API를 통한 생성:**
   ```bash
   # 실제 사용 시에는 본인의 계정 정보를 입력하세요
   curl -u "USERNAME:PASSWORD" "https://nekoweb.org/api/key"
   ```

3. **브라우저에서 직접 API 호출:**
   - Nekoweb에 로그인
   - 브라우저 개발자 도구 열기 (F12)
   - Console에서 다음 코드 실행:
   ```javascript
   fetch('https://nekoweb.org/api/key', {
     method: 'GET',
     headers: {
       'Authorization': 'Basic ' + btoa('USERNAME:PASSWORD')
     }
   }).then(response => response.json()).then(data => console.log(data));
   ```

### 2. GitHub Secrets 설정

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **"New repository secret"** 클릭
3. **Name**: `NEKOWEB_API_KEY`
4. **Secret**: 위에서 생성한 API 키 입력
5. **"Add secret"** 클릭

4. **Name**: `NEKOWEB_SITE_NAME`
5. **Secret**: Nekoweb 사이트 이름 입력 (예: yoursite)
6. **"Add secret"** 클릭

**참고**: 
- `NEKOWEB_SITE_NAME`은 사이트 이름만 입력하면 됩니다 (예: yoursite)
- 전체 URL은 자동으로 `https://yoursite.nekoweb.org`로 생성됩니다
- API 엔드포인트는 자동으로 `https://nekoweb.org/api`를 사용합니다

## 워크플로우 설명

### Nekoweb 전용 배포 (`deploy-nekoweb.yml`)
- **트리거**: `main` 브랜치 푸시 시
- **기능**: 전체 사이트를 Nekoweb에 배포
- **API**: Nekoweb API 사용

### 통합 배포 (`deploy-all.yml`)
- **트리거**: `main` 브랜치 푸시 시
- **기능**: GitHub Pages + Neocities + Nekoweb 동시 배포

## 사용 방법

1. **사이트 업데이트**:
   - 소스 코드 수정
   - `git push origin main`으로 푸시
   - 자동으로 세 플랫폼에 배포

## 배포 확인

- **GitHub Pages**: `https://sheepycrunch.github.io`
- **Neocities**: `https://dakimakura.neocities.org/`
- **Nekoweb**: `https://yoursite.nekoweb.org` (NEKOWEB_SITE_NAME 시크릿에서 설정한 사이트명)

## API 제한사항

- **요청 제한**: Nekoweb API 제한 확인 필요
- **파일 크기**: 업로드 가능한 파일 크기 제한 확인
- **인증**: Bearer 토큰 방식 사용

## 보안 주의사항

### ⚠️ 절대 하지 말아야 할 것들:
- **코드에 비밀번호 포함**: USERNAME, PASSWORD를 코드나 문서에 직접 작성
- **공개 저장소에 개인정보 업로드**: API 키, 비밀번호 등을 코드에 포함
- **Git 커밋에 민감한 정보 포함**: .gitignore에 추가하지 않은 개인정보

### ✅ 안전한 방법:
- **GitHub Secrets 사용**: 모든 민감한 정보는 GitHub Secrets에 저장
- **환경 변수 사용**: 로컬 개발 시 .env 파일 사용 (gitignore에 추가)
- **API 키만 사용**: 비밀번호 대신 API 키 사용

## 문제 해결

### API 키가 작동하지 않는 경우
1. API 키가 올바르게 생성되었는지 확인
2. GitHub Secrets에 정확히 입력되었는지 확인
3. Nekoweb 계정 상태 확인

### 배포가 실패하는 경우
1. GitHub Actions 로그 확인
2. Nekoweb API 상태 확인
3. 파일 크기 제한 확인
4. API 엔드포인트 URL 확인

## 참고 링크

- [Nekoweb API 문서](https://nekoweb.org/api)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
