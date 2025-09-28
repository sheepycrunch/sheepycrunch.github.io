const neocities = require('neocities');
const fs = require('fs');
const path = require('path');

// 환경변수에서 사용자명과 비밀번호 가져오기
const username = process.env.USERNAME;
const password = process.env.PASSWORD;

if (!username || !password) {
    console.error('ERROR: USERNAME or PASSWORD environment variables are not set.');
    process.exit(1);
}

console.log(`Site: ${username}`);
console.log(`Username: ${username}`);
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
    console.log('Uploading files to Neocities...');
    const files = collectFiles('_site');
    console.log(`Uploading ${files.length} files in total.`);
    
    const api = new neocities(username, password);
    
    api.upload(files, function(resp) {
        if (resp.result === 'success') {
            console.log(`✅ Deployment complete!: ${resp.files_uploaded || files.length}`);
        } else {
            console.error('❌ Deployment failed:', resp.message);
            process.exit(1);
        }
    });
    
} catch (error) {
    console.error('❌ Error occurred during deployment:', error.message);
    process.exit(1);
}