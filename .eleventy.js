module.exports = function(eleventyConfig) {
  // 입력 디렉토리
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("neocities.png");
  
  // 출력 디렉토리
  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
