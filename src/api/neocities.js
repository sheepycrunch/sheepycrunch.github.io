// Neocities API 프록시 서버
// 이 파일은 서버 사이드에서만 실행되며, 클라이언트에서는 접근할 수 없습니다.

const express = require('express');
const router = express.Router();

// 환경변수에서 토큰 가져오기
const neocitiesApiToken = process.env.NEOCITIES_API_KEY;
const githubToken = process.env.AUTHOR_TOKEN;
const adminSecretKey = process.env.ADMIN_SECRET_KEY;

// Neocities API 프록시 엔드포인트
router.post('/upload', async (req, res) => {
  try {
    if (!neocitiesApiToken) {
      return res.status(500).json({ error: 'Neocities API token not configured' });
    }

    const { file, filename } = req.body;
    
    const formData = new FormData();
    formData.append('file', file, filename);
    
    const response = await fetch('https://neocities.org/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${neocitiesApiToken}`,
      },
      body: formData
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Neocities upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Neocities API 삭제 프록시 엔드포인트
router.post('/delete', async (req, res) => {
  try {
    if (!neocitiesApiToken) {
      return res.status(500).json({ error: 'Neocities API token not configured' });
    }

    const { filenames } = req.body;
    
    const formData = new FormData();
    filenames.forEach(filename => {
      formData.append('filenames[]', filename);
    });
    
    const response = await fetch('https://neocities.org/api/delete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${neocitiesApiToken}`,
        'User-Agent': 'sheepycrunch.github.io',
      },
      body: formData
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Neocities delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// GitHub API 프록시 엔드포인트
router.post('/github', async (req, res) => {
  try {
    if (!githubToken) {
      return res.status(500).json({ error: 'GitHub token not configured' });
    }

    const { url, method, data } = req.body;
    
    const response = await fetch(url, {
      method: method || 'GET',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'sheepycrunch.github.io',
      },
      body: data ? JSON.stringify(data) : undefined
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('GitHub API error:', error);
    res.status(500).json({ error: 'GitHub API call failed' });
  }
});

// 관리자 인증 프록시 엔드포인트
router.post('/admin/verify', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!adminSecretKey) {
      return res.status(500).json({ error: 'Admin secret key not configured' });
    }
    
    if (password === adminSecretKey) {
      res.json({ success: true, message: 'Authentication successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid password' });
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
