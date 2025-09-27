// posts.json 업데이트 스크립트
const fs = require('fs');
const path = require('path');

// 로컬 스토리지에서 데이터를 가져와서 posts.json 업데이트
function updatePostsFromLocalStorage() {
  try {
    console.log('posts.json 업데이트 스크립트');
    console.log('브라우저에서 다음 단계를 따라하세요:');
    console.log('');
    console.log('1. http://localhost:8080/write.html 접속');
    console.log('2. 개발자 도구 콘솔 열기 (F12)');
    console.log('3. 다음 명령어 실행:');
    console.log('   localStorage.getItem("hamster_posts")');
    console.log('4. 결과를 복사하여 이 스크립트에 붙여넣기');
    console.log('');
    console.log('또는 직접 데이터를 입력하세요 (JSON 형식):');
    
    // 사용자 입력 대기
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('로컬 스토리지 데이터를 입력하세요: ', (input) => {
      try {
        if (input.trim()) {
          const posts = JSON.parse(input);
          const postsData = { posts: posts };
          
          // src/posts.json 파일 업데이트
          const postsPath = path.join(__dirname, 'src', 'posts.json');
          fs.writeFileSync(postsPath, JSON.stringify(postsData, null, 2), 'utf8');
          
          console.log('✅ posts.json 파일이 업데이트되었습니다!');
          console.log(`📁 파일 위치: ${postsPath}`);
          console.log(`📊 포스트 수: ${posts.length}개`);
          
          // Neocities 업로드 안내
          console.log('');
          console.log('🚀 Neocities에 업로드하려면:');
          console.log('   node auto-upload.js');
        } else {
          console.log('❌ 데이터가 입력되지 않았습니다.');
        }
      } catch (error) {
        console.error('❌ JSON 파싱 오류:', error.message);
        console.log('올바른 JSON 형식으로 입력해주세요.');
      }
      
      rl.close();
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
updatePostsFromLocalStorage();
