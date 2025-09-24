module.exports = function(eleventyConfig) {
  // CSS 파일들 복사
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("src/index.css");
  eleventyConfig.addPassthroughCopy("src/css/");
  
  // JavaScript 파일들 복사
  eleventyConfig.addPassthroughCopy("src/js/");
  
  // 기타 파일들 복사
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("neocities.png");
  
  // 이미지 파일들 복사
  eleventyConfig.addPassthroughCopy("src/images/");
  
  // 출력 디렉토리
  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
