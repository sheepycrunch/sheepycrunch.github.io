// 상단 메시지 표시 유틸리티 함수
window.showTopMessage = function(message) {
  // 기존 메시지 제거
  const existingMessage = document.getElementById('top-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // 새 메시지 생성
  const messageDiv = document.createElement('div');
  messageDiv.id = 'top-message';
  messageDiv.textContent = message;
  
  // body 맨 앞에 추가
  document.body.insertBefore(messageDiv, document.body.firstChild);
  
  // 트랜지션을 위해 약간의 지연 후 show 클래스 추가
  setTimeout(() => {
    messageDiv.classList.add('show');
  }, 10);
  
  // 1초 후 사라지는 애니메이션 시작
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.classList.remove('show');
      
      // 트랜지션 완료 후 제거
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 300);
    }
  }, 2000);
}
