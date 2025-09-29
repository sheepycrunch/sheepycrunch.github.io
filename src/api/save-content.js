// 편집 API 헬퍼
const fs = require('fs');
const path = require('path');

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

// _site/images/uploads에서 src/images/uploads로 이미지 동기화 함수
function syncImagesToSrc(pageData) {
  try {
    const siteUploadDir = path.join(__dirname, '../../_site/images/uploads');
    const srcUploadDir = path.join(__dirname, '../images/uploads');
    
    if (!fs.existsSync(siteUploadDir)) return;
    
    // src/images/uploads 디렉토리 생성
    if (!fs.existsSync(srcUploadDir)) {
      fs.mkdirSync(srcUploadDir, { recursive: true });
    }
    
    // 페이지 데이터에서 이미지 URL 추출
    const imageUrls = [];
    if (pageData.content) {
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      let match;
      while ((match = imgRegex.exec(pageData.content)) !== null) {
        if (match[1].startsWith('/images/uploads/')) {
          imageUrls.push(match[1]);
        }
      }
    }
    
    // 각 이미지를 src/images/uploads로 복사
    imageUrls.forEach(imageUrl => {
      const fileName = path.basename(imageUrl);
      const siteImagePath = path.join(siteUploadDir, fileName);
      const srcImagePath = path.join(srcUploadDir, fileName);
      
      if (fs.existsSync(siteImagePath) && !fs.existsSync(srcImagePath)) {
        fs.copyFileSync(siteImagePath, srcImagePath);
        console.log(`Image sync: ${fileName}`);
      }
    });
  } catch (error) {
    console.error('Error during image sync:', error);
  }
}

