module.exports = function(eleventyConfig) {
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
};
