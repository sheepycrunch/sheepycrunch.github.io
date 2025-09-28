// ContentTools 편집 API 헬퍼
const fs = require('fs');
const path = require('path');

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

module.exports = function(eleventyConfig) {
  // 저장 API
  eleventyConfig.addServerMiddleware('/api/save-content', (req, res, next) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const pageData = JSON.parse(body || '{}');
        if (!pageData || !pageData.url) {
          return res.status(400).json({ success: false, error: '잘못된 요청입니다.' });
        }

        const contentDir = path.join(__dirname, '../content-data');
        if (!fs.existsSync(contentDir)) {
          fs.mkdirSync(contentDir, { recursive: true });
        }

        const fileName = pageData.url.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
        const filePath = path.join(contentDir, fileName);

        let existingData = {};
        if (fs.existsSync(filePath)) {
          try {
            existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          } catch (error) {
            console.error('기존 데이터를 불러오는 데 실패했습니다:', error);
          }
        }

        existingData[pageData.timestamp] = pageData;

        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

        res.json({
          success: true,
          message: '콘텐츠가 저장되었습니다.',
          timestamp: pageData.timestamp
        });
      } catch (error) {
        console.error('콘텐츠 저장 중 오류:', error);
        res.status(500).json({
          success: false,
          error: '콘텐츠 저장에 실패했습니다.',
          details: error.message
        });
      }
    });
  });

  // 이미지 업로드 API
  eleventyConfig.addServerMiddleware('/api/upload-image', (req, res, next) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    let body = '';
    let aborted = false;

    req.on('data', (chunk) => {
      if (aborted) return;
      body += chunk.toString();
      if (body.length > MAX_UPLOAD_SIZE * 1.5) {
        aborted = true;
        res.status(413).json({ success: false, error: '이미지 데이터가 너무 큽니다.' });
        req.destroy();
      }
    });

    req.on('end', () => {
      if (aborted) return;

      try {
        const payload = JSON.parse(body || '{}');
        const { name = 'image', type, dataUrl } = payload;

        if (!dataUrl) {
          return res.status(400).json({ success: false, error: '이미지 데이터가 제공되지 않았습니다.' });
        }

        const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
          return res.status(400).json({ success: false, error: '잘못된 이미지 데이터 형식입니다.' });
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        if (buffer.length > MAX_UPLOAD_SIZE) {
          return res.status(413).json({ success: false, error: '이미지 크기는 5MB를 초과할 수 없습니다.' });
        }

        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const extensionFromName = path.extname(name || '').replace('.', '').toLowerCase();
        const extensionFromMime = mimeType && mimeType.includes('/') ? mimeType.split('/')[1] : '';
        const rawExtension = extensionFromName || extensionFromMime || 'png';
        const extension = rawExtension.replace(/[^a-z0-9]/gi, '') || 'png';

        const baseName = path.basename(name, path.extname(name || '')) || 'image';
        const safeBaseName = baseName.replace(/[^a-z0-9-_]/gi, '') || 'image';
        const fileName = `${safeBaseName}-${Date.now()}.${extension}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, buffer);

        res.json({
          success: true,
          url: `/uploads/${fileName}`,
          size: buffer.length,
          type: mimeType || type || `image/${extension}`
        });
      } catch (error) {
        console.error('이미지 업로드 오류:', error);
        res.status(500).json({
          success: false,
          error: '이미지 업로드 중 오류가 발생했습니다.',
          details: error.message
        });
      }
    });

    req.on('error', (error) => {
      if (!aborted) {
        console.error('이미지 업로드 스트림 오류:', error);
        res.status(500).json({ success: false, error: '이미지 업로드 스트림 오류가 발생했습니다.' });
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
      return res.status(400).json({ error: 'page 파라미터가 필요합니다.' });
    }

    try {
      const contentDir = path.join(__dirname, '../content-data');
      const fileName = page.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
      const filePath = path.join(contentDir, fileName);

      if (!fs.existsSync(filePath)) {
        return res.json({ success: true, content: null, regions: null, message: '저장된 콘텐츠가 없습니다.' });
      }

      const contentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const timestamps = Object.keys(contentData).sort().reverse();
      const latestContent = timestamps.length > 0 ? contentData[timestamps[0]] : null;

      res.json({
        success: true,
        content: latestContent,
        regions: latestContent ? latestContent.regions : null,
        message: '콘텐츠가 로드되었습니다.'
      });
    } catch (error) {
      console.error('콘텐츠 로드 오류:', error);
      res.status(500).json({
        success: false,
        error: '콘텐츠를 불러오는 중 오류가 발생했습니다.',
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
      return res.status(400).json({ error: 'page 파라미터가 필요합니다.' });
    }

    try {
      const contentDir = path.join(__dirname, '../content-data');
      const fileName = page.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
      const filePath = path.join(contentDir, fileName);

      if (!fs.existsSync(filePath)) {
        return res.json({ success: true, history: [], message: '저장된 히스토리가 없습니다.' });
      }

      const contentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const history = Object.keys(contentData)
        .sort()
        .reverse()
        .map((timestamp) => ({
          timestamp,
          date: new Date(timestamp).toLocaleString('ko-KR'),
          content: contentData[timestamp]
        }));

      res.json({ success: true, history, message: '히스토리가 로드되었습니다.' });
    } catch (error) {
      console.error('히스토리 로드 오류:', error);
      res.status(500).json({
        success: false,
        error: '히스토리를 불러오는 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  });
};
