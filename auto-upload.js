// 자동 업로드 스크립트
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const fetch = require('node-fetch');

// 환경변수
const NEOCITIES_API_KEY = process.env.NEOCITIES_API_KEY || '3d5c5a20afe79623ec87904e336d01a0';
const SITE_NAME = 'dakimakura';

// Node.js https로 Neocities에 업로드
function uploadToNeocities(filePath, fileName) {
  return new Promise((resolve, reject) => {
    try {
      const fs = require('fs');
      const https = require('https');
      const FormData = require('form-data');
      
      const form = new FormData();
      form.append(fileName, fs.createReadStream(filePath));
      
      const options = {
        hostname: 'neocities.org',
        path: '/api/upload',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NEOCITIES_API_KEY}`,
          ...form.getHeaders()
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log('Upload successful:', result);
            resolve(result);
          } catch (parseError) {
            console.log('Upload response:', data);
            resolve(data);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('Upload error:', error);
        reject(error);
      });
      
      form.pipe(req);
    } catch (error) {
      console.error('Upload error:', error);
      reject(error);
    }
  });
}

// 파일 변경 감지
function watchFile(filePath, fileName) {
  console.log(`Watching ${filePath} for changes...`);
  
  fs.watchFile(filePath, { interval: 1000 }, async (curr, prev) => {
    if (curr.mtime > prev.mtime) {
      console.log(`${fileName} changed, uploading to Neocities...`);
      
      try {
        await uploadToNeocities(filePath, fileName);
        console.log(`${fileName} uploaded successfully!`);
      } catch (error) {
        console.error(`Failed to upload ${fileName}:`, error);
      }
    }
  });
}

// 로컬 스토리지 데이터를 posts.json에 반영하는 함수
function updatePostsFromLocalStorage() {
  try {
    // 브라우저에서 실행된 스크립트가 localStorage에 저장한 데이터를 읽기
    // 실제로는 브라우저 콘솔에서 실행해야 함
    console.log('로컬 스토리지 데이터를 posts.json에 반영하려면:');
    console.log('1. 브라우저에서 http://localhost:8080/write.html 접속');
    console.log('2. 개발자 도구 콘솔에서 다음 명령어 실행:');
    console.log('   localStorage.getItem("hamster_posts")');
    console.log('3. 결과를 복사하여 아래 명령어로 posts.json 업데이트:');
    console.log('   node -e "const fs=require(\'fs\'); const data=JSON.parse(\'[여기에_복사한_데이터]\'); fs.writeFileSync(\'src/posts.json\', JSON.stringify({posts:data}, null, 2));"');
  } catch (error) {
    console.error('Error updating posts from localStorage:', error);
  }
}

// 시작
console.log('Auto-upload script started...');
console.log('Press Ctrl+C to stop');

// posts.json 감시
watchFile('src/posts.json', 'posts.json');

// 로컬 스토리지 데이터 반영 안내
updatePostsFromLocalStorage();

// 이미지 폴더 감시 (선택사항)
const imagesDir = 'src/images/uploaded';
if (fs.existsSync(imagesDir)) {
  fs.watch(imagesDir, (eventType, filename) => {
    if (filename && (filename.endsWith('.jpg') || filename.endsWith('.png') || filename.endsWith('.gif'))) {
      const imagePath = path.join(imagesDir, filename);
      console.log(`New image detected: ${filename}`);
      
      setTimeout(() => {
        uploadToNeocities(imagePath, filename).catch(console.error);
      }, 1000); // 1초 대기 후 업로드
    }
  });
}
