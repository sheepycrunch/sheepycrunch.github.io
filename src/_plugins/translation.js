// 간단한 번역 매핑 (실제 프로덕션에서는 Google Translate API 등을 사용)
const translationMap = {
  // 한국어 -> 일본어
  "kr_to_jp": {
    "자기소개": "自己紹介",
    "이 사이트에 대해": "このサイトについて",
    "각 SNS 링크": "各SNSリンク",
    "콘텐츠": "コンテンツ",
    "사이트 정보": "サイト情報",
    "최신 업데이트": "最新アップデート",
    "주요 기능": "主な機能",
    "방문해주셔서 감사합니다": "ご訪問ありがとうございます",
    "이름": "名前",
    "주요 취미": "主な趣味",
    "포스트": "ポスト",
    "방문자": "訪問者",
    "마지막 업데이트": "最終更新",
    "새로운 갤러리 업데이트!": "新しいギャラリーアップデート！",
    "블로그 디자인 개선": "ブログデザイン改善",
    "첫 번째 포스트 작성": "最初のポスト作成",
    "최신 그림들을 확인해보세요!": "最新の絵をチェックしてみてください！",
    "생각과 이야기를 읽어보세요": "考えや話を読んでみてください",
    "DIY와 창작 프로젝트들": "DIYと創作プロジェクト",
    "메시지 보내기": "メッセージを送る",
    "갤러리 보기": "ギャラリーを見る",
    "언어 변경": "言語変更"
  },
  
  // 한국어 -> 영어
  "kr_to_en": {
    "자기소개": "About Me",
    "이 사이트에 대해": "About This Site",
    "각 SNS 링크": "SNS Links",
    "콘텐츠": "Content",
    "사이트 정보": "Site Information",
    "최신 업데이트": "Latest Updates",
    "주요 기능": "Main Features",
    "방문해주셔서 감사합니다": "Thank You for Visiting",
    "이름": "Name",
    "포스트": "Posts",
    "방문자": "Visitors",
    "마지막 업데이트": "Last Update",
    "새로운 갤러리 업데이트!": "New gallery update!",
    "블로그 디자인 개선": "Blog design improvements",
    "첫 번째 포스트 작성": "First post written",
    "최신 그림들을 확인해보세요!": "Check out the latest drawings!",
    "생각과 이야기를 읽어보세요": "Read thoughts and stories",
    "DIY와 창작 프로젝트들": "DIY and creative projects",
    "메시지 보내기": "Send Message",
    "갤러리 보기": "View Gallery",
    "언어 변경": "Change Language"
  }
};

// 번역 함수
function translateText(text, fromLang, toLang) {
  if (fromLang === toLang) return text;
  
  const mapKey = `${fromLang}_to_${toLang}`;
  const map = translationMap[mapKey];
  
  if (!map) return text;
  
  // 정확한 매칭 우선
  if (map[text]) {
    return map[text];
  }
  
  // 부분 매칭 시도
  for (const [key, value] of Object.entries(map)) {
    if (text.includes(key)) {
      return text.replace(key, value);
    }
  }
  
  return text;
}

// 객체 깊은 복사 및 번역
function translateObject(obj, fromLang, toLang) {
  if (typeof obj !== 'object' || obj === null) {
    return translateText(obj, fromLang, toLang);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => translateObject(item, fromLang, toLang));
  }
  
  const translated = {};
  for (const [key, value] of Object.entries(obj)) {
    translated[key] = translateObject(value, fromLang, toLang);
  }
  
  return translated;
}

module.exports = {
  translateText,
  translateObject
};
