// 관리자 패널 클래스
class AdminPanel {
  constructor() {
    this.isVisible = false;
    this.panel = null;
    this.writerPanel = null;
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
          <h4>글 작성기</h4>
          <button id="open-writer">글 작성기 열기</button>
          <button id="export-html">HTML 내보내기</button>
          <button id="sync-data">데이터 동기화</button>
        </div>
        <div class="admin-section">
          <h4>업데이트 관리</h4>
          <button id="add-update">새 업데이트 추가</button>
          <button id="manage-updates">업데이트 목록 관리</button>
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
        border-radius: var(--border-radius-sm);
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
        border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
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
        border-radius: var(--border-radius-sm);
        cursor: pointer;
        font-size: 12px;
        transition: var(--transition-fast);
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
        border-radius: var(--border-radius-sm);
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
        // 실제 포스트를 추가하는 로직
        this.addSamplePost();
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
    
    // 글 작성기 열기
    document.getElementById('open-writer').addEventListener('click', () => {
      this.openWriter();
    });
    
    // HTML 내보내기
    document.getElementById('export-html').addEventListener('click', () => {
      this.showHTMLExport();
    });
    
    // 스토리지 초기화
    document.getElementById('clear-storage').addEventListener('click', () => {
      if (confirm('정말로 모든 로컬 스토리지를 초기화하시겠습니까?')) {
        localStorage.clear();
        alert('로컬 스토리지가 초기화되었습니다. 페이지를 새로고침하세요.');
        location.reload();
      }
    });
    
    // 새 업데이트 추가
    document.getElementById('add-update').addEventListener('click', () => {
      this.openUpdateEditor();
    });
    
    // 업데이트 목록 관리
    document.getElementById('manage-updates').addEventListener('click', () => {
      this.manageUpdates();
    });
    
    // 데이터 동기화
    document.getElementById('sync-data').addEventListener('click', () => {
      this.syncDataTemplates();
      alert('데이터 동기화가 완료되었습니다!');
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

  // 데이터 템플릿 동기화 기능
  syncDataTemplates() {
    // 로컬 스토리지에서 데이터를 읽어와서 페이지에 반영
    this.loadTxtData();
    this.loadGalleryData();
    this.loadArchiveData();
  }

  loadTxtData() {
    const txtData = localStorage.getItem('txt_data');
    if (txtData) {
      // txt 페이지에 데이터 반영 (실제로는 서버에 저장되어야 함)
      console.log('txt 데이터 로드:', JSON.parse(txtData));
    }
  }

  loadGalleryData() {
    const galleryData = localStorage.getItem('gallery_data');
    if (galleryData) {
      // gallery 페이지에 데이터 반영
      console.log('gallery 데이터 로드:', JSON.parse(galleryData));
    }
  }

  loadArchiveData() {
    const archiveData = localStorage.getItem('archive_data');
    if (archiveData) {
      // archive 페이지에 데이터 반영
      console.log('archive 데이터 로드:', JSON.parse(archiveData));
    }
  }

  addSamplePost() {
    const posts = JSON.parse(localStorage.getItem('hamster_posts') || '[]');
    const newPost = {
      id: Date.now(),
      content: `샘플 포스트 #${posts.length + 1}\n\n이것은 관리자 패널에서 생성된 샘플 포스트입니다.`,
      tags: ['sample', 'admin'],
      image: '',
      category: 'posts',
      date: new Date().toLocaleDateString('ko-KR').replace(/\./g, '.').replace(/\s/g, ''),
      timestamp: Date.now()
    };
    
    posts.push(newPost);
    localStorage.setItem('hamster_posts', JSON.stringify(posts));
    
    // 데이터 템플릿에 반영
    this.updateDataTemplate(newPost);
    
    alert(`샘플 포스트가 추가되었습니다! (총 ${posts.length}개)`);
  }

  updateDataTemplate(post) {
    // 카테고리별로 데이터 템플릿 업데이트
    switch(post.category) {
      case 'posts':
        this.updateTxtData(post);
        break;
      case 'gallery':
        this.updateGalleryData(post);
        break;
      case 'archive':
        this.updateArchiveData(post);
        break;
      default:
        this.updateTxtData(post);
    }
  }

  updateTxtData(post) {
    // txt.json 데이터 업데이트 (실제로는 서버에 저장해야 함)
    console.log('txt 데이터 업데이트:', post);
    // 여기서는 로컬 스토리지에 임시 저장
    const txtData = JSON.parse(localStorage.getItem('txt_data') || '{"posts": []}');
    txtData.posts.push({
      id: post.id,
      date: post.date,
      category: post.category,
      content: post.content,
      excerpt: post.content.substring(0, 50) + '...',
      tags: post.tags
    });
    localStorage.setItem('txt_data', JSON.stringify(txtData));
  }

  updateGalleryData(post) {
    // gallery.json 데이터 업데이트
    console.log('gallery 데이터 업데이트:', post);
    const galleryData = JSON.parse(localStorage.getItem('gallery_data') || '{"gallery": []}');
    galleryData.gallery.push({
      id: post.id,
      date: post.date,
      category: post.category,
      image: post.image,
      description: post.content,
      tags: post.tags
    });
    localStorage.setItem('gallery_data', JSON.stringify(galleryData));
  }

  updateArchiveData(post) {
    // archive.json 데이터 업데이트
    console.log('archive 데이터 업데이트:', post);
    const archiveData = JSON.parse(localStorage.getItem('archive_data') || '{"timeline": []}');
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    
    // 해당 날짜의 타임라인 찾기
    let timelineItem = archiveData.timeline.find(item => 
      item.year === year.toString() && item.month === month.toString()
    );
    
    if (!timelineItem) {
      timelineItem = {
        year: year.toString(),
        month: month.toString(),
        date: date.toString(),
        events: []
      };
      archiveData.timeline.push(timelineItem);
    }
    
    timelineItem.events.push({
      description: post.content,
      type: post.category,
      url: `/${post.category}.html`
    });
    
    localStorage.setItem('archive_data', JSON.stringify(archiveData));
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
  
  openWriter() {
    if (this.writerPanel) {
      this.writerPanel.style.display = 'block';
      this.writerOverlay.style.display = 'block';
      return;
    }
    
    // 오버레이 패널 생성
    this.writerOverlay = document.createElement('div');
    this.writerOverlay.id = 'writer-overlay';
    this.writerOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    this.writerPanel = document.createElement('div');
    this.writerPanel.id = 'writer-panel';
    this.writerPanel.innerHTML = `
      <div class="writer-header">
        <h3>글 작성기</h3>
        <button id="close-writer">×</button>
      </div>
      <div class="writer-content">
        <div class="writer-form">
          <div class="form-group">
            <label for="post-category">카테고리</label>
            <select id="post-category">
              <option value="posts">일반</option>
              <option value="gallery">갤러리</option>
              <option value="archive">아카이브</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="post-image">이미지</label>
            <div class="image-upload-area" id="image-upload-area">
              <div class="drag-drop-zone" id="drag-drop-zone">
                <p>이미지를 여기에 드래그하거나 클릭하여 선택</p>
                <input type="file" id="image-file-input" accept="image/*" style="display: none;" />
              </div>
              <div class="image-preview" id="image-preview" style="display: none;">
                <img id="preview-img" src="" alt="미리보기" />
                <button type="button" id="remove-image">이미지 제거</button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="post-content">내용</label>
            <textarea id="post-content" placeholder="내용을 입력하세요..."></textarea>
          </div>
          
          <div class="form-group">
            <label for="post-tags">태그 (영어만)</label>
            <input type="text" id="post-tags" placeholder="예: daily, thoughts, review" />
            <div class="tag-suggestions" id="tag-suggestions"></div>
          </div>
          
          <div class="writer-actions">
            <button id="save-draft-writer">임시저장</button>
            <button id="load-draft-writer">임시저장 불러오기</button>
            <button id="save-post">저장</button>
            <button id="clear-post">지우기</button>
          </div>
        </div>
      </div>
    `;
    
    this.addWriterStyles();
    document.body.appendChild(this.writerOverlay);
    this.writerOverlay.appendChild(this.writerPanel);
    this.setupWriterEvents();
  }
  
  addWriterStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #writer-panel {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 900px;
        height: 85%;
        max-height: 800px;
        background: var(--bg-primary);
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        border-left: none;
        border-right: none;
        border-radius: var(--border-radius-sm);
        z-index: 10001;
        font-family: var(--font-family-base);
        font-size: var(--font-size-base);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .writer-header {
        background: var(--accent-primary);
        color: white;
        padding: var(--spacing-lg);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: var(--border-radius-sm);
      }
      
      .writer-header h3 {
        margin: 0;
        font-size: var(--font-size-xl);
        font-weight: normal;
      }
      
      #close-writer {
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
        transition: var(--transition-fast);
      }
      
      #close-writer:hover {
        opacity: 0.8;
      }
      
      .writer-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: var(--spacing-3xl);
        overflow-y: auto;
      }
      
      .writer-form {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
      }
      
      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }
      
