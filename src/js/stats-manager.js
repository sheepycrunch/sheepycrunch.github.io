// 통계 관리자 클래스
class StatsManager {
  constructor() {
    this.storageKey = 'hamster_dungeon_stats';
    this.visitorKey = 'hamster_visitor_count';
    this.lastVisitKey = 'hamster_last_visit';
    this.postCountKey = 'hamster_dungeon_posts';
    
    this.init();
  }
  
  init() {
    this.loadStats();
    this.updateStats();
    this.setupEventListeners();
  }
  
  loadStats() {
    const defaultStats = {
      visitors: 1337,
      posts: 42,
      lastUpdate: new Date().toISOString()
    };
    
    // 기존 localStorage에서 방문자 수 읽기
    const existingVisitorCount = parseInt(localStorage.getItem(this.visitorKey)) || defaultStats.visitors;
    
    this.stats = JSON.parse(localStorage.getItem(this.storageKey)) || defaultStats;
    this.stats.visitors = existingVisitorCount;
  }
  
  saveStats() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
  }
  
  updateStats() {
    this.updateVisitorCount();
    this.updateLastUpdateDate();
    this.updatePostCount();
    this.saveStats();
  }
  
  updateVisitorCount() {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem(this.lastVisitKey);
    
    // 오늘 첫 방문인 경우에만 카운트 증가
    if (lastVisit !== today) {
      this.stats.visitors++;
      localStorage.setItem(this.lastVisitKey, today);
      localStorage.setItem(this.visitorKey, this.stats.visitors.toString());
    }
    
    this.updateElement('.stat-item:nth-child(2) .stat-value', this.stats.visitors.toLocaleString());
  }
  
  updateLastUpdateDate() {
    const now = new Date();
    const options = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const formattedDate = now.toLocaleDateString('ko-KR', options);
    this.stats.lastUpdate = now.toISOString();
    
    this.updateElement('.stat-item:nth-child(3) .stat-value', formattedDate);
  }
  
  updatePostCount() {
    // 실제 포스트 수를 계산하는 로직
    // 여기서는 간단히 로컬 스토리지에서 관리
    let postCount = parseInt(localStorage.getItem(this.postCountKey)) || this.stats.posts;
    
    // 실제로는 서버에서 파일 수를 계산하거나 API를 호출할 수 있음
    // 예: fetch('/api/posts/count').then(response => response.json()).then(data => { ... });
    
    this.stats.posts = postCount;
    this.updateElement('.stat-item:nth-child(1) .stat-value', postCount.toLocaleString());
  }
  
  updateElement(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      // 애니메이션과 함께 업데이트
      this.animateValue(element, value);
    }
  }
  
  animateValue(element, targetValue) {
    const startValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const endValue = parseInt(targetValue.replace(/,/g, '')) || 0;
    
    if (startValue === endValue) return;
    
    const duration = 1000;
    const startTime = performance.now();
    const difference = endValue - startValue;
    
    const updateValue = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(startValue + (difference * progress));
      
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };
    
    requestAnimationFrame(updateValue);
  }
  
  setupEventListeners() {
    // 페이지 가시성 변경 시 통계 업데이트
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateStats();
      }
    });
    
    // 주기적으로 통계 업데이트 (5분마다)
    setInterval(() => {
      this.updateStats();
    }, 5 * 60 * 1000);
    
    // 페이지 언로드 시 통계 저장
    window.addEventListener('beforeunload', () => {
      this.saveStats();
    });
  }
  
  // 외부에서 호출할 수 있는 메서드들
  incrementPostCount() {
    this.stats.posts++;
    this.updatePostCount();
    this.saveStats();
  }
  
  getStats() {
    return { ...this.stats };
  }
  
  resetStats() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.visitorKey);
    localStorage.removeItem(this.lastVisitKey);
    localStorage.removeItem(this.postCountKey);
    this.init();
  }
}

// 전역 인스턴스 생성
window.statsManager = new StatsManager();
