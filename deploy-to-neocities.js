const neocities = require('neocities');
const fs = require('fs');
const path = require('path');

// 환경변수에서 사용자명과 비밀번호 가져오기
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const siteName = process.env.USERNAME || 'dakimakura';

if (!username || !password) {
    console.error('ERROR: USERNAME 또는 PASSWORD 환경변수가 설정되지 않았습니다.');
    process.exit(1);
}

console.log(`사이트: ${siteName}`);
console.log(`사용자명: ${username}`);
console.log('');

// _site 폴더의 모든 파일을 수집
function collectFiles(dir, baseDir = '') {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = baseDir ? path.join(baseDir, item) : item;
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...collectFiles(fullPath, relativePath));
        } else {
            files.push({
                name: relativePath.replace(/\\/g, '/'), // Windows 경로를 Unix 경로로 변환
                path: fullPath
            });
        }
    }
    
    return files;
}

try {
    console.log('Neocities에 파일 업로드 중...');
    const files = collectFiles('_site');
    console.log(`총 ${files.length}개 파일을 업로드합니다.`);
    
    const api = new neocities(username, password);
    
    api.upload(files, function(resp) {
        if (resp.result === 'success') {
            console.log('✅ 배포가 완료되었습니다!');
            console.log(`업로드된 파일 수: ${resp.files_uploaded || files.length}`);
            console.log('');
            console.log('========================================');
            console.log('   배포가 완료되었습니다!');
            console.log('   - Neocities: 업데이트됨');
            console.log('   - 로컬에서만 처리됨 (GitHub 푸시 없음)');
            console.log('========================================');
        } else {
            console.error('❌ 배포 실패:', resp.message);
            process.exit(1);
        }
    });
    
} catch (error) {
    console.error('❌ 배포 중 오류 발생:', error.message);
    process.exit(1);
}