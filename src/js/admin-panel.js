// 관리자 패널 클래스
class AdminPanel {
  constructor() {
    this.isVisible = false;
    this.panel = null;
    this.init();
  }
  
  init() {
    // 개발자 도구에서만 접근 가능하도록 설정
    if (this.isDeveloperMode()) {
      this.createPanel();
      this.setupKeyboardShortcut();
    }
  }
  
  isDeveloperMode() {
    // 개발자 도구가 열려있거나 특정 키 조합을 눌렀을 때 활성화
    return window.location.search.includes('admin=true') || 
           localStorage.getItem('hamster_admin_mode') === 'true';
  }
  
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'admin-panel';
    this.panel.innerHTML = `
      <div class="admin-header">
        <h3>관리자 패널</h3>
        <button id="close-admin">×</button>
      </div>
      <div class="admin-content">
        <div class="admin-section">
          <h4>통계 관리</h4>
          <button id="reset-stats">통계 초기화</button>
          <button id="increment-posts">포스트 수 증가</button>
          <button id="export-stats">통계 내보내기</button>
        </div>
        <div class="admin-section">
          <h4>현재 통계</h4>
          <div id="current-stats"></div>
        </div>
        <div class="admin-section">
          <h4>개발자 도구</h4>
          <button id="toggle-debug">디버그 모드</button>
          <button id="clear-storage">스토리지 초기화</button>
        </div>
      </div>
    `;
    
    this.addStyles();
    document.body.appendChild(this.panel);
    this.setupEventListeners();
  }
  
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #admin-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: #fff;
        border: 2px solid #425fb6;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: '맑은 고딕', sans-serif;
        font-size: 14px;
      }
      
      .admin-header {
        background: #425fb6;
        color: white;
        padding: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 6px 6px 0 0;
      }
      
      .admin-header h3 {
        margin: 0;
        font-size: 16px;
      }
      
      #close-admin {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .admin-content {
        padding: 15px;
      }
      
      .admin-section {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
      }
      
      .admin-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }
      
      .admin-section h4 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 14px;
      }
      
      .admin-section button {
        display: block;
        width: 100%;
        margin-bottom: 8px;
        padding: 8px 12px;
        background: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
      }
      
      .admin-section button:hover {
        background: #e9ecef;
        border-color: #425fb6;
      }
      
      .admin-section button:last-child {
        margin-bottom: 0;
      }
      
      #current-stats {
        background: #f8f9fa;
        padding: 10px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        white-space: pre-wrap;
      }
    `;
    document.head.appendChild(style);
  }
  
  setupEventListeners() {
    // 패널 닫기
    document.getElementById('close-admin').addEventListener('click', () => {
      this.hide();
    });
    
    // 통계 초기화
    document.getElementById('reset-stats').addEventListener('click', () => {
      if (confirm('정말로 통계를 초기화하시겠습니까?')) {
        if (window.statsManager) {
          window.statsManager.resetStats();
          this.updateCurrentStats();
          alert('통계가 초기화되었습니다.');
        }
      }
    });
    
    // 포스트 수 증가
    document.getElementById('increment-posts').addEventListener('click', () => {
      if (window.statsManager) {
        window.statsManager.incrementPostCount();
        this.updateCurrentStats();
      }
    });
    
    // 통계 내보내기
    document.getElementById('export-stats').addEventListener('click', () => {
      if (window.statsManager) {
        const stats = window.statsManager.getStats();
        const dataStr = JSON.stringify(stats, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'hamster-dungeon-stats.json';
        link.click();
        URL.revokeObjectURL(url);
      }
    });
    
    // 디버그 모드 토글
    document.getElementById('toggle-debug').addEventListener('click', () => {
      const isDebug = localStorage.getItem('hamster_debug_mode') === 'true';
      localStorage.setItem('hamster_debug_mode', (!isDebug).toString());
      alert(`디버그 모드가 ${!isDebug ? '활성화' : '비활성화'}되었습니다.`);
    });
    
    // 스토리지 초기화
    document.getElementById('clear-storage').addEventListener('click', () => {
      if (confirm('정말로 모든 로컬 스토리지를 초기화하시겠습니까?')) {
        localStorage.clear();
        alert('로컬 스토리지가 초기화되었습니다. 페이지를 새로고침하세요.');
        location.reload();
      }
    });
    
    // 현재 통계 업데이트
    this.updateCurrentStats();
    setInterval(() => this.updateCurrentStats(), 5000);
  }
  
  setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Ctrl + Shift + A로 관리자 패널 토글
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        this.toggle();
      }
    });
  }
  
  updateCurrentStats() {
    const statsElement = document.getElementById('current-stats');
    if (statsElement && window.statsManager) {
      const stats = window.statsManager.getStats();
      statsElement.textContent = JSON.stringify(stats, null, 2);
    }
  }
  
  show() {
    if (this.panel) {
      this.panel.style.display = 'block';
      this.isVisible = true;
    }
  }
  
  hide() {
    if (this.panel) {
      this.panel.style.display = 'none';
      this.isVisible = false;
    }
  }
  
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// 관리자 패널 초기화
document.addEventListener('DOMContentLoaded', () => {
  new AdminPanel();
});
