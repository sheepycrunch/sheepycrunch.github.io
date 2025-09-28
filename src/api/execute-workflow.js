const { exec } = require('child_process');
const path = require('path');
const DeployLimiter = require('../../deploy-limiter');

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
    const { buildOnly, deployOnly, force } = req.body;
    
    // 빌드만 실행하는 경우 (예외처리 없음)
    if (buildOnly) {
      console.log('빌드만 실행 요청');
      
      // 프로젝트 루트 디렉토리로 이동
      const projectRoot = path.join(__dirname, '../../');
      
      // Eleventy 빌드만 실행
      exec('npm run build', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          console.error('빌드 오류:', error);
          res.status(500).json({ 
            success: false, 
            error: error.message,
            stderr: stderr 
          });
          return;
        }
        
        console.log('빌드 완료');
        console.log('출력:', stdout);
        
        res.status(200).json({ 
          success: true, 
          message: '빌드가 성공적으로 완료되었습니다.',
          output: stdout 
        });
      });
      return;
    }
    
    // 배포만 실행하는 경우 (예외처리 포함)
    if (deployOnly) {
      // 배포 빈도 제한 확인
      const deployLimiter = new DeployLimiter();
      const deployInfo = deployLimiter.canDeploy();
      
      if (!deployInfo.canDeploy && !force) {
        console.log(`배포 제한: 오늘 배포 횟수 초과 (${deployInfo.todayCount}/${deployInfo.maxCount})`);
        res.status(429).json({ 
          success: false, 
          error: '배포 빈도 제한',
          message: `오늘 배포 횟수를 초과했습니다. (${deployInfo.todayCount}/${deployInfo.maxCount})`,
          remainingCount: deployInfo.remainingCount,
          nextReset: deployInfo.nextReset
        });
        return;
      }

      // 강제 배포 요청 확인
      if (force) {
        console.log('⚠️ 강제 배포 요청 감지');
        deployLimiter.forceDeploy('API 강제 요청');
      } else {
        // 일반 배포 기록
        deployLimiter.recordDeployment('API 요청');
      }
      
      // 프로젝트 루트 디렉토리로 이동
      const projectRoot = path.join(__dirname, '../../');
      const batchFile = path.join(projectRoot, 'write-workflow.bat');
      
      console.log('배포 실행 중...');
      console.log('배치 파일 경로:', batchFile);
      
      // 배치 파일 실행
      exec(`"${batchFile}"`, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          console.error('배포 오류:', error);
          res.status(500).json({ 
            success: false, 
            error: error.message,
            stderr: stderr 
          });
          return;
        }
        
        console.log('배포 완료');
        console.log('출력:', stdout);
        
        res.status(200).json({ 
          success: true, 
          message: '배포가 성공적으로 완료되었습니다.',
          output: stdout 
        });
      });
      return;
    }
    
    // 기본: 전체 워크플로우 실행 (빌드 + 배포, 예외처리 포함)
    const deployLimiter = new DeployLimiter();
    const deployInfo = deployLimiter.canDeploy();
    
    if (!deployInfo.canDeploy && !force) {
      console.log(`배포 제한: 오늘 배포 횟수 초과 (${deployInfo.todayCount}/${deployInfo.maxCount})`);
      res.status(429).json({ 
        success: false, 
        error: '배포 빈도 제한',
        message: `오늘 배포 횟수를 초과했습니다. (${deployInfo.todayCount}/${deployInfo.maxCount})`,
        remainingCount: deployInfo.remainingCount,
        nextReset: deployInfo.nextReset
      });
      return;
    }

    // 강제 배포 요청 확인
    if (force) {
      console.log('⚠️ 강제 배포 요청 감지');
      deployLimiter.forceDeploy('API 강제 요청');
    } else {
      // 일반 배포 기록
      deployLimiter.recordDeployment('API 요청');
    }
    
    // 프로젝트 루트 디렉토리로 이동
    const projectRoot = path.join(__dirname, '../../');
    const batchFile = path.join(projectRoot, 'write-workflow.bat');
    
    console.log('전체 워크플로우 실행 중...');
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
  } else if (req.method === 'GET') {
    // 배포 상태 확인
    const deployLimiter = new DeployLimiter();
    const deployInfo = deployLimiter.getDeployInfo();
    
    res.status(200).json({
      success: true,
      deployInfo: deployInfo
    });
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
};
