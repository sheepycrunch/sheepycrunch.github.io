const fs = require('fs');
const path = require('path');

module.exports = () => {
  // src/contents를 메인 저장소로 사용
  const dataDir = path.join(__dirname, '..', '..', 'src', 'contents');
  console.log('contentRegions: Reading from', dataDir);
  if (!fs.existsSync(dataDir)) {
    console.log('contentRegions: Directory does not exist', dataDir);
    return {};
  }

  const pages = {};
  const files = fs.readdirSync(dataDir);
  console.log('contentRegions: Found files', files);
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const filePath = path.join(dataDir, file);
    let json;
    try {
      json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.warn('contentRegions: parse error', filePath, err);
      continue;
    }

    const latestKey = Object.keys(json).sort().reverse()[0];
    if (!latestKey) continue;

    const latest = json[latestKey];
    // url이 "/"면 루트, 아니면 Eleventy가 사용하는 URL과 맞춰줍니다.
    const pageUrl = latest.url === '/' ? '/' : `${latest.url}`; 
    pages[pageUrl] = latest.regions || {};
    console.log('contentRegions: Loaded regions for', pageUrl, Object.keys(latest.regions || {}));
  }
  
  console.log('contentRegions: Final pages', Object.keys(pages));
  return pages;
};
