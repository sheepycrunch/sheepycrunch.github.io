// 직접 posts.json 업데이트 스크립트
const fs = require('fs');
const path = require('path');

// 브라우저 콘솔에서 실행할 명령어
const browserCommand = `
// 브라우저 콘솔에서 이 명령어를 실행하세요:
const posts = JSON.parse(localStorage.getItem("hamster_posts") || "[]");
const postsData = { posts: posts };
const jsonString = JSON.stringify(postsData, null, 2);

// 클립보드에 복사
navigator.clipboard.writeText(jsonString).then(() => {
  console.log("✅ posts.json 데이터가 클립보드에 복사되었습니다!");
  console.log("이제 src/posts.json 파일에 붙여넣기 하세요.");
}).catch(err => {
  console.error("❌ 클립보드 복사 실패:", err);
  console.log("수동으로 복사하세요:", jsonString);
});
`;

console.log("🌐 브라우저에서 다음 단계를 따라하세요:");
console.log("1. http://localhost:8080/write.html 접속");
console.log("2. 개발자 도구 콘솔 열기 (F12)");
console.log("3. 아래 명령어를 복사하여 콘솔에 붙여넣기:");
console.log("");
console.log(browserCommand);
console.log("");
console.log("4. 복사된 내용을 src/posts.json 파일에 붙여넣기");
console.log("5. 터미널에서 'node auto-upload.js' 실행하여 Neocities에 업로드");
