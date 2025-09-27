const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// CORS 설정
app.use(cors());
app.use(express.json());

// 배치 파일 실행 엔드포인트
app.post('/run-workflow', (req, res) => {
  console.log('워크플로우 실행 요청 받음');
  
  const projectRoot = __dirname;
  const batchFile = path.join(projectRoot, 'write-workflow.bat');
  
  console.log('배치 파일 경로:', batchFile);
  
  // 배치 파일 실행
  const child = spawn('cmd', ['/c', batchFile], {
    cwd: projectRoot,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let output = '';
  let errorOutput = '';
  
  child.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    console.log('출력:', text);
  });
  
  child.stderr.on('data', (data) => {
    const text = data.toString();
    errorOutput += text;
    console.error('오류:', text);
  });
  
  child.on('close', (code) => {
    console.log(`워크플로우 완료. 종료 코드: ${code}`);
    
    if (code === 0) {
      res.json({
        success: true,
        message: '워크플로우가 성공적으로 실행되었습니다!',
        output: output,
        exitCode: code
      });
    } else {
      res.json({
        success: false,
        message: '워크플로우 실행 중 오류가 발생했습니다.',
        error: errorOutput,
        output: output,
        exitCode: code
      });
    }
  });
  
  child.on('error', (error) => {
    console.error('워크플로우 실행 오류:', error);
    res.status(500).json({
      success: false,
      message: '워크플로우 실행 중 오류가 발생했습니다.',
      error: error.message
    });
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 배포 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
  console.log('워크플로우 실행: POST http://localhost:3001/run-workflow');
});
