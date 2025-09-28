const fs = require('fs');
const path = require('path');

class DeployLimiter {
  constructor() {
    this.historyFile = path.join(__dirname, 'deploy-history.json');
    this.maxDeploysPerDay = 1; // 하루 최대 배포 횟수
    this.loadHistory();
  }

  // 배포 기록 로드
  loadHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf8');
        this.history = JSON.parse(data);
      } else {
        this.history = {
          deployments: [],
          lastReset: new Date().toISOString().split('T')[0] // YYYY-MM-DD 형식
        };
      }
    } catch (error) {
      console.error('배포 기록 로드 오류:', error);
      this.history = {
        deployments: [],
        lastReset: new Date().toISOString().split('T')[0]
      };
    }
  }

  // 배포 기록 저장
  saveHistory() {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
    } catch (error) {
      console.error('배포 기록 저장 오류:', error);
    }
  }

  // 오늘 날짜 확인
  getToday() {
    return new Date().toISOString().split('T')[0];
  }

  // 하루가 지났는지 확인하고 기록 초기화
  checkAndResetDaily() {
    const today = this.getToday();
    if (this.history.lastReset !== today) {
      console.log(`새로운 날짜 감지: ${today}, 배포 기록 초기화`);
      this.history.deployments = [];
      this.history.lastReset = today;
      this.saveHistory();
    }
  }

  // 배포 가능 여부 확인
  canDeploy() {
    this.checkAndResetDaily();
    
    const today = this.getToday();
    const todayDeployments = this.history.deployments.filter(
      deploy => deploy.date === today
    );

    const canDeploy = todayDeployments.length < this.maxDeploysPerDay;
    
    console.log(`오늘 배포 횟수: ${todayDeployments.length}/${this.maxDeploysPerDay}`);
    
    return {
      canDeploy,
      todayCount: todayDeployments.length,
      maxCount: this.maxDeploysPerDay,
      remainingCount: this.maxDeploysPerDay - todayDeployments.length
    };
  }

  // 배포 기록 추가
  recordDeployment(reason = 'manual') {
    this.checkAndResetDaily();
    
    const deployment = {
      timestamp: new Date().toISOString(),
      date: this.getToday(),
      reason: reason
    };

    this.history.deployments.push(deployment);
    this.saveHistory();
    
    console.log(`배포 기록 추가: ${deployment.timestamp} (${deployment.reason})`);
    return deployment;
  }

  // 배포 제한 정보 가져오기
  getDeployInfo() {
    this.checkAndResetDaily();
    
    const today = this.getToday();
    const todayDeployments = this.history.deployments.filter(
      deploy => deploy.date === today
    );

    return {
      todayCount: todayDeployments.length,
      maxCount: this.maxDeploysPerDay,
      remainingCount: this.maxDeploysPerDay - todayDeployments.length,
      canDeploy: todayDeployments.length < this.maxDeploysPerDay,
      lastDeployment: todayDeployments.length > 0 ? todayDeployments[todayDeployments.length - 1] : null,
      nextReset: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

  // 강제 배포 (긴급 상황용)
  forceDeploy(reason = 'force') {
    console.log(`⚠️ 강제 배포 실행: ${reason}`);
    return this.recordDeployment(`FORCE: ${reason}`);
  }
}

module.exports = DeployLimiter;
