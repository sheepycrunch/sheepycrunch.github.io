const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // 환경변수에서 관리자 키 가져오기
  const adminSecretKey = process.env.ADMIN_SECRET_KEY;
  
  // 전역 데이터로 추가
  eleventyConfig.addGlobalData("adminSecretKey", adminSecretKey);
  
  // 사이트 설정 데이터
  const siteConfig = {
    title: "dakimakura",
    author: {
      name: "sheepycrunch",
    },
    description: "개인 블로그",
    social: {
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
    ],
    authorInfo: {
      introduction: "이 블로그는 기존 상업 블로그의 대안으로 설립되었습니다."
    },
    aboutSite: {
      text: "하루 한 번 정기적인 글 작성을 목표로 하고 있습니다."
    }
  };

  // 사이트 데이터 추가
  eleventyConfig.addGlobalData("site", siteConfig);
  
  // i18n 데이터 동적 생성
  const generateI18nData = (config) => ({
    kr: {
      site: {
        title: config.title,
        author: config.author.name,
        description: config.description
      },
      sections: {
        selfIntroduction: "자기소개",
        aboutSite: "이 사이트에 대해",
        snsLinks: "링크",
        content: "카테고리",
        siteInfo: "사이트 정보",
        latestUpdates: "최신 업데이트",
        write: "글 작성",
        search: "검색"
      },
      author: {
        name: config.author.name,
        introduction: config.authorInfo.introduction
      },
      hobbies: config.hobbies,
      aboutSite: config.aboutSite,
      search: {
        title: "검색",
        description: "태그나 키워드로 포스트를 검색하세요.",
        placeholder: "태그나 키워드로 검색...",
        clearButton: "초기화",
        noResults: "검색 결과가 없습니다."
      },
      txt: {
        title: "글",
        description: "텍스트 포스트들을 확인하세요."
      },
      archive: {
        title: "아카이브",
        description: "아카이브된 포스트들을 확인하세요."
      },
      gallery: {
        title: "갤러리",
        description: "갤러리 이미지들을 확인하세요."
      },
      login: {
        title: "관리자 로그인",
        description: "관리자 로그인 페이지"
      },
      write: {
        title: "글 작성",
        description: "새로운 글을 작성하세요."
      },
      links: {
        title: "링크",
        description: "유용한 링크들을 모아놓았습니다."
      },
      stats: {
        posts: "포스트",
        visitors: "방문자",
        lastUpdate: "마지막 업데이트"
      }
    },
    jp: {
      site: {
        title: config.title,
        author: config.author.name,
        description: "個人ブログ"
      },
      sections: {
        selfIntroduction: "自己紹介",
        aboutSite: "このサイトについて",
        snsLinks: "リンク",
        content: "カテゴリー",
        siteInfo: "サイト情報",
        latestUpdates: "最新アップデート",
        write: "記事作成",
        search: "検索"
      },
      author: {
        name: config.author.name,
        introduction: "このブログは既存の商業ブログの代替として設立されました。"
      },
      hobbies: ["絵を描く", "ゲーム", "DIYプロジェクト"],
      aboutSite: {
        text: "一日一回定期的な記事作成を目標にしています。"
      },
      search: {
        title: "検索",
        description: "タグやキーワードでポストを検索してください。",
        placeholder: "タグやキーワードで検索...",
        clearButton: "リセット",
        noResults: "検索結果がありません。"
      },
      txt: {
        title: "記事",
        description: "テキストポストを確認してください。"
      },
      archive: {
        title: "アーカイブ",
        description: "アーカイブされたポストを確認してください。"
      },
      gallery: {
        title: "ギャラリー",
        description: "ギャラリー画像を確認してください。"
      },
      login: {
        title: "管理者ログイン",
        description: "管理者ログインページ"
      },
      write: {
        title: "記事作成",
        description: "新しい記事を作成してください。"
      },
      links: {
        title: "リンク",
        description: "有用なリンクをまとめました。"
      },
      stats: {
        posts: "ポスト",
        visitors: "訪問者",
        lastUpdate: "最終更新"
      }
    },
    en: {
      site: {
        title: config.title,
        author: config.author.name,
        description: "Personal Blog"
      },
      sections: {
        selfIntroduction: "About Me",
        aboutSite: "About This Site",
        snsLinks: "Links",
        content: "Categories",
        siteInfo: "Site Information",
        latestUpdates: "Latest Updates",
        write: "Write Post",
        search: "Search"
      },
      author: {
        name: config.author.name,
        introduction: "This blog was established as an alternative to existing commercial blogs."
      },
      hobbies: ["Drawing", "Gaming", "DIY Projects"],
      aboutSite: {
        text: "Aiming for regular daily writing."
      },
      search: {
        title: "Search",
        description: "Search posts by tags or keywords.",
        placeholder: "Search by tags or keywords...",
        clearButton: "Clear",
        noResults: "No search results found."
      },
      txt: {
        title: "Posts",
        description: "Check out text posts."
      },
      archive: {
        title: "Archive",
        description: "Check out archived posts."
      },
      gallery: {
        title: "Gallery",
        description: "Check out gallery images."
      },
      login: {
        title: "Admin Login",
        description: "Admin login page"
      },
      write: {
        title: "Write Post",
        description: "Write a new post."
      },
      links: {
        title: "Links",
        description: "Useful links are collected here."
      },
      stats: {
        posts: "Posts",
        visitors: "Visitors",
        lastUpdate: "Last Update"
      }
    }
  });

  const i18nData = generateI18nData(siteConfig);
  eleventyConfig.addGlobalData("i18n", i18nData.en); // 기본값을 영어로 설정
  eleventyConfig.addGlobalData("i18n", i18nData.kr);
  eleventyConfig.addGlobalData("i18n_jp", i18nData.jp);
  eleventyConfig.addGlobalData("i18n_en", i18nData.en);
  
  // 포괄적인 번역 매핑
  const translationMap = {
    'jp': {
      // 기본 섹션
      "자기소개": "自己紹介",
      "이 사이트에 대해": "このサイトについて",
      "링크": "リンク",
      "카테고리": "カテゴリー",
      "사이트 정보": "サイト情報",
      "최신 업데이트": "最新アップデート",
      "글 작성": "記事作成",
      "검색": "検索",
      
      // 페이지 제목
      "글": "記事",
      "갤러리": "ギャラリー",
      "아카이브": "アーカイブ",
      "관리자 로그인": "管理者ログイン",
      "링크": "リンク",
      
      // 설명
      "텍스트 포스트들을 확인하세요.": "テキストポストを確認してください。",
      "갤러리 이미지들을 확인하세요.": "ギャラリー画像を確認してください。",
      "아카이브된 포스트들을 확인하세요.": "アーカイブされたポストを確認してください。",
      "관리자 로그인 페이지": "管理者ログインページ",
      "새로운 글을 작성하세요.": "新しい記事を作成してください。",
      "유용한 링크들을 모아놓았습니다.": "有用なリンクをまとめました。",
      "태그나 키워드로 포스트를 검색하세요.": "タグやキーワードでポストを検索してください。",
      
      // 검색 관련
      "태그나 키워드로 검색...": "タグやキーワードで検索...",
      "초기화": "リセット",
      "검색 결과가 없습니다.": "検索結果がありません。",
      
      // 사이트 정보
      "포스트": "ポスト",
      "방문자": "訪問者",
      "마지막 업데이트": "最終更新"
    },
    'en': {
      // 기본 섹션
      "자기소개": "About Me",
      "이 사이트에 대해": "About This Site",
      "링크": "Links",
      "카테고리": "Categories",
      "사이트 정보": "Site Information",
      "최신 업데이트": "Latest Updates",
      "글 작성": "Write Post",
      "검색": "Search",
      
      // 페이지 제목
      "글": "Posts",
      "갤러리": "Gallery",
      "아카이브": "Archive",
      "관리자 로그인": "Admin Login",
      "링크": "Links",
      
      // 설명
      "텍스트 포스트들을 확인하세요.": "Check out text posts.",
      "갤러리 이미지들을 확인하세요.": "Check out gallery images.",
      "아카이브된 포스트들을 확인하세요.": "Check out archived posts.",
      "관리자 로그인 페이지": "Admin login page",
      "새로운 글을 작성하세요.": "Write a new post.",
      "유용한 링크들을 모아놓았습니다.": "Useful links are collected here.",
      "태그나 키워드로 포스트를 검색하세요.": "Search posts by tags or keywords.",
      
      // 검색 관련
      "태그나 키워드로 검색...": "Search by tags or keywords...",
      "초기화": "Clear",
      "검색 결과가 없습니다.": "No search results found.",
      
      // 사이트 정보
      "포스트": "Posts",
      "방문자": "Visitors",
      "마지막 업데이트": "Last Update"
    }
  };

  // 번역 필터 추가
  eleventyConfig.addFilter("t", function(text, lang) {
    if (!text || !lang) return text;
    if (lang === 'en') return text; // 기본값을 영어로 설정
    
    const translations = translationMap[lang];
    if (!translations) return text;
    
    // 정확한 매칭 우선
    if (translations[text]) {
      return translations[text];
    }
    
    // 부분 매칭 시도
    for (const [key, value] of Object.entries(translations)) {
      if (text.includes(key)) {
        return text.replace(key, value);
      }
    }
    
    return text;
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