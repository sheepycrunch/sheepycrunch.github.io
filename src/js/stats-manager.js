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
    this.updateVisitorCount();
    this.updatePostCount();
    this.updateLastUpdateDate();
    this.setupEventListeners();
  }
  
  loadStats() {
    const defaultStats = {
      visitors: 0,
      posts: 0,
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
    
    // 실제 HTML 구조에 맞게 업데이트
    this.updateSiteStats();
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
    
    // 기존 테이블 구조와 새로운 구조 모두 지원
    this.updateElement('.stat-item:nth-child(3) .stat-value', formattedDate);
    this.updateElement('#last-update', formattedDate);
  }
  
  updatePostCount() {
    // 서버에서 계산된 포스트 수를 가져오기
    const postCountElement = document.getElementById('post-count');
    let postCount = 0;
    
    if (postCountElement) {
      // 서버에서 계산된 포스트 수 사용
      postCount = parseInt(postCountElement.textContent) || 0;
    } else {
      // 폴백: 로컬 스토리지에서 계산
      const savedPosts = JSON.parse(localStorage.getItem('hamster_posts') || '[]');
      postCount = savedPosts.length;
      
      // 기본 페이지들 추가
      const basicPages = ['txt', 'gallery', 'archive', 'links', 'search', 'write', 'login'];
      postCount += basicPages.length;
    }
    
    this.stats.posts = postCount;
    localStorage.setItem(this.postCountKey, postCount.toString());
    
    // 실제 HTML 구조에 맞게 업데이트
    this.updateSiteStats();
  }
  
  updateSiteStats() {
    const siteStatsElement = document.getElementById('site-stats');
    const searchStatsElement = document.getElementById('search-stats');
    const postCountElement = document.getElementById('post-count');
    const visitorCountElement = document.getElementById('visitor-count');
    const lastUpdateElement = document.getElementById('last-update');
    
    // 개별 요소 업데이트
    if (postCountElement) {
      postCountElement.textContent = this.stats.posts;
    }
    
    if (visitorCountElement) {
      visitorCountElement.textContent = this.stats.visitors.toLocaleString();
    }
    
    if (lastUpdateElement) {
      const now = new Date();
      const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      };
      const formattedDate = now.toLocaleDateString('ko-KR', options);
      lastUpdateElement.textContent = formattedDate;
    }
    
    // 전체 통계 요소가 있는 경우 (하위 호환성)
    if (siteStatsElement && !postCountElement) {
      const now = new Date();
      const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      };
      const formattedDate = now.toLocaleDateString('ko-KR', options);
      
      siteStatsElement.innerHTML = `포스트: ${this.stats.posts}, 방문자: ${this.stats.visitors.toLocaleString()}, 마지막 업데이트: <span id="last-update">${formattedDate}</span>`;
    }
    
    // 구글 서치콘솔 통계 업데이트 (서버에서 전달된 데이터가 있는 경우)
    if (searchStatsElement) {
      if (window.searchConsoleStats && window.searchConsoleStats.totalClicks > 0) {
        const stats = window.searchConsoleStats;
        searchStatsElement.innerHTML = `검색 클릭: ${stats.totalClicks.toLocaleString()}, 노출: ${stats.totalImpressions.toLocaleString()}, CTR: ${stats.averageCtr}%`;
        searchStatsElement.style.display = 'block';
      } else {
        searchStatsElement.style.display = 'none';
      }
    }
  }

  updateElement(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      // 마지막 업데이트는 애니메이션 없이 바로 업데이트
      if (selector === '#last-update') {
        element.textContent = value;
      } else {
        // 애니메이션과 함께 업데이트
        this.animateValue(element, value);
      }
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
        this.updateLastUpdateDate();
        this.updatePostCount();
      }
    });
    
    // 주기적으로 마지막 업데이트만 갱신 (1분마다)
    setInterval(() => {
      this.updateLastUpdateDate();
    }, 60 * 1000);
    
    // 포스트 수는 페이지 로드 시에만 업데이트
    // 방문자 수는 하루에 한 번만 증가
    
    // 페이지 언로드 시 통계 저장
    window.addEventListener('beforeunload', () => {
      this.saveStats();
    });
    
    // 포스트가 추가/삭제될 때를 감지하는 이벤트 리스너
    window.addEventListener('postUpdated', () => {
      this.updatePostCount();
    });
  }
  
  // 외부에서 호출할 수 있는 메서드들
  incrementPostCount() {
    // 실제 포스트 수를 다시 계산
    this.updatePostCount();
    this.saveStats();
  }
  
  // 포스트가 추가/삭제될 때 호출되는 메서드
  refreshPostCount() {
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
