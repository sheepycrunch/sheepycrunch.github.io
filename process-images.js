const fs = require('fs');
const path = require('path');

// Base64 이미지를 실제 파일로 변환하는 함수
function processBase64Images(postsData) {
  const processedPosts = [];
  
  for (const post of postsData.posts) {
    if (post.description && post.description.ops) {
      const processedOps = [];
      
      for (const op of post.description.ops) {
        if (op.insert && op.insert.image && op.insert.image.startsWith('data:image/')) {
          // Base64 이미지를 실제 파일로 변환
          const base64Data = op.insert.image;
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const extension = base64Data.split(';')[0].split('/')[1];
          const fileName = `${timestamp}_${randomString}.${extension}`;
          const localPath = `images/uploads/${fileName}`;
          
          // Base64를 Buffer로 변환
          const base64String = base64Data.split(',')[1];
          const buffer = Buffer.from(base64String, 'base64');
          
          // src/images/uploads 폴더에 저장
          const uploadDir = path.join('src', 'images', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, buffer);
          
          console.log(`이미지 저장됨: ${filePath}`);
          
          // 상대 경로로 변경
          processedOps.push({
            insert: {
              image: localPath
            }
          });
        } else {
          processedOps.push(op);
        }
      }
      
      // 처리된 ops로 업데이트
      post.description.ops = processedOps;
    }
    
    processedPosts.push(post);
  }
  
  return { posts: processedPosts };
}

// posts.json 파일 처리
if (process.argv.length > 2) {
  const postsJsonPath = process.argv[2];
  
  if (fs.existsSync(postsJsonPath)) {
    const postsData = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
    const processedData = processBase64Images(postsData);
    
    // 처리된 데이터를 다시 저장
    fs.writeFileSync(postsJsonPath, JSON.stringify(processedData, null, 2));
    console.log('Base64 이미지 처리가 완료되었습니다.');
  } else {
    console.error('posts.json 파일을 찾을 수 없습니다.');
  }
} else {
  console.log('사용법: node process-images.js <posts.json 경로>');
}
