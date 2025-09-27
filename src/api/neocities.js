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

// Base64 이미지 변환 및 Neocities 업로드 엔드포인트
router.post('/convert-and-upload-image', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const FormData = require('form-data');
    
    const { base64Data } = req.body;
    
    if (!base64Data || !base64Data.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }
    
    // 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = base64Data.split(';')[0].split('/')[1];
    const filename = `${timestamp}_${randomString}.${extension}`;
    
    // Base64를 파일로 변환
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 data');
    }
    
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, 'base64');
    
    // 업로드 폴더 생성
    const uploadDir = path.join(__dirname, '..', 'images', 'uploaded');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    // Neocities에 업로드
    if (neocitiesApiToken) {
      const formData = new FormData();
      formData.append(`images/uploaded/${filename}`, fs.createReadStream(filePath));
      
      const response = await fetch('https://neocities.org/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${neocitiesApiToken}`,
          ...formData.getHeaders()
        },
        body: formData
      });
      
      if (response.ok) {
        const imageUrl = `https://dakimakura.neocities.org/images/uploaded/${filename}`;
        console.log('Image uploaded to Neocities:', imageUrl);
        res.json({ success: true, imageUrl });
      } else {
        throw new Error(`Neocities upload failed: ${response.status}`);
      }
    } else {
      throw new Error('Neocities API token not configured');
    }
  } catch (error) {
    console.error('Image conversion/upload error:', error);
    res.status(500).json({ error: 'Failed to convert and upload image' });
  }
});

// posts.json 업데이트 및 Git 커밋 엔드포인트
router.post('/update-posts-and-commit', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const { exec } = require('child_process');
    
    const { posts } = req.body;
    
    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ error: 'Invalid posts data' });
    }
    
    // 로컬 posts.json 파일 업데이트
    const postsData = { posts };
    const postsPath = path.join(__dirname, '..', 'posts.json');
    
    await fs.writeFile(postsPath, JSON.stringify(postsData, null, 2), 'utf8');
    console.log('posts.json 파일이 업데이트되었습니다.');
    
    // Git에 커밋 및 푸시
    const commands = [
      'git add src/posts.json',
      'git add src/images/uploaded/',
      'git commit -m "Add new post with images"',
      'git push origin main'
    ];
    
    for (const command of commands) {
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Command failed: ${command}`, error);
            reject(error);
            return;
          }
          console.log(stdout);
          if (stderr) console.error(stderr);
          resolve();
        });
      });
    }
    
    console.log('Git 커밋 및 푸시 완료');
    res.json({ success: true, message: 'Posts updated and committed to Git' });
    
  } catch (error) {
    console.error('Posts update and commit error:', error);
    res.status(500).json({ error: 'Failed to update posts and commit to Git' });
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
