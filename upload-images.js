const fs = require('fs');
const path = require('path');
const https = require('https');

// 환경변수에서 설정 가져오기
const apiToken = process.env.NEOCITIES_API_KEY;
const siteName = process.env.SITE_NAME || 'dakimakura';

if (!apiToken) {
  console.error('ERROR: NEOCITIES_API_KEY 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

// Base64를 Buffer로 변환하는 함수
function base64ToBuffer(base64Data) {
  const arr = base64Data.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return Buffer.from(u8arr);
}

// Neocities에 이미지 업로드
async function uploadToNeocities(buffer, fileName) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      file: buffer.toString('base64'),
      filename: fileName
    });
    
    const options = {
      hostname: 'neocities.org',
      port: 443,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          resolve(`https://${siteName}.neocities.org/${fileName}`);
        } else {
          reject(new Error(`Upload failed: ${res.statusCode} ${data}`));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

// 포스트 데이터 처리
async function processPosts() {
  try {
    const postsPath = 'src/posts.json';
    
    if (!fs.existsSync(postsPath)) {
      console.log('posts.json 파일을 찾을 수 없습니다.');
      return;
    }
    
    const postsData = fs.readFileSync(postsPath, 'utf8');
    const posts = JSON.parse(postsData);
    let updated = false;
    let processedCount = 0;
    
    console.log(`총 ${posts.posts.length}개의 포스트를 검사합니다...`);
    
    for (const post of posts.posts) {
      if (post.description && post.description.ops) {
        const newOps = [];
        
        for (const op of post.description.ops) {
          if (op.insert && op.insert.image) {
            // Base64 이미지인 경우
            if (op.insert.image.startsWith('data:image/')) {
              try {
                console.log(`Base64 이미지 처리 중... (포스트 ID: ${post.id})`);
                
                // Base64를 Buffer로 변환
                const buffer = base64ToBuffer(op.insert.image);
                
                // 고유한 파일명 생성
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 15);
                const mime = op.insert.image.match(/data:image\/([^;]+)/)[1];
                const fileName = `images/uploaded/${timestamp}_${randomString}.${mime}`;
                
                // Neocities에 업로드
                const neocitiesUrl = await uploadToNeocities(buffer, fileName);
                
                // 새로운 op 생성 (Neocities URL 사용)
                newOps.push({
                  insert: {
                    image: neocitiesUrl
                  }
                });
                
                console.log(`✓ 이미지 업로드 완료: ${neocitiesUrl}`);
                updated = true;
                processedCount++;
                
                // 잠시 대기 (API 제한 방지)
                await new Promise(resolve => setTimeout(resolve, 1000));
                
              } catch (error) {
                console.error(`✗ 이미지 업로드 실패: ${error.message}`);
                // 실패한 경우 원본 유지
                newOps.push(op);
              }
            }
            // 상대경로 이미지인 경우 (이미 처리된 것)
            else if (op.insert.image.startsWith('images/uploaded/')) {
              console.log(`이미 처리된 이미지: ${op.insert.image}`);
              newOps.push(op);
            }
            // 외부 URL인 경우
            else if (op.insert.image.startsWith('http')) {
              console.log(`외부 URL 이미지: ${op.insert.image}`);
              newOps.push(op);
            }
            else {
              newOps.push(op);
            }
          } else {
            newOps.push(op);
          }
        }
        
        post.description.ops = newOps;
      }
    }
    
    if (updated) {
      // 업데이트된 포스트를 저장
      fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
      console.log(`\n✓ ${processedCount}개의 이미지가 처리되었습니다.`);
      console.log('✓ posts.json이 업데이트되었습니다.');
    } else {
      console.log('\n처리할 Base64 이미지가 없습니다.');
    }
    
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

// 실행
console.log('이미지 업로드를 시작합니다...\n');
processPosts();
