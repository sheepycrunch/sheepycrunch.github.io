const { translateObject } = require("./src/_plugins/translation.js");
const Image = require("@11ty/eleventy-img");
const imagePathPlugin = require("./src/_plugins/image-path.js");

module.exports = function(eleventyConfig) {

  // 이미지 경로 플러그인 등록
  imagePathPlugin(eleventyConfig);

  // 이미지 최적화 shortcode
  eleventyConfig.addNunjucksAsyncShortcode("image", async function(src, alt, widths, formats) {
    let metadata = await Image(src, {
      widths: widths || [null],
      formats: formats || ["webp", "jpeg"],
      urlPath: "/images/",
      outputDir: "./_site/images/",
    });

    let imageAttributes = {
      alt,
      sizes: "(max-width: 600px) 100vw, 600px",
      loading: "lazy",
      decoding: "async",
    };

    return Image.generateHTML(metadata, imageAttributes);
  });

  // 다국어 컬렉션 생성
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md");
  });

  // 언어별 컬렉션 생성
  eleventyConfig.addCollection("posts_kr", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md").filter(item => 
      item.data.lang === "kr" || !item.data.lang
    );
  });

  eleventyConfig.addCollection("posts_jp", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md").filter(item => 
      item.data.lang === "jp"
    );
  });

  eleventyConfig.addCollection("posts_en", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md").filter(item => 
      item.data.lang === "en"
    );
  });

  // 다국어 필터 추가
  eleventyConfig.addFilter("t", function(key, lang = "kr") {
    if (!key) return key; // key가 undefined이면 그대로 반환
    
    const i18n = require("./src/_data/i18n.json");
    const keys = key.split('.');
    let value = i18n[lang];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // 번역이 없으면 키 반환
      }
    }
    
    return value || key;
  });

  // 언어별 URL 생성 필터
  eleventyConfig.addFilter("localizedUrl", function(url, lang) {
    if (lang === "kr") {
      return url;
    }
    return `/${lang}${url}`;
  });

  // 언어 전환 링크 생성 필터
  eleventyConfig.addFilter("languageLinks", function(currentLang) {
    const languages = ["kr", "jp", "en"];
    const langNames = {
      "kr": "한국어",
      "jp": "日本語", 
      "en": "English"
    };
    
    return languages.map(lang => ({
      code: lang,
      name: langNames[lang],
      current: lang === currentLang,
      url: lang === "kr" ? "/" : `/${lang}/`
    }));
  });

  // 자동 번역 필터
  eleventyConfig.addFilter("autoTranslate", function(obj, targetLang) {
    if (targetLang === "kr") return obj;
    return translateObject(obj, "kr", targetLang);
  });

  // 언어별 데이터 생성
  eleventyConfig.addGlobalData("i18n_kr", function() {
    const i18n = require("./src/_data/i18n.json");
    return i18n.kr;
  });

  eleventyConfig.addGlobalData("i18n_jp", function() {
    const i18n = require("./src/_data/i18n.json");
    return i18n.jp;
  });

  eleventyConfig.addGlobalData("i18n_en", function() {
    const i18n = require("./src/_data/i18n.json");
    return i18n.en;
  });

  // 실제 포스트 수 계산
  eleventyConfig.addGlobalData("realPostCount", function() {
    // posts 컬렉션에서 실제 포스트 수 반환
    return 0; // 현재 포스트가 없으므로 0으로 설정
  });

  // 정적 파일 복사
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("src/index.css");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("neocities.png");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};