module.exports = function(eleventyConfig) {
  return function(req, res, next) {
    // 저장 API
    if (req.url === '/api/save-content') {
      if (req.method !== 'POST') {
        return res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const pageData = JSON.parse(body || '{}');
          if (!pageData || !pageData.url) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: '잘못된 요청입니다.' }));
          }

          // _site/contents를 메인 저장소로 사용
          const siteContentDir = path.join(__dirname, '../../_site/contents');
          if (!fs.existsSync(siteContentDir)) {
            fs.mkdirSync(siteContentDir, { recursive: true });
          }

          const fileName = pageData.url.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
          const siteFilePath = path.join(siteContentDir, fileName);

          let existingData = {};
          if (fs.existsSync(siteFilePath)) {
            try {
              existingData = JSON.parse(fs.readFileSync(siteFilePath, 'utf8'));
            } catch (error) {
              console.error('Failed to load existing data:', error);
            }
          }

          existingData[pageData.timestamp] = pageData;

          // _site/contents에 저장
          fs.writeFileSync(siteFilePath, JSON.stringify(existingData, null, 2));

          // src/contents로 동기화
          const srcContentDir = path.join(__dirname, '../contents');
          if (!fs.existsSync(srcContentDir)) fs.mkdirSync(srcContentDir, { recursive: true });
          fs.writeFileSync(path.join(srcContentDir, fileName), JSON.stringify(existingData, null, 2));

          // 명시적 저장 시 이미지를 src/images/uploads로 동기화
          syncImagesToSrc(pageData);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: '콘텐츠가 저장되었습니다.',
            timestamp: pageData.timestamp
          }));
        } catch (error) {
          console.error('Error during content save:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '콘텐츠 저장에 실패했습니다.',
            details: error.message
          }));
        }
      });
    }
    // 이미지 업로드 API
    else if (req.url === '/api/upload-image') {
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
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '이미지 데이터가 너무 큽니다.' }));
          req.destroy();
        }
      });

      req.on('end', () => {
        if (aborted) return;

        try {
          const payload = JSON.parse(body || '{}');
          const { name = 'image', type, dataUrl } = payload;

          if (!dataUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: '이미지 데이터가 제공되지 않았습니다.' }));
          }

          const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
          if (!matches) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: '잘못된 이미지 데이터 형식입니다.' }));
          }

          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          if (buffer.length > MAX_UPLOAD_SIZE) {
            res.writeHead(413, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: '이미지 크기는 5MB를 초과할 수 없습니다.' }));
          }

          // _site/images에 직접 저장 (자동 새로고침 방지)
          const siteUploadDir = path.join(__dirname, '../../_site/images/uploads');
          if (!fs.existsSync(siteUploadDir)) {
            fs.mkdirSync(siteUploadDir, { recursive: true });
          }

          const extensionFromName = path.extname(name || '').replace('.', '').toLowerCase();
          const extensionFromMime = mimeType && mimeType.includes('/') ? mimeType.split('/')[1] : '';
          const rawExtension = extensionFromName || extensionFromMime || 'png';
          const extension = rawExtension.replace(/[^a-z0-9]/gi, '') || 'png';

          const baseName = path.basename(name, path.extname(name || '')) || 'image';
          const safeBaseName = baseName.replace(/[^a-z0-9-_]/gi, '') || 'image';
          const fileName = `${safeBaseName}-${Date.now()}.${extension}`;
          const filePath = path.join(siteUploadDir, fileName);

          fs.writeFileSync(filePath, buffer);

          // src/images/uploads로도 복사 (개발 서버 리로드 없이 갤러리 목록 즉시 반영)
          const srcUploadDir = path.join(__dirname, '../images/uploads');
          if (!fs.existsSync(srcUploadDir)) {
            fs.mkdirSync(srcUploadDir, { recursive: true });
          }
          const srcFilePath = path.join(srcUploadDir, fileName);
          fs.copyFileSync(filePath, srcFilePath);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            url: `/images/uploads/${fileName}`,
            size: buffer.length,
            type: mimeType || type || `image/${extension}`
          }));
        } catch (error) {
          console.error('Image upload error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '이미지 업로드 중 오류가 발생했습니다.',
            details: error.message
          }));
        }
      });

      req.on('error', (error) => {
        if (!aborted) {
          console.error('Image upload stream error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '이미지 업로드 스트림 오류가 발생했습니다.' }));
        }
      });
    }
    // 콘텐츠 로드 API
    else if (req.url === '/api/list-uploads') {
      if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
      }

      try {
        const uploadDir = path.join(__dirname, '../images/uploads');
        if (!fs.existsSync(uploadDir)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, images: [] }));
        }

        const files = fs.readdirSync(uploadDir);
        const images = files
          .filter((name) => !name.startsWith('.'))
          .map((name) => {
            const filePath = path.join(uploadDir, name);
            let stats;
            try {
              stats = fs.statSync(filePath);
            } catch (error) {
              console.error('Cannot read image file info:', error);
              return null;
            }

            if (!stats.isFile()) {
              return null;
            }

            return {
              name,
              url: '/images/uploads/' + name,
              size: stats.size,
              modified: stats.mtime.toISOString()
            };
          })
          .filter(Boolean)
          .sort((a, b) => new Date(b.modified) - new Date(a.modified));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, images }));
      } catch (error) {
        console.error('Failed to load image list:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '이미지 목록을 불러오는 중 오류가 발생했습니다.', details: error.message }));
      }
    }
    else if (req.url.startsWith('/api/load-content')) {
      if (req.method !== 'GET') {
        return res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }

      // URL에서 쿼리 파라미터 파싱
      const url = new URL(req.url, `http://${req.headers.host}`);
      const page = url.searchParams.get('page');
      
      if (!page) {
        return res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'page 파라미터가 필요합니다.' }));
      }

      try {
        // _site/contents를 메인 저장소로 사용
        const siteContentDir = path.join(__dirname, '../../_site/contents');
        const fileName = page.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
        const siteFilePath = path.join(siteContentDir, fileName);

        if (!fs.existsSync(siteFilePath)) {
          return res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, content: null, regions: null, message: '저장된 콘텐츠가 없습니다.' }));
        }

        const contentData = JSON.parse(fs.readFileSync(siteFilePath, 'utf8'));
        const timestamps = Object.keys(contentData).sort().reverse();
        const latestContent = timestamps.length > 0 ? contentData[timestamps[0]] : null;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          content: latestContent,
          regions: latestContent ? latestContent.regions : null,
          message: '콘텐츠가 로드되었습니다.'
        }));
      } catch (error) {
        console.error('Content load error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: '콘텐츠를 불러오는 중 오류가 발생했습니다.',
          details: error.message
        }));
      }
    }
    // 콘텐츠 히스토리 API
    else if (req.url.startsWith('/api/content-history')) {
      if (req.method !== 'GET') {
        return res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }

      // URL에서 쿼리 파라미터 파싱
      const url = new URL(req.url, `http://${req.headers.host}`);
      const page = url.searchParams.get('page');
      
      if (!page) {
        return res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'page 파라미터가 필요합니다.' }));
      }

      try {
        const contentDir = path.join(__dirname, '../contents');
        const fileName = page.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
        const filePath = path.join(contentDir, fileName);

        if (!fs.existsSync(filePath)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, history: [], message: '저장된 히스토리가 없습니다.' }));
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

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, history, message: '히스토리가 로드되었습니다.' }));
      } catch (error) {
        console.error('History load error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: '히스토리를 불러오는 중 오류가 발생했습니다.',
          details: error.message
        }));
      }
    }
    // 다른 요청은 다음 미들웨어로 전달
    else {
      next();
    }
  };
};
