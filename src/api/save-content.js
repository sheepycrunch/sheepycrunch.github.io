// ContentTools 편집된 콘텐츠 저장 API
const fs = require('fs');
const path = require('path');

module.exports = function(eleventyConfig) {
  // API 엔드포인트 추가
  eleventyConfig.addServerMiddleware('/api/save-content', (req, res, next) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const pageData = JSON.parse(body);
        
        // 콘텐츠 저장 디렉토리 생성
        const contentDir = path.join(__dirname, '../content-data');
        if (!fs.existsSync(contentDir)) {
          fs.mkdirSync(contentDir, { recursive: true });
        }

        // 페이지별 콘텐츠 파일 저장
        const fileName = pageData.url.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
        const filePath = path.join(contentDir, fileName);
        
        // 기존 데이터 로드
        let existingData = {};
        if (fs.existsSync(filePath)) {
          try {
            existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          } catch (error) {
            console.error('기존 데이터 로드 오류:', error);
          }
        }

        // 새 데이터 병합
        existingData[pageData.timestamp] = pageData;
        
        // 파일 저장
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
        
        console.log(`콘텐츠 저장됨: ${filePath}`);
        
        res.json({
          success: true,
          message: '콘텐츠가 저장되었습니다.',
          timestamp: pageData.timestamp
        });

      } catch (error) {
        console.error('콘텐츠 저장 오류:', error);
        res.status(500).json({
          success: false,
          error: '콘텐츠 저장 중 오류가 발생했습니다.',
          details: error.message
        });
      }
    });
  });

  // 콘텐츠 로드 API
  eleventyConfig.addServerMiddleware('/api/load-content', (req, res, next) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { page } = req.query;
    if (!page) {
      return res.status(400).json({ error: '페이지 파라미터가 필요합니다.' });
    }

    try {
      const contentDir = path.join(__dirname, '../content-data');
      const fileName = page.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
      const filePath = path.join(contentDir, fileName);

      if (!fs.existsSync(filePath)) {
        return res.json({
          success: true,
          content: null,
          message: '저장된 콘텐츠가 없습니다.'
        });
      }

      const contentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // 가장 최근 데이터 반환
      const timestamps = Object.keys(contentData).sort().reverse();
      const latestContent = timestamps.length > 0 ? contentData[timestamps[0]] : null;

      res.json({
        success: true,
        content: latestContent,
        message: '콘텐츠를 로드했습니다.'
      });

    } catch (error) {
      console.error('콘텐츠 로드 오류:', error);
      res.status(500).json({
        success: false,
        error: '콘텐츠 로드 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  });

  // 콘텐츠 히스토리 API
  eleventyConfig.addServerMiddleware('/api/content-history', (req, res, next) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { page } = req.query;
    if (!page) {
      return res.status(400).json({ error: '페이지 파라미터가 필요합니다.' });
    }

    try {
      const contentDir = path.join(__dirname, '../content-data');
      const fileName = page.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
      const filePath = path.join(contentDir, fileName);

      if (!fs.existsSync(filePath)) {
        return res.json({
          success: true,
          history: [],
          message: '저장된 히스토리가 없습니다.'
        });
      }

      const contentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const history = Object.keys(contentData)
        .sort()
        .reverse()
        .map(timestamp => ({
          timestamp,
          date: new Date(timestamp).toLocaleString('ko-KR'),
          content: contentData[timestamp]
        }));

      res.json({
        success: true,
        history,
        message: '히스토리를 로드했습니다.'
      });

    } catch (error) {
      console.error('히스토리 로드 오류:', error);
      res.status(500).json({
        success: false,
        error: '히스토리 로드 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  });
};
