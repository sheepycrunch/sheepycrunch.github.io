const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // 환경변수에서 관리자 키 가져오기
  const adminSecretKey = process.env.ADMIN_SECRET_KEY;
  
  // 전역 데이터로 추가
  eleventyConfig.addGlobalData("adminSecretKey", adminSecretKey);
  
  // GitHub 토큰 가져오기
  const githubToken = process.env.AUTHOR_TOKEN;
  eleventyConfig.addGlobalData("githubToken", githubToken);
  
  // 환경변수에서 URL 정보 가져오기
  const neocitiesUrl = process.env.NEOCITIES_URL || 'https://dakimakura.neocities.org';
  const nekowebUrl = process.env.NEKOWEB_URL || 'https://dakimakura.nekoweb.org';
  
  // 전역 데이터로 추가
  eleventyConfig.addGlobalData("neocitiesUrl", neocitiesUrl);
  eleventyConfig.addGlobalData("nekowebUrl", nekowebUrl);
  
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
      { name: "txt", url: "/txt.html" },
      { name: "gallery", url: "/gallery.html" },
      { name: "links", url: "/archive.html" },
      { name: "search", url: "/search.html" },
      { name: "write", url: "/write.html" },
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
    en: {
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
      links: {
        title: "링크",
        description: "유용한 링크들을 모아놓았습니다."
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
      banners: {
        title: "배너",
        description: "사이트 배너 및 홍보 자료입니다. 자유롭게 Links를 걸어주세요."
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
      links: {
        title: "リンク",
        description: "有用なリンクをまとめました。"
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
      banners: {
        title: "バナー",
        description: "サイトバナーとプロモーション素材です。 このサイトはリンクフリーです。"
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
      links: {
        title: "Links",
        description: "Useful links are collected here. Feel free to link to this site."
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
      banners: {
        title: "Banners",
        description: "Site banners and promotional materials."
      },
      stats: {
        posts: "Posts",
        visitors: "Visitors",
        lastUpdate: "Last Update"
      }
    }
  });

  const i18nData = generateI18nData(siteConfig);
  eleventyConfig.addGlobalData("i18n", i18nData.en); // 기본값을 한국어로 설정
  eleventyConfig.addGlobalData("i18n_kr", i18nData.kr);
  eleventyConfig.addGlobalData("i18n_jp", i18nData.jp);
  eleventyConfig.addGlobalData("i18n_en", i18nData.en);
  
  // 포괄적인 번역 매핑 (한글 → 다른 언어)
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
      "배너": "バナー",
      
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
      "사이트 배너 및 홍보 자료입니다.": "サイトバナーとプロモーション素材です。",
      
      // 검색 관련
      "태그나 키워드로 검색...": "タグやキーワードで検索...",
      "초기화": "リセット",
      "검색 결과가 없습니다.": "検索結果がありません。",
      
      // 사이트 정보
      "포스트": "ポスト",
      "방문자": "訪問者",
      "마지막 업데이트": "最終更新",
      "로딩 중...": "読み込み中...",
      
      // 기타
      "이 블로그는 기존 상업 블로그의 대안으로 설립되었습니다.": "このブログは既存の商業ブログの代替として設立されました。",
      "하루 한 번 정기적인 글 작성을 목표로 하고 있습니다.": "一日一回定期的な記事作成を目標にしています。",
      "자유롭게 Links를 걸어주세요.": "このサイトへのリンクは自由です。",
      
      // Write 페이지 관련
      "글 작성": "記事作成",
      "새로운 포스트를 작성하고 미리보기를 확인하세요.": "新しいポストを作成してプレビューを確認してください。",
      "포스트 작성": "ポスト作成",
      "카테고리": "カテゴリ",
      "이미지": "画像",
      "내용": "内容",
      "태그 (영어만)": "タグ (英語のみ)",
      "미리보기": "プレビュー",
      "저장": "保存",
      "임시저장": "下書き保存",
      "임시저장 불러오기": "下書き読み込み",
      "지우기": "クリア",
      "이미지 제거": "画像削除",
      "파일 업로드": "ファイルアップロード",
      "URL 입력": "URL入力",
      "일반": "一般",
      "갤러리": "ギャラリー",
      "아카이브": "アーカイブ",
      "이미지를 여기에 드래그하거나 클릭하여 선택": "画像をここにドラッグするかクリックして選択",
      "내용을 입력하세요...": "内容を入力してください...",
      "예: daily, thoughts, review": "例: daily, thoughts, review",
      "미리보기를 보려면 \"미리보기\" 버튼을 클릭하세요.": "プレビューを見るには「プレビュー」ボタンをクリックしてください。",
      "내용을 입력해주세요.": "内容を入力してください。",
      "포스트가 저장되었습니다. (개발 모드에서는 콘솔에 출력됨)": "ポストが保存されました。（開発モードではコンソールに出力されます）",
      "임시저장되었습니다.": "下書きが保存されました。",
      "임시저장된 내용을 불러왔습니다.": "下書きの内容を読み込みました。",
      "임시저장된 내용이 없습니다.": "下書きの内容がありません。",
      "임시저장된 내용이 있습니다. 불러오시겠습니까?": "下書きの内容があります。読み込みますか？",
      "유효한 이미지 URL을 입력해주세요.": "有効な画像URLを入力してください。",
      "이미지 URL을 입력해주세요.": "画像URLを入力してください。",
      "이미지 파일만 업로드할 수 있습니다.": "画像ファイルのみアップロードできます。",
      "이미지 로드": "画像読み込み",
      "이미지": "画像",
      "검색 결과가 없습니다.": "検索結果がありません。",
      "검색 결과:": "検索結果:",
      "자동 저장 완료": "自動保存完了",
      "드래그하여 크롭 위치 조정": "ドラッグしてクロップ位置を調整",
      "사용 가능한 태그가 없습니다.": "利用可能なタグがありません。"
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
      "배너": "Banners",
      
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
      "사이트 배너 및 홍보 자료입니다.": "Site banners and promotional materials.",
      
      // 검색 관련
      "태그나 키워드로 검색...": "Search by tags or keywords...",
      "초기화": "Clear",
      "검색 결과가 없습니다.": "No search results found.",
      
      // 사이트 정보
      "포스트": "Posts",
      "방문자": "Visitors",
      "마지막 업데이트": "Last Update",
      "로딩 중...": "Loading...",
      
      // 기타
      "이 블로그는 기존 상업 블로그의 대안으로 설립되었습니다.": "This blog was established as an alternative to existing commercial blogs.",
      "하루 한 번 정기적인 글 작성을 목표로 하고 있습니다.": "Aiming for regular daily writing.",
      "자유롭게 Links를 걸어주세요.": "Feel free to link to this site.",
      
      // Write 페이지 관련
      "글 작성": "Write Post",
      "새로운 포스트를 작성하고 미리보기를 확인하세요.": "Create a new post and preview it.",
      "포스트 작성": "Post Creation",
      "카테고리": "Category",
      "이미지": "Image",
      "내용": "Content",
      "태그 (영어만)": "Tags (English only)",
      "미리보기": "Preview",
      "저장": "Save",
      "임시저장": "Save Draft",
      "임시저장 불러오기": "Load Draft",
      "지우기": "Clear",
      "이미지 제거": "Remove Image",
      "파일 업로드": "File Upload",
      "URL 입력": "URL Input",
      "일반": "General",
      "갤러리": "Gallery",
      "아카이브": "Archive",
      "이미지를 여기에 드래그하거나 클릭하여 선택": "Drag image here or click to select",
      "내용을 입력하세요...": "Enter content...",
      "예: daily, thoughts, review": "e.g: daily, thoughts, review",
      "미리보기를 보려면 \"미리보기\" 버튼을 클릭하세요.": "Click the \"Preview\" button to see the preview.",
      "내용을 입력해주세요.": "Please enter content.",
      "포스트가 저장되었습니다. (개발 모드에서는 콘솔에 출력됨)": "Post saved successfully. (Output to console in development mode)",
      "임시저장되었습니다.": "Draft saved.",
      "임시저장된 내용을 불러왔습니다.": "Draft content loaded.",
      "임시저장된 내용이 없습니다.": "No draft content available.",
      "임시저장된 내용이 있습니다. 불러오시겠습니까?": "Draft content is available. Would you like to load it?",
      "유효한 이미지 URL을 입력해주세요.": "Please enter a valid image URL.",
      "이미지 URL을 입력해주세요.": "Please enter an image URL.",
      "이미지 파일만 업로드할 수 있습니다.": "Only image files can be uploaded.",
      "이미지 로드": "Load Image",
      "이미지": "Image",
      "검색 결과가 없습니다.": "No search results found.",
      "검색 결과:": "Search results:",
      "자동 저장 완료": "Auto save complete",
      "드래그하여 크롭 위치 조정": "Drag to adjust crop position",
      "사용 가능한 태그가 없습니다.": "No tags available."
    }
  };

  // 한글 자동 감지 및 번역 필터
  eleventyConfig.addFilter("t", function(text, lang) {
    if (!text || !lang) return text;
    if (lang === 'en') return text; // 기본값을 한국어로 설정
    
    const translations = translationMap[lang];
    if (!translations) return text;
    
    // 한글 텍스트 자동 감지
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
    if (!isKorean) return text; // 한글이 아니면 그대로 반환
    
    // 정확한 매칭 우선
    if (translations[text]) {
      return translations[text];
    }
    
    // 부분 매칭 시도 (긴 텍스트부터 매칭)
    const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
    let result = text;
    
    for (const key of sortedKeys) {
      if (result.includes(key)) {
        result = result.replace(new RegExp(key, 'g'), translations[key]);
      }
    }
    
    return result;
  });
  
  // 자동 번역 필터 (한글 감지 시 자동으로 번역)
  eleventyConfig.addFilter("autoTranslate", function(text, targetLang) {
    if (!text || !targetLang) return text;
    
    // 한글 텍스트인지 확인
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
    if (!isKorean) return text;
    
    // 자동 번역 실행
    return eleventyConfig.getFilter('t')(text, targetLang);
  });
  
  // 이미지 경로를 네오시티와 네코웹 URL로 변환하는 필터 (둘 다 사용)
  eleventyConfig.addFilter("dualImage", function(imagePath) {
    if (!imagePath) return "";
    
    // 이미 절대 URL인 경우 그대로 반환
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // 상대 경로를 네오시티와 네코웹 URL로 변환
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const neocitiesUrl = process.env.NEOCITIES_URL || 'https://dakimakura.neocities.org';
    const nekowebUrl = process.env.NEKOWEB_URL || 'https://dakimakura.nekoweb.org';
    
    // 네오시티와 네코웹 둘 다 사용하는 HTML 반환
    return `<img src="${neocitiesUrl}/${cleanPath}" 
                 onerror="this.onerror=null; this.src='${nekowebUrl}/${cleanPath}'" 
                 alt="" />`;
  });
  
  // 기존 neocitiesImage 필터도 유지 (하위 호환성)
  eleventyConfig.addFilter("neocitiesImage", function(imagePath) {
    if (!imagePath) return "";
    
    // 이미 절대 URL인 경우 그대로 반환
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // 상대 경로를 Neocities URL로 변환
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const neocitiesUrl = process.env.NEOCITIES_URL || 'https://dakimakura.neocities.org';
    return `${neocitiesUrl}/${cleanPath}`;
  });
  
  // URL 로컬라이제이션 필터 추가
  eleventyConfig.addFilter("localizedUrl", function(url, lang) {
    if (!url) return "";
    if (lang === 'en') return url;
    // 간단한 URL 변환 (실제로는 더 복잡한 로직 필요)
    return url;
  });
  
  // JavaScript 파일에 환경변수 주입
  eleventyConfig.addTransform("inject-admin-key", function(content, outputPath) {
    if (outputPath && outputPath.endsWith('.html')) {
      // HTML 파일에서 JavaScript에 환경변수 주입
      const scriptTag = `<script>
        window.ADMIN_SECRET_KEY = '${adminSecretKey}';
        window.GITHUB_TOKEN = '${githubToken}';
      </script>`;
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

  // CSS, JS, 이미지 파일 복사
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("neocities.png");

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
    },

    // 서버 설정
    serverOptions: {
      port: 8080
    }
  };
};