      .form-group label {
        font-size: var(--font-size-small);
        color: var(--text-secondary);
        font-weight: normal;
      }
      
      .form-group input,
      .form-group textarea,
      .form-group select {
        padding: var(--spacing-md);
        border: 1px solid var(--border-light);
        border-radius: var(--border-radius-sm);
        font-size: var(--font-size-base);
        font-family: var(--font-family-base);
        background: var(--bg-primary);
        color: var(--text-primary);
        transition: var(--transition-fast);
      }
      
      .form-group input:focus,
      .form-group textarea:focus,
      .form-group select:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px rgba(66, 95, 182, 0.1);
      }
      
      .form-help {
        display: block;
        margin-top: var(--spacing-xs);
        font-size: var(--font-size-small);
        color: var(--text-muted);
        line-height: 1.4;
      }
      
      #post-content {
        flex: 1;
        resize: none;
        min-height: 200px;
        line-height: var(--line-height-base);
      }
      
      .writer-actions {
        display: flex;
        gap: var(--spacing-md);
        justify-content: flex-end;
        flex-wrap: wrap;
        margin-top: var(--spacing-xl);
      }
      
      .writer-actions button {
        padding: var(--spacing-md) var(--spacing-xl);
        border: 1px solid var(--accent-primary);
        border-radius: var(--border-radius-sm);
        background: var(--accent-primary);
        color: white;
        cursor: pointer;
        font-size: var(--font-size-small);
        font-family: var(--font-family-base);
        transition: var(--transition-fast);
      }
      
      .writer-actions button:hover {
        background: var(--accent-secondary);
        border-color: var(--accent-secondary);
      }
      
      .writer-actions button:nth-child(3) {
        background: var(--accent-tertiary);
        border-color: var(--accent-tertiary);
      }
      
      .writer-actions button:nth-child(3):hover {
        background: #343a40;
      }
      
      .writer-actions button:last-child {
        background: var(--accent-secondary);
        border-color: var(--accent-secondary);
      }
      
      .writer-actions button:last-child:hover {
        background: #c82333;
      }
      
      
      .tag-suggestions {
        margin-top: var(--spacing-sm);
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
      }
      
      .tag-suggestion {
        background: var(--bg-secondary);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-sm);
        font-size: var(--font-size-small);
        cursor: pointer;
        transition: var(--transition-fast);
        border: 1px solid var(--border-light);
      }
      
      .tag-suggestion:hover {
        background: var(--accent-primary);
        color: white;
        border-color: var(--accent-primary);
      }
      
      .image-upload-area {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }
      
      .drag-drop-zone {
        border: 2px dashed var(--border-medium);
        border-radius: var(--border-radius-sm);
        padding: var(--spacing-xl);
        text-align: center;
        cursor: pointer;
        transition: var(--transition-fast);
        background: var(--bg-secondary);
      }
      
      .drag-drop-zone:hover,
      .drag-drop-zone.dragover {
        border-color: var(--accent-primary);
        background: rgba(66, 95, 182, 0.1);
      }
      
      .drag-drop-zone p {
        margin: 0;
        color: var(--text-secondary);
        font-size: var(--font-size-small);
      }
      
      .image-preview {
        text-align: center;
        padding: var(--spacing-md);
        border: 1px solid var(--border-light);
        border-radius: var(--border-radius-sm);
        background: var(--bg-secondary);
      }
      
      .image-preview img {
        max-width: 100%;
        max-height: 200px;
        border-radius: var(--border-radius-sm);
        margin-bottom: var(--spacing-md);
      }
      
      #remove-image {
        background: var(--accent-secondary);
        color: white;
        border: none;
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius-sm);
        cursor: pointer;
        font-size: var(--font-size-small);
        transition: var(--transition-fast);
      }
      
      #remove-image:hover {
        background: #c82333;
      }
    `;
    document.head.appendChild(style);
  }
  
  setupWriterEvents() {
    // 글 작성기 닫기
    document.getElementById('close-writer').addEventListener('click', () => {
      this.writerPanel.style.display = 'none';
      this.writerOverlay.style.display = 'none';
    });
    
    // 저장
    document.getElementById('save-post').addEventListener('click', () => {
      this.savePost();
    });
    
    
    // 임시저장 (글 작성기 내부)
    document.getElementById('save-draft-writer').addEventListener('click', () => {
      this.saveDraft();
    });
    
    // 임시저장 불러오기 (글 작성기 내부)
    document.getElementById('load-draft-writer').addEventListener('click', () => {
      this.loadDraft();
    });
    
    // 태그 입력 시 기존 태그 표시
    document.getElementById('post-tags').addEventListener('input', () => {
      this.showTagSuggestions();
    });
    
    // 태그 한글을 영문으로 자동 변환
    document.getElementById('post-tags').addEventListener('input', (e) => {
      let value = e.target.value;
      
      // 한글을 영문으로 변환하는 매핑
      const koreanToEnglish = {
        '일반': 'general',
        '리뷰': 'review', 
        '갤러리': 'gallery',
        '아카이브': 'archive',
        '생각': 'thoughts',
        '프로젝트': 'project',
        '튜토리얼': 'tutorial',
        '일기': 'diary',
        '후기': 'review',
        '소감': 'impression',
        '느낌': 'feeling',
        '경험': 'experience',
        '학습': 'learning',
        '공부': 'study',
        '개발': 'development',
        '코딩': 'coding',
        '프로그래밍': 'programming',
        '디자인': 'design',
        '아트': 'art',
        '그림': 'drawing',
        '스케치': 'sketch',
        '컬러링': 'coloring',
        '디지털': 'digital',
        '첫번째': 'first',
        '두번째': 'second',
        '세번째': 'third',
        '새로운': 'new',
        '최신': 'latest',
        '인기': 'popular',
        '추천': 'recommended'
      };
      
      // 한글을 영문으로 변환
      Object.keys(koreanToEnglish).forEach(korean => {
        const regex = new RegExp(korean, 'g');
        value = value.replace(regex, koreanToEnglish[korean]);
      });
      
      // 특수문자 제거 (영문, 숫자, 쉼표, 공백만 허용)
      value = value.replace(/[^a-zA-Z0-9,\s]/g, '');
      
      e.target.value = value;
    });
    
    // 이미지 드래그앤드랍
    this.setupImageUpload();
    
    // 지우기
    document.getElementById('clear-post').addEventListener('click', () => {
      if (confirm('정말로 내용을 지우시겠습니까?')) {
        this.clearForm();
      }
    });
  }
  
  savePost() {
    const content = document.getElementById('post-content').value.trim();
    const tags = document.getElementById('post-tags').value.trim();
    const category = document.getElementById('post-category').value;
    
    // 이미지 URL 가져오기 (미리보기에서)
    const previewImg = document.getElementById('preview-img');
    const image = previewImg && previewImg.src ? previewImg.src : '';
    
    if (!content) {
      alert('내용을 입력해주세요.');
      return;
    }
    
    // 통일된 템플릿 구조: 그림 하나 + 글 하나 (타이틀 없음)
    const post = {
      id: Date.now(),
      content: content,
      image: image,
      date: new Date().toLocaleDateString('ko-KR').replace(/\./g, '.').replace(/\s/g, ''),
      category: category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      timestamp: Date.now()
    };
    
    // 로컬 스토리지에 저장 (기존 방식 유지)
    const posts = JSON.parse(localStorage.getItem('hamster_posts') || '[]');
    posts.push(post);
    localStorage.setItem('hamster_posts', JSON.stringify(posts));
    
    // 데이터 템플릿에 반영
    this.updateDataTemplate(post);
    
    alert(`글이 저장되었습니다!\n카테고리: ${category}\n이미지: ${image ? '있음' : '없음'}`);
    this.clearForm();
  }
  
  generateAutoFilename(category) {
    const posts = JSON.parse(localStorage.getItem('hamster_posts') || '[]');
    const categoryPosts = posts.filter(post => post.category === category);
    const nextNumber = categoryPosts.length + 1;
    return `${category}_${nextNumber.toString().padStart(3, '0')}`;
  }
  
  clearForm() {
    document.getElementById('post-tags').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('post-category').value = 'posts';
    
    // 이미지 미리보기 초기화
    const imagePreview = document.getElementById('image-preview');
    const dragDropZone = document.getElementById('drag-drop-zone');
    const previewImg = document.getElementById('preview-img');
    const fileInput = document.getElementById('image-file-input');
    
    if (imagePreview && dragDropZone && previewImg && fileInput) {
      imagePreview.style.display = 'none';
      dragDropZone.style.display = 'block';
      previewImg.src = '';
      fileInput.value = '';
    }
  }
  
  generateHTMLFromPost(post) {
    const tagsArray = post.tags || [];
    const date = new Date().toLocaleDateString('ko-KR');
    
    const htmlContent = `---
