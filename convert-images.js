const fs = require('fs');
const https = require('https');

// Base64를 Buffer로 변환하는 함수
function base64ToBuffer(base64Data) {
  const arr = base64Data.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return { buffer: Buffer.from(u8arr), mime };
}

// 네오시티에 이미지 업로드
async function uploadImageToNeocities(buffer, fileName, mime) {
  try {
    const neocitiesApiKey = process.env.NEOCITIES_API_KEY;
    if (!neocitiesApiKey) {
      throw new Error('NEOCITIES_API_KEY environment variable not set');
    }

    const formData = new FormData();
    const blob = new Blob([buffer], { type: mime });
    formData.append('file', blob, fileName);

    const response = await fetch('https://neocities.org/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${neocitiesApiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Neocities upload failed: ${errorData.message || response.statusText}`);
    }

    console.log(`Image uploaded to Neocities: ${fileName}`);
    
    // 네오시티 URL 반환
    return `https://dakimakura.neocities.org/images/uploaded/${fileName}`;
  } catch (error) {
    throw new Error(`Failed to upload image to Neocities: ${error.message}`);
  }
}

// 포스트 데이터 처리
async function processPosts() {
  try {
    const postsData = fs.readFileSync('src/_data/posts.json', 'utf8');
    const posts = JSON.parse(postsData).posts || [];
    let updated = false;
    
    console.log('Processing posts:', posts.length);
    
    for (const post of posts) {
      if (post.description && post.description.ops) {
        const newOps = [];
        
        for (const op of post.description.ops) {
          if (op.insert && op.insert.image && op.insert.image.startsWith('data:image/')) {
            try {
              console.log('Processing Base64 image...');
              
              // Base64를 Buffer로 변환
              const { buffer, mime } = base64ToBuffer(op.insert.image);
              
              // 고유한 파일명 생성
              const timestamp = Date.now();
              const randomString = Math.random().toString(36).substring(2, 15);
              const extension = mime.split('/')[1];
              const fileName = `${timestamp}_${randomString}.${extension}`;
              
              // 네오시티에 업로드
                    const imageUrl = await uploadImageToNeocities(buffer, fileName, mime);
              
              // 새로운 op 생성 (네오시티 URL 사용)
              newOps.push({
                insert: {
                  image: imageUrl
                }
              });
              
              console.log(`Image saved: ${imageUrl}`);
              updated = true;
              
            } catch (error) {
              console.error('Image upload failed:', error);
              // 실패한 경우 원본 유지
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
      // 업데이트된 포스트를 파일에 저장
      fs.writeFileSync('src/_data/posts.json', JSON.stringify({ posts }, null, 2));
      console.log('Posts updated with Neocities URLs');
    } else {
      console.log('No base64 images found to convert');
    }
    
  } catch (error) {
    console.error('Error processing posts:', error);
    process.exit(1);
  }
}

processPosts();
