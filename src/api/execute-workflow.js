const { exec } = require('child_process');
const path = require('path');

module.exports = function(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST') {
    // 프로젝트 루트 디렉토리로 이동
    const projectRoot = path.join(__dirname, '../../');
    const batchFile = path.join(projectRoot, 'write-workflow.bat');
    
    console.log('워크플로우 실행 중...');
    console.log('배치 파일 경로:', batchFile);
    
    // 배치 파일 실행
    exec(`"${batchFile}"`, { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        console.error('실행 오류:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message,
          stderr: stderr 
        });
        return;
      }
      
      console.log('워크플로우 실행 완료');
      console.log('출력:', stdout);
      
      res.status(200).json({ 
        success: true, 
        message: '워크플로우가 성공적으로 실행되었습니다.',
        output: stdout 
      });
    });
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
};
