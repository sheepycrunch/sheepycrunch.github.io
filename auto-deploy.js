const { exec } = require('child_process');
const path = require('path');

console.log('자동 배포 시작...');

// write-workflow.bat 실행
const batchFile = path.join(__dirname, 'write-workflow.bat');
const command = `"${batchFile}"`;

exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('실행 오류:', error);
    process.exit(1);
  }
  
  console.log('배포 완료!');
  console.log('출력:', stdout);
  
  if (stderr) {
    console.error('경고:', stderr);
  }
});
