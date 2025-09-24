# Neocities 자동 배포 설정 가이드

## API 키 생성 및 설정

### 1. Neocities API 키 생성

**⚠️ 주의: USERNAME과 PASSWORD는 개인정보이므로 코드에 포함하지 마세요!**

Neocities 계정에 로그인한 후 API 키를 생성합니다:

```bash
# 실제 사용 시에는 본인의 계정 정보를 입력하세요
curl -u "USER:PASS"" "https://neocities.org/api/key"
```

**또는 브라우저에서 직접 API 호출:**
1. Neocities에 로그인
2. 브라우저 개발자 도구 열기 (F12)
3. Console에서 다음 코드 실행:
```javascript
fetch('https://neocities.org/api/key', {
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + btoa('USER:PASS"')
  }
}).then(response => response.json()).then(data => console.log(data));
```

응답 예시:
```json
{
  "result": "success",
  "api_key": "da77c3530c30593663bf7b797323e48c"
}
```

### 2. GitHub Secrets 설정

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **"New repository secret"** 클릭
3. **Name**: `NEOCITIES_API_KEY`
4. **Secret**: 위에서 생성한 API 키 입력
5. **"Add secret"** 클릭

## 워크플로우 설명

### 이미지 전용 업로드 (`upload-images-neocities.yml`)
- **트리거**: `src/images/` 폴더 변경 시
- **기능**: 이미지만 Neocities에 업로드
- **cleanup**: `false` (기존 파일 유지)

### 전체 사이트 배포 (`deploy-neocities.yml`)
- **트리거**: `main` 브랜치 푸시 시
- **기능**: 전체 사이트를 Neocities에 배포
- **cleanup**: `true` (기존 파일 삭제 후 새로 업로드)

### 통합 배포 (`deploy-all.yml`)
- **트리거**: `main` 브랜치 푸시 시
- **기능**: GitHub Pages + Neocities 동시 배포

## 사용 방법

1. **이미지 추가**:
   - `src/images/` 폴더에 이미지 추가
   - `git push origin main`으로 푸시
   - 자동으로 Neocities에 이미지 업로드

2. **사이트 업데이트**:
   - 소스 코드 수정
   - `git push origin main`으로 푸시
   - 자동으로 두 플랫폼에 배포

## 배포 확인

- **GitHub Pages**: `https://sheepycrunch.github.io`
- **Neocities**: `https://dakimakura.neocities.org/`

## API 제한사항

- **요청 제한**: 1분에 1회 이하로 제한
- **스팸 방지**: 서버에 과도한 API 요청 금지
- **게임화 방지**: 순위 조작 목적의 API 사용 금지

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
3. Neocities 계정 상태 확인

### 배포가 실패하는 경우
1. GitHub Actions 로그 확인
2. Neocities API 상태 확인
3. 파일 크기 제한 확인

## 참고 링크

- [Neocities API 문서](https://neocities.org/api)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
