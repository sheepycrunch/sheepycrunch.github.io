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

// 시작
console.log('Auto-upload script started...');
console.log('Press Ctrl+C to stop');

// posts.json 감시
watchFile('src/posts.json', 'posts.json');

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
