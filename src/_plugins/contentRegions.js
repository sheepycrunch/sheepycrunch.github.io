const fs = require('fs');
const path = require('path');

module.exports = () => {
  // _site/contents를 메인 저장소로 사용
  const dataDir = path.join(__dirname, '..', '..', '_site', 'contents');
  if (!fs.existsSync(dataDir)) return {};

  const pages = {};
  for (const file of fs.readdirSync(dataDir)) {
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
  }
  return pages;
};
