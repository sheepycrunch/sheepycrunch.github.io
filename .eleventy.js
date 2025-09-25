const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // 환경변수에서 관리자 키 가져오기
  const adminSecretKey = process.env.ADMIN_SECRET_KEY || 'opensesame';
  
  // 전역 데이터로 추가
  eleventyConfig.addGlobalData("adminSecretKey", adminSecretKey);
  
  // 사이트 데이터 추가
  eleventyConfig.addGlobalData("site", {
    title: "dakimakura",
    author: {
      name: "Hampter the maid"
    },
    social: {
      twitter: "https://twitter.com/sheepycrunch",
      github: "https://github.com/sheepycrunch",
      pixiv: "https://www.pixiv.net/users/sheepycrunch"
    },
    stats: {
      visitors: 0
    },
    navigation: [
      { name: "txt", url: "/txt/" },
      { name: "gallery", url: "/gallery/" },
      { name: "archive", url: "/archive/" },
      { name: "write", url: "/write/" },
      { name: "search", url: "/search/" },
      { name: "links", url: "/links/" }
    ]
  });
  
  // i18n 데이터 추가
  const i18nData = require('./src/_data/i18n.json');
  eleventyConfig.addGlobalData("i18n_kr", i18nData.kr);
  
  // 번역 필터 추가
  eleventyConfig.addFilter("t", function(text, lang) {
    if (!text || !lang) return text;
    if (lang === 'kr') return text;
    
    // 간단한 번역 매핑
    const translations = {
      'jp': {
        "자기소개": "自己紹介",
        "이 사이트에 대해": "このサイトについて",
        "콘텐츠": "コンテンツ",
        "사이트 정보": "サイト情報",
        "최신 업데이트": "最新アップデート",
        "글 작성": "記事作成",
        "검색": "検索"
      },
      'en': {
        "자기소개": "About Me",
        "이 사이트에 대해": "About This Site", 
        "콘텐츠": "Content",
        "사이트 정보": "Site Information",
        "최신 업데이트": "Latest Updates",
        "글 작성": "Write Post",
        "검색": "Search"
      }
    };
    
    return translations[lang] && translations[lang][text] ? translations[lang][text] : text;
  });
  
  // 이미지 경로 필터 추가
  eleventyConfig.addFilter("neocitiesImage", function(imagePath) {
    if (!imagePath) return "";
    
    // 이미 절대 URL인 경우 그대로 반환
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // 상대 경로를 Neocities URL로 변환
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `https://sheepycrunch.neocities.org/${cleanPath}`;
  });
  
  // URL 로컬라이제이션 필터 추가
  eleventyConfig.addFilter("localizedUrl", function(url, lang) {
    if (!url) return "";
    if (lang === 'kr') return url;
    // 간단한 URL 변환 (실제로는 더 복잡한 로직 필요)
    return url;
  });
  
  // JavaScript 파일에 환경변수 주입
  eleventyConfig.addTransform("inject-admin-key", function(content, outputPath) {
    if (outputPath && outputPath.endsWith('.html')) {
      // HTML 파일에서 JavaScript에 환경변수 주입
      const scriptTag = `<script>window.ADMIN_SECRET_KEY = '${adminSecretKey}';</script>`;
      return content.replace('</head>', `${scriptTag}\n</head>`);
    }
    return content;
  });

  // 날짜 포맷팅
  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
  });

  // HTML 날짜 포맷팅
  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  // 날짜 정렬
  eleventyConfig.addFilter("sortByDate", function(collection) {
    return collection.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  });

  // 콘텐츠 길이 제한
  eleventyConfig.addFilter("limit", function(array, limit) {
    return array.slice(0, limit);
  });

  return {
    templateFormats: [
      "md",
      "njk",
      "html",
      "liquid"
    ],

    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",

    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};