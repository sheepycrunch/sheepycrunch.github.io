const { DateTime } = require("luxon");
const GoogleSearchConsoleStats = require('./src/_plugins/google-search-console');
const htmlmin = require('html-minifier-terser');

module.exports = function(eleventyConfig) {
  
  
  // 환경변수에서 URL 정보 가져오기
  const siteName = process.env.USERNAME || 'dakimakura';
  const neocitiesUrl = process.env.NEOCITIES_URL || `https://${siteName}.neocities.org`;
  const nekowebUrl = process.env.NEKOWEB_URL || `https://${siteName}.nekoweb.org`;
  
  // 전역 데이터로 추가
  eleventyConfig.addGlobalData("siteName", siteName);
  eleventyConfig.addGlobalData("neocitiesUrl", neocitiesUrl);
  eleventyConfig.addGlobalData("nekowebUrl", nekowebUrl);
  
  // Neocities API 토큰
  const neocitiesApiToken = process.env.NEOCITIES_API_KEY;
  
  eleventyConfig.addGlobalData("neocitiesApiToken", neocitiesApiToken);
  
  // Posts 데이터를 전역 데이터로 추가
  let postsData = { posts: [] };
  try {
    const fs = require('fs');
    const postsPath = 'src/posts.json';
    if (fs.existsSync(postsPath)) {
      const postsContent = fs.readFileSync(postsPath, 'utf8');
      postsData = JSON.parse(postsContent);
      console.log('Posts data loaded globally:', postsData.posts.length, 'posts');
    }
  } catch (error) {
    console.warn('Failed to load posts data globally:', error.message);
  }
  
  eleventyConfig.addGlobalData("postsData", postsData);

  // write.njk을 프로덕션 빌드에서 제외 (로컬에서만 빌드)
  // ELEVENTY_ENV가 production이면 write.njk 제외
  if (process.env.ELEVENTY_ENV === 'production') {
    eleventyConfig.ignores.add("src/write.njk");
    console.log('Production build: write.njk excluded');
  } else {
    console.log('Local build: write.njk included');
  }
  
  // 구글 서치콘솔 통계 초기화
  let searchConsoleStats = {
    totalClicks: 0,
    totalImpressions: 0,
    averageCtr: 0,
    lastUpdated: new Date().toISOString()
  };

  // 구글 서치콘솔 통계 가져오기 (비동기)
  const initSearchConsoleStats = async () => {
    try {
      const gsc = new GoogleSearchConsoleStats();
      const siteUrls = [
        process.env.NEOCITIES_URL || 'https://dakimakura.neocities.org'
      ];
      
      const stats = await gsc.getRecentStats(siteUrls);
      if (stats && stats.totals) {
        searchConsoleStats = {
          totalClicks: stats.totals.totalClicks,
          totalImpressions: stats.totals.totalImpressions,
          averageCtr: stats.totals.averageCtr,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (error) {
      console.warn('구글 서치콘솔 통계 로드 실패:', error.message);
    }
  };

  // 통계 초기화 실행
  initSearchConsoleStats();

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
      visitors: 0,
      searchConsole: searchConsoleStats
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

  // 포스트 수 계산 함수
  const calculatePostCount = (collections) => {
    let count = 0;
    
    // posts.json의 포스트 수
    if (collections.posts) {
      count += collections.posts.length;
    }
    
    // 기본 페이지들 (txt, gallery, archive, links, search, write, login)
    const basicPages = ['txt', 'gallery', 'archive', 'links', 'search', 'write', 'login'];
    count += basicPages.length;
    
    return count;
  };

  // 사이트 데이터 추가
  eleventyConfig.addGlobalData("site", siteConfig);
  
  // 포스트 수 계산을 위한 컬렉션 필터
  eleventyConfig.addFilter("postCount", function(collections) {
    return calculatePostCount(collections);
  });
  
  // 영어로 통일된 사이트 데이터
  const siteData = {
    site: {
      title: siteConfig.title,
      author: siteConfig.author.name,
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
      name: siteConfig.author.name,
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
    write: {
      title: "Write Post",
      description: "Write a new post."
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
  };

  eleventyConfig.addGlobalData("i18n", siteData);
  
  
  // 이미지 경로를 환경에 따라 변환하는 필터
  eleventyConfig.addFilter("dualImage", function(imagePath) {
    if (!imagePath) return "";
    
    // 이미 절대 URL인 경우 그대로 반환
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // 환경 변수로 배포 환경 확인
    const isNeocitiesDeploy = process.env.NEOCITIES_DEPLOY === 'true';
    
    if (isNeocitiesDeploy) {
      // 네오시티 배포: 상대 경로 사용
      return `<img src="${imagePath}" alt="" />`;
    } else {
      // 로컬 개발: 절대 URL 사용 (네오시티와 네코웹 둘 다 시도)
      const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      const neocitiesUrl = process.env.NEOCITIES_URL || 'https://dakimakura.neocities.org';
      const nekowebUrl = process.env.NEKOWEB_URL || 'https://dakimakura.nekoweb.org';
      
      return `<img src="${neocitiesUrl}/${cleanPath}" 
                   onerror="this.onerror=null; this.src='${nekowebUrl}/${cleanPath}'" 
                   alt="" />`;
    }
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
  
  // JSON stringify 필터 추가
  eleventyConfig.addFilter("stringify", function(obj) {
    return JSON.stringify(obj);
  });
  
  // JavaScript 파일에 환경변수 주입 (보안상 모든 토큰 제외)
  eleventyConfig.addTransform("inject-admin-key", function(content, outputPath) {
    if (outputPath && outputPath.endsWith('.html')) {
      // HTML 파일에서 JavaScript에 환경변수 주입 (보안상 모든 토큰은 제외)
      const scriptTag = `<script>
        window.searchConsoleStats = ${JSON.stringify(searchConsoleStats)};
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

  // 정적 파일 복사 설정
  eleventyConfig.addPassthroughCopy("deploy-history.json");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("src/posts.json");
  eleventyConfig.addPassthroughCopy("neocities.png");


  // HTML 압축 설정 (프로덕션 빌드 시에만)
  if (process.env.ELEVENTY_ENV === 'production') {
    eleventyConfig.addTransform('htmlmin', async function(content, outputPath) {
      if (outputPath && outputPath.endsWith('.html')) {
        try {
          const minified = await htmlmin.minify(content, {
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true,
            collapseWhitespace: true,
            conservativeCollapse: true,
            preserveLineBreaks: false,
            removeEmptyAttributes: true,
            removeOptionalTags: true,
            removeEmptyElements: false,
            lint: false,
            keepClosingSlash: false,
            caseSensitive: false,
            minifyURLs: true
          });
          return minified;
        } catch (err) {
          console.error('HTML minification failed:', err);
          return content;
        }
      }
      return content;
    });
  }

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
      port: 8080,
      // API 라우트 추가
      middleware: [
        function(req, res, next) {
          if (req.url === '/api/execute-workflow') {
            const executeWorkflow = require('./src/api/execute-workflow');
            return executeWorkflow(req, res);
          }
          next();
        },
        function(req, res, next) {
          if (req.url.startsWith('/api/save-content') || 
              req.url.startsWith('/api/load-content') || 
              req.url.startsWith('/api/content-history')) {
            const saveContent = require('./src/api/save-content');
            return saveContent(eleventyConfig)(req, res, next);
          }
          next();
        }
      ]
    }
  };
};