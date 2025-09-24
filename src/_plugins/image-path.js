module.exports = function(eleventyConfig) {
  // 이미지 경로를 Neocities URL로 변환하는 필터
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
};