permalink: /${post.category}/${post.filename}.html
layout: layout.njk
date: ${new Date().toISOString().split('T')[0]}
tags: [${tagsArray.map(tag => `"${tag}"`).join(', ')}]
category: ${post.category}
eleventyExcludeFromCollections: false
---

<article class="post">
  <header class="post-header">
    <div class="post-meta">
      <time datetime="${new Date().toISOString()}">${date}</time>
      <span class="category">${post.category}</span>
      ${tagsArray.length > 0 ? `<div class="post-tags">${tagsArray.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
    </div>
  </header>
  
  ${post.image ? `<div class="post-image"><img src="${post.image}" alt="이미지" /></div>` : ''}
  
  <div class="post-content">
    ${post.content.replace(/\n/g, '\n    ')}
  </div>
</article>

<style>
.post {
  max-width: var(--max-width-content);
  margin: 0 auto;
  padding: var(--spacing-3xl);
}

.post-header {
  margin-bottom: var(--spacing-3xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: 1px solid var(--border-light);
}


.post-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  font-size: var(--font-size-small);
  color: var(--text-secondary);
}

.category {
  background: var(--accent-primary);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-small);
  display: inline-block;
  width: fit-content;
}

.post-tags {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.tag {
  background: var(--bg-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-small);
}

.post-image {
  margin: var(--spacing-xl) 0;
  text-align: center;
}

.post-image img {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius-sm);
}

.post-content {
  line-height: var(--line-height-base);
  color: var(--text-primary);
}

.post-content p {
  margin-bottom: var(--spacing-lg);
}

.post-content h2, .post-content h3, .post-content h4 {
  margin: var(--spacing-xl) 0 var(--spacing-md) 0;
  color: var(--text-primary);
}
</style>`;

    // HTML 파일 다운로드
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${post.category}-${post.filename}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }
  
  
  saveDraft() {
    const content = document.getElementById('post-content').value;
    const tags = document.getElementById('post-tags').value;
    const category = document.getElementById('post-category').value;
    
    // 이미지 URL 가져오기 (미리보기에서)
    const previewImg = document.getElementById('preview-img');
    const image = previewImg && previewImg.src ? previewImg.src : '';
    
    const draft = { 
      content, 
      tags, 
      image, 
      category,
      savedAt: new Date().toISOString() 
    };
    localStorage.setItem('hamster_draft', JSON.stringify(draft));
    alert('임시저장되었습니다.');
  }
  
  loadDraft() {
    const draft = JSON.parse(localStorage.getItem('hamster_draft') || '{}');
    
    if (draft.content) {
      document.getElementById('post-content').value = draft.content || '';
      document.getElementById('post-tags').value = draft.tags || '';
      document.getElementById('post-category').value = draft.category || 'posts';
      
      // 이미지 복원
      if (draft.image) {
        const imagePreview = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');
        const dragDropZone = document.getElementById('drag-drop-zone');
        
        previewImg.src = draft.image;
        imagePreview.style.display = 'block';
        dragDropZone.style.display = 'none';
      }
      
      alert('임시저장된 내용을 불러왔습니다.');
    } else {
      alert('임시저장된 내용이 없습니다.');
    }
  }
  
  showHTMLExport() {
    const posts = JSON.parse(localStorage.getItem('hamster_posts') || '[]');
    
    if (posts.length === 0) {
      alert('저장된 글이 없습니다.');
      return;
    }
    
    let htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>저장된 글 목록</title>
  <style>
    body { font-family: '맑은 고딕', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .post { border-bottom: 1px solid #eee; padding: 20px 0; }
    .post h2 { margin: 0 0 10px 0; color: #333; }
    .post-meta { font-size: 12px; color: #666; margin-bottom: 10px; }
    .post-content { line-height: 1.6; }
    .tags { margin-top: 10px; }
    .tag { background: #f0f0f0; padding: 2px 6px; border-radius: var(--border-radius-sm); font-size: 11px; margin-right: 5px; }
  </style>
</head>
<body>
  <h1>저장된 글 목록 (${posts.length}개)</h1>`;
    
    posts.forEach(post => {
      const date = new Date(post.date).toLocaleDateString('ko-KR');
      htmlContent += `
  <article class="post">
    <div class="post-meta">작성일: ${date} | 카테고리: ${post.category}</div>
    ${post.image ? `<img src="${post.image}" alt="이미지" style="max-width: 100%; height: auto; margin: 10px 0;" />` : ''}
    <div class="post-content">${post.content.replace(/\n/g, '<br>')}</div>
    ${post.tags && post.tags.length > 0 ? `<div class="tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
  </article>`;
    });
    
    htmlContent += `
</body>
</html>`;
    
    // HTML 파일 다운로드
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saved-posts-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert(`저장된 글 목록이 다운로드되었습니다!`);
  }
  
  showTagSuggestions() {
    const posts = JSON.parse(localStorage.getItem('hamster_posts') || '[]');
    const allTags = new Set();
    
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    const suggestionsContainer = document.getElementById('tag-suggestions');
    suggestionsContainer.innerHTML = '';
    
    if (allTags.size > 0) {
      const title = document.createElement('div');
      title.textContent = '기존 태그:';
      title.style.fontSize = 'var(--font-size-small)';
      title.style.color = 'var(--text-secondary)';
      title.style.marginBottom = 'var(--spacing-xs)';
      suggestionsContainer.appendChild(title);
      
      Array.from(allTags).forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag-suggestion';
        tagElement.textContent = tag;
        tagElement.addEventListener('click', () => {
          this.addTagToInput(tag);
        });
        suggestionsContainer.appendChild(tagElement);
      });
    }
  }
  
  addTagToInput(tag) {
    const tagsInput = document.getElementById('post-tags');
    const currentTags = tagsInput.value.trim();
    
    if (currentTags) {
      const tags = currentTags.split(',').map(t => t.trim());
      if (!tags.includes(tag)) {
        tagsInput.value = currentTags + ', ' + tag;
      }
    } else {
      tagsInput.value = tag;
    }
    
    tagsInput.focus();
  }
  
  setupImageUpload() {
    const dragDropZone = document.getElementById('drag-drop-zone');
    const fileInput = document.getElementById('image-file-input');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeImageBtn = document.getElementById('remove-image');
    
    // 드래그앤드랍 이벤트
    dragDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragDropZone.classList.add('dragover');
    });
    
    dragDropZone.addEventListener('dragleave', () => {
      dragDropZone.classList.remove('dragover');
    });
    
    dragDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dragDropZone.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        this.handleImageFile(files[0]);
      }
    });
    
    // 클릭으로 파일 선택
    dragDropZone.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleImageFile(e.target.files[0]);
      }
    });
    
    // 이미지 제거
    removeImageBtn.addEventListener('click', () => {
      imagePreview.style.display = 'none';
      dragDropZone.style.display = 'block';
      previewImg.src = '';
      fileInput.value = '';
    });
  }
  
  handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imagePreview = document.getElementById('image-preview');
      const previewImg = document.getElementById('preview-img');
      const dragDropZone = document.getElementById('drag-drop-zone');
      
      // Data URL로 설정
      previewImg.src = e.target.result;
      imagePreview.style.display = 'block';
      dragDropZone.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
  
  isValidImageUrl(url) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || url.startsWith('data:image/');
  }
  
  openUpdateEditor() {
    const updateText = prompt('새 업데이트 내용을 입력하세요:');
    if (updateText && updateText.trim()) {
      const today = new Date();
      const dateStr = `${today.getFullYear()}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getDate().toString().padStart(2, '0')}`;
      
      const newUpdate = {
        date: dateStr,
        text: updateText.trim()
      };
      
      // 로컬 스토리지에 저장
      const updates = JSON.parse(localStorage.getItem('hamster_updates') || '[]');
      updates.unshift(newUpdate); // 최신 업데이트를 맨 위에 추가
      
      // 최대 10개까지만 저장
      if (updates.length > 10) {
        updates.splice(10);
      }
      
      localStorage.setItem('hamster_updates', JSON.stringify(updates));
      alert('업데이트가 추가되었습니다!');
      
      // i18n.json 파일 업데이트 (실제로는 수동으로 해야 함)
      console.log('i18n.json 파일의 updates 배열을 수동으로 업데이트해주세요:', updates);
    }
  }
  
  manageUpdates() {
    const updates = JSON.parse(localStorage.getItem('hamster_updates') || '[]');
    
    if (updates.length === 0) {
      alert('저장된 업데이트가 없습니다.');
      return;
    }
    
    let updateList = '현재 업데이트 목록:\n\n';
    updates.forEach((update, index) => {
      updateList += `${index + 1}. [${update.date}] ${update.text}\n`;
    });
    
    const action = prompt(`${updateList}\n\n삭제할 번호를 입력하거나 "전체삭제"를 입력하세요:`);
    
    if (action === '전체삭제') {
      if (confirm('정말로 모든 업데이트를 삭제하시겠습니까?')) {
        localStorage.removeItem('hamster_updates');
        alert('모든 업데이트가 삭제되었습니다.');
      }
    } else if (action && !isNaN(action)) {
      const index = parseInt(action) - 1;
      if (index >= 0 && index < updates.length) {
        if (confirm(`"${updates[index].text}" 업데이트를 삭제하시겠습니까?`)) {
          updates.splice(index, 1);
          localStorage.setItem('hamster_updates', JSON.stringify(updates));
          alert('업데이트가 삭제되었습니다.');
        }
      } else {
        alert('잘못된 번호입니다.');
      }
    }
  }
}

// 관리자 패널 초기화
document.addEventListener('DOMContentLoaded', () => {
  new AdminPanel();
});
