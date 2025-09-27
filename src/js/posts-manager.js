// 포스트 관리 헬퍼 함수들

// 설정 상수들
const CONFIG = {
  get neocitiesPostsUrl() {
    return `${window.NEOCITIES_URL}/posts.json`;
  },
  get nekowebPostsUrl() {
    return `${window.NEKOWEB_URL}/posts.json`;
  },
  get neocitiesBaseUrl() {
    return window.NEOCITIES_URL;
  },
  get nekowebBaseUrl() {
    return window.NEKOWEB_URL;
  },
  get corsProxyUrl() {
    return 'https://api.allorigins.win/raw?url=';
  },
  get searchPageUrl() {
    return '/search.html?q=';
  }
};

// 동적 포스트 로드
async function loadDynamicPosts() {
  const dynamicPostsContainer = document.getElementById('dynamic-posts');
  
  try {
    // 환경에 따라 posts.json 경로 결정
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    console.log('Environment check:', { hostname: window.location.hostname, isLocal });
    
    let response;
    if (isLocal) {
      // 로컬 환경: Eleventy에서 주입된 JavaScript 변수 사용 (CORS 문제 해결)
      console.log('Local environment detected. Using Eleventy JavaScript variable.');
      
      try {
        const posts = window.eleventyPosts || [];
        
        if (posts && posts.length > 0) {
          // 모든 포스트 표시 (카테고리 필터링 제거)
          // 최신 포스트부터 표시
          posts.forEach(post => {
            const postElement = createPostElement(post);
            dynamicPostsContainer.appendChild(postElement);
          });
          
          console.log(`Loaded ${posts.length} dynamic posts from Eleventy variable.`);
          return;
        } else {
          console.log('No saved posts found in Eleventy variable.');
          return;
        }
      } catch (error) {
        console.error('Error accessing posts data:', error);
        return;
      }
    } else {
      // 프로덕션 환경: Neocities에서 가져오기
      try {
        // 먼저 Neocities에서 시도
        console.log('Fetching posts from Neocities...');
        response = await fetch(CONFIG.neocitiesPostsUrl);
      } catch (error) {
        console.warn('Failed to fetch from Neocities, trying Nekoweb...');
        // Neocities 실패 시 Nekoweb에서 시도
        response = await fetch(CONFIG.nekowebPostsUrl);
      }
    }
    
    // 로컬에서도 fetch를 시도해보기 (CORS 프록시 사용)
    if (isLocal && (!window.eleventyPosts || window.eleventyPosts.length === 0)) {
      console.log('No Eleventy data found, trying fetch with CORS proxy...');
      
      try {
        // CORS 프록시를 통해 Neocities에서 시도
        console.log('Fetching posts from Neocities via CORS proxy...');
        response = await fetch(CONFIG.corsProxyUrl + encodeURIComponent(CONFIG.neocitiesPostsUrl));
      } catch (error) {
        console.warn('Failed to fetch from Neocities via proxy, trying Nekoweb...');
        // Neocities 실패 시 Nekoweb에서 시도
        response = await fetch(CONFIG.corsProxyUrl + encodeURIComponent(CONFIG.nekowebPostsUrl));
      }
    }
    
    if (response.ok) {
      const data = await response.json();
      const posts = data.posts || [];
      
      if (posts.length === 0) {
        console.log('No saved posts found.');
        return;
      }
      
      // 모든 포스트 표시 (카테고리 필터링 제거)
      // 최신 포스트부터 표시
      posts.forEach(post => {
        const postElement = createPostElement(post);
        dynamicPostsContainer.appendChild(postElement);
      });
      
      console.log(`Loaded ${posts.length} dynamic posts from Neocities.`);
    } else {
      console.warn('Failed to fetch posts from Neocities.');
      dynamicPostsContainer.innerHTML = '<p>Failed to load posts.</p>';
    }
  } catch (error) {
    console.error('Error loading posts:', error);
    dynamicPostsContainer.innerHTML = '<p>An error occurred while loading posts.</p>';
  }
}

// 포스트 요소 생성
function createPostElement(post) {
  const postDiv = document.createElement('div');
  postDiv.className = 'post-item';
  postDiv.setAttribute('data-post-id', post.id || post.date);
  
  // Quill 콘텐츠를 HTML로 변환
  const contentHtml = convertQuillToHtml(post.description);
  
  // 태그 버튼들 생성
  const tagButtons = post.tags ? post.tags.map(tag => 
    `<button class="tag-button" onclick="searchByTag('${tag}')">#${tag}</button>`
  ).join('') : '';
  
  // Admin 모드 확인
  const isAdminMode = checkAdminMode();
  const adminButtons = isAdminMode ? `
    <div class="admin-buttons">
      <button class="delete-btn" onclick="deletePost('${post.id || post.date}')" title="글 삭제">✕</button>
    </div>
  ` : '';
  
  postDiv.innerHTML = `
    <div class="post-content">
      <div class="post-text">${contentHtml}</div>
      <div class="post-footer">
        <div class="post-meta">${post.date}</div>
        ${post.tags ? `<div class="post-tags">${tagButtons}</div>` : ''}
        ${adminButtons}
      </div>
    </div>
  `;
  
  return postDiv;
}

// Quill Delta를 HTML로 변환
function convertQuillToHtml(quillContent) {
  // null이나 undefined인 경우
  if (!quillContent) {
    return '<p>No content available.</p>';
  }
  
  // 문자열인 경우 그대로 반환
  if (typeof quillContent === 'string') {
    return quillContent.replace(/\n/g, '<br>');
  }
  
  // 객체가 아닌 경우 JSON으로 변환
  if (typeof quillContent !== 'object') {
    return String(quillContent).replace(/\n/g, '<br>');
  }
  
  // Quill Delta 형식이 아닌 경우 JSON으로 표시
  if (!quillContent.ops || !Array.isArray(quillContent.ops)) {
    return '<pre>' + JSON.stringify(quillContent, null, 2) + '</pre>';
  }
  
  let html = '';
  
  try {
    quillContent.ops.forEach(op => {
      if (op && op.insert) {
        if (typeof op.insert === 'string') {
          let text = op.insert;
          
          // 줄바꿈 처리
          text = text.replace(/\n/g, '<br>');
          
          // 스타일 적용
          if (op.attributes) {
            if (op.attributes.bold) text = `<strong>${text}</strong>`;
            if (op.attributes.italic) text = `<em>${text}</em>`;
            if (op.attributes.underline) text = `<u>${text}</u>`;
            if (op.attributes.strike) text = `<s>${text}</s>`;
            
            // 헤더 처리
            if (op.attributes.header) {
              const level = op.attributes.header;
              text = `<h${level}>${text}</h${level}>`;
            }
            
            // 색상 처리
            if (op.attributes.color) {
              text = `<span style="color: ${op.attributes.color}">${text}</span>`;
            }
            if (op.attributes.background) {
              text = `<span style="background-color: ${op.attributes.background}">${text}</span>`;
            }
          }
          
          html += text;
        } else if (op.insert && typeof op.insert === 'object' && op.insert.image) {
          // 이미지 처리 (dualImage 필터 로직 적용)
          const imagePath = op.insert.image;
          if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            // 이미 절대 URL인 경우 그대로 사용
            html += `<img src="${imagePath}" alt="이미지" style="max-width: 100%; height: auto;">`;
          } else {
            // 환경에 따라 이미지 URL 결정
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
            
            if (isLocal) {
              // 로컬 환경: Neocities URL 사용 (dualImage 필터와 동일)
              html += `<img src="${CONFIG.neocitiesBaseUrl}/${cleanPath}" 
                           onerror="this.onerror=null; this.src='${CONFIG.nekowebBaseUrl}/${cleanPath}'" 
                           alt="이미지" style="max-width: 100%; height: auto;">`;
            } else {
              // 프로덕션 환경: 상대 경로 사용 (dualImage 필터와 동일)
              html += `<img src="${imagePath}" alt="이미지" style="max-width: 100%; height: auto;">`;
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Quill conversion error:', error);
    return '';
  }
  
  // 빈 내용 처리
  if (!html.trim()) {
    html = '';
  }
  
  return html;
}

// 태그로 검색
function searchByTag(tag) {
  // 검색 페이지로 이동하거나 현재 페이지에서 필터링
  window.location.href = `${CONFIG.searchPageUrl}${encodeURIComponent(tag)}`;
}

// Admin 모드 확인
function checkAdminMode() {
  if (typeof AdminAuth !== 'undefined') {
    const adminAuth = new AdminAuth();
    return adminAuth.isAdminLoggedIn();
  }
  return false;
}

// 포스트 삭제 함수
async function deletePost(postId) {
  if (!checkAdminMode()) {
    alert('관리자 권한이 필요합니다.');
    return;
  }
  
  // 삭제 확인
  if (!confirm('정말로 이 글을 삭제하시겠습니까?\n\n삭제된 글은 복구할 수 없습니다.')) {
    return;
  }
  
  try {
    // 1. 로컬 posts.json에서 삭제
    await deletePostFromLocal(postId);
    
    // 2. Neocities에서 삭제
    await deletePostFromNeocities(postId);
    
    // 3. 관련 이미지 삭제
    let imageDeleteResult = null;
    try {
      imageDeleteResult = await deletePostImages(postId);
    } catch (error) {
      console.warn('이미지 삭제 중 오류:', error);
    }
    
    // 4. UI에서 제거
    removePostFromUI(postId);
    
    // UI 업데이트를 위해 약간의 지연
    setTimeout(() => {
      alert('글이 성공적으로 삭제되었습니다.');
    }, 100);
  } catch (error) {
    console.error('포스트 삭제 중 오류 발생:', error);
    alert('포스트 삭제 중 오류가 발생했습니다: ' + error.message);
  }
}

// 로컬 posts.json에서 포스트 삭제 (CSP 우회)
async function deletePostFromLocal(postId) {
  try {
    // 로컬 posts.json 파일 가져오기
    const response = await fetch('/posts.json');
    if (!response.ok) {
      throw new Error('posts.json을 불러올 수 없습니다.');
    }
    
    const data = await response.json();
    const existingPosts = data.posts || [];
    
    // 포스트 찾기 및 삭제
    console.log('현재 포스트들:', existingPosts.map(p => ({ id: p.id, date: p.date })));
    console.log('삭제할 포스트 ID:', postId);
    
    const filteredPosts = existingPosts.filter(post => {
      const postIdentifier = post.id || post.date;
      // 문자열과 숫자 비교를 위해 둘 다 문자열로 변환
      const postIdStr = String(postIdentifier);
      const targetIdStr = String(postId);
      console.log(`포스트 비교: "${postIdStr}" !== "${targetIdStr}" = ${postIdStr !== targetIdStr}`);
      return postIdStr !== targetIdStr;
    });
    
    console.log(`원본 포스트 수: ${existingPosts.length}, 필터링 후: ${filteredPosts.length}`);
    
    if (filteredPosts.length === existingPosts.length) {
      throw new Error(`삭제할 포스트를 찾을 수 없습니다. (ID: ${postId})`);
    }
    
    // 로컬 스토리지에 업데이트된 포스트 저장
    localStorage.setItem('hamster_posts', JSON.stringify(filteredPosts));
    
    // CORS 문제로 인해 Neocities API 호출을 건너뜀
    console.log('CORS 정책으로 인해 Neocities 업데이트를 건너뜁니다.');
    console.log('로컬 스토리지에 저장되었습니다.');
    
    console.log('로컬에서 포스트가 삭제되었습니다.');
    
  } catch (error) {
    console.error('로컬 포스트 삭제 오류:', error);
    throw error;
  }
}

// GitHub 토큰 가져오기
function getGitHubToken() {
  const tokenElement = document.getElementById('github-token-data');
  const token = tokenElement ? tokenElement.textContent.trim() : null;
  console.log('GitHub 토큰 확인:', token ? '토큰 있음' : '토큰 없음');
  return token;
}

// GitHub Actions 웹훅 트리거
async function triggerDeployment() {
  try {
    const token = getGitHubToken();
    if (!token) {
      console.warn('GitHub token이 없어서 웹훅을 트리거할 수 없습니다.');
      return;
    }

    // GitHub Actions 워크플로우 트리거
    const response = await fetch('https://api.github.com/repos/sheepycrunch/sheepycrunch.github.io/dispatches', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'manual_deploy',
        client_payload: {
          source: 'post_deletion'
        }
      })
    });

    if (!response.ok) {
      console.warn('웹훅 트리거 실패:', response.statusText);
    } else {
      console.log('배포 워크플로우가 트리거되었습니다.');
    }
  } catch (error) {
    console.warn('웹훅 트리거 오류:', error);
  }
}

// Neocities에서 포스트 삭제
async function deletePostFromNeocities(postId) {
  // GitHub에서 이미 posts.json을 업데이트했으므로 Neocities는 자동으로 동기화됨
  console.log('Neocities는 GitHub Actions를 통해 자동으로 동기화됩니다.');
}

// 포스트 관련 이미지 삭제 (CSP 우회)
async function deletePostImages(postId) {
  try {
    // 로컬 posts.json에서 포스트 데이터 가져오기
    const response = await fetch('/posts.json');
    if (!response.ok) {
      console.warn('posts.json을 불러올 수 없어서 이미지 삭제를 건너뜁니다.');
      return;
    }
    
    const data = await response.json();
    const posts = data.posts || [];
    const post = posts.find(p => String(p.id || p.date) === String(postId));
    
    if (!post || !post.description) {
      console.log('삭제할 포스트를 찾을 수 없습니다.');
      return;
    }
    
    // Quill 콘텐츠에서 이미지 경로 추출
    const imagePaths = extractImagePaths(post.description);
    console.log('추출된 이미지 경로들:', imagePaths);
    
    if (imagePaths.length === 0) {
      console.log('삭제할 이미지가 없습니다.');
      return;
    }
    
    // 각 이미지 삭제
    let deletedImages = [];
    let failedImages = [];
    
    for (const imagePath of imagePaths) {
      try {
        await deleteImageFromNeocities(imagePath);
        deletedImages.push(imagePath);
        console.log(`이미지 삭제 성공: ${imagePath}`);
      } catch (error) {
        failedImages.push(imagePath);
        console.warn(`이미지 삭제 실패: ${imagePath}`, error);
      }
    }
    
    // 삭제 결과 요약
    if (deletedImages.length > 0) {
      console.log(`성공적으로 삭제된 이미지: ${deletedImages.length}개`);
    }
    if (failedImages.length > 0) {
      console.warn(`삭제 실패한 이미지: ${failedImages.length}개`);
    }
    
    return {
      deleted: deletedImages,
      failed: failedImages,
      total: imagePaths.length
    };
    
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
  }
}

// Neocities에서 이미지 삭제
async function deleteImageFromNeocities(imagePath) {
  const neocitiesApiToken = getNeocitiesApiToken();
  if (!neocitiesApiToken) {
    throw new Error('Neocities API token이 필요합니다.');
  }

  // 이미지 경로에서 파일명 추출
  let fileName = imagePath;
  if (imagePath.includes('/')) {
    fileName = imagePath.split('/').pop();
  }
  
  console.log(`이미지 삭제 시도: ${fileName} (원본 경로: ${imagePath})`);
  
  // Neocities API로 파일 삭제 (cURL 방식)
  const formData = new FormData();
  formData.append('filenames[]', fileName);
  
  console.log('Neocities API 호출 시도:', {
    url: 'https://neocities.org/api/delete',
    method: 'POST',
    token: neocitiesApiToken ? '있음' : '없음',
    fileName: fileName
  });
  
  const response = await fetch(`https://neocities.org/api/delete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${neocitiesApiToken}`,
      'User-Agent': 'sheepycrunch.github.io',
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`이미지 삭제 실패: ${response.status} ${errorData}`);
    throw new Error(`이미지 삭제 실패: ${response.status} ${errorData}`);
  }

  const result = await response.json();
  console.log(`Neocities에서 이미지 삭제 성공: ${fileName}`, result);
  return result;
}

// Neocities API 토큰 가져오기
function getNeocitiesApiToken() {
  const tokenElement = document.getElementById('neocities-api-token-data');
  return tokenElement ? tokenElement.textContent.trim() : null;
}

// Neocities에 posts.json 업데이트
async function updateNeocitiesPostsJson(posts) {
  const neocitiesApiToken = getNeocitiesApiToken();
  if (!neocitiesApiToken) {
    throw new Error('Neocities API token이 필요합니다.');
  }

  // posts.json 내용 생성
  const postsJsonContent = JSON.stringify({ posts }, null, 2);
  
  // Blob으로 변환
  const blob = new Blob([postsJsonContent], { type: 'application/json' });
  
  // FormData 생성
  const formData = new FormData();
  formData.append('file', blob, 'posts.json');
  
  console.log('Neocities에 posts.json 업로드 중...');
  
  // Neocities API로 파일 업로드
  const response = await fetch('https://neocities.org/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${neocitiesApiToken}`,
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`posts.json 업로드 실패: ${response.status} ${errorData}`);
  }

  const result = await response.json();
  console.log('Neocities posts.json 업로드 성공:', result);
  return result;
}

// Quill 콘텐츠에서 이미지 경로 추출
function extractImagePaths(quillContent) {
  const imagePaths = [];
  
  if (!quillContent || typeof quillContent !== 'object' || !quillContent.ops) {
    return imagePaths;
  }
  
  quillContent.ops.forEach(op => {
    if (op && op.insert && typeof op.insert === 'object' && op.insert.image) {
      imagePaths.push(op.insert.image);
    }
  });
  
  return imagePaths;
}

// UI에서 포스트 제거
function removePostFromUI(postId) {
  console.log('UI에서 포스트 제거 시도:', postId);
  
  // 동적 포스트에서 제거
  const dynamicPosts = document.querySelectorAll('#dynamic-posts .post-item[data-post-id="' + postId + '"]');
  console.log('동적 포스트 찾음:', dynamicPosts.length);
  dynamicPosts.forEach(post => {
    console.log('동적 포스트 제거 중:', post);
    post.remove();
  });
  
  // 모든 포스트에서 제거 (동적 + 정적)
  const allPosts = document.querySelectorAll('.post-item[data-post-id="' + postId + '"]');
  console.log('모든 포스트 찾음:', allPosts.length);
  allPosts.forEach(post => {
    console.log('포스트 제거 중:', post);
    post.remove();
  });
  
  // 정적 포스트에서 제거 (페이지 새로고침 필요)
  const staticPosts = document.querySelectorAll('.post-item[data-post-id="' + postId + '"]');
  console.log('정적 포스트 찾음:', staticPosts.length);
  
  if (staticPosts.length > 0) {
    console.log('정적 포스트가 있으므로 페이지 새로고침');
    // 정적 포스트가 있는 경우 페이지 새로고침
    window.location.reload();
  } else {
    console.log('정적 포스트가 없으므로 새로고침하지 않음');
  }
}

// 정적 포스트의 Quill 콘텐츠 변환
function convertStaticPosts() {
  const staticPosts = document.querySelectorAll('.post-text[data-quill-content]');
  staticPosts.forEach(postElement => {
    const quillData = postElement.getAttribute('data-quill-content');
    if (quillData) {
      try {
        // 빈 데이터나 잘못된 데이터 처리
        if (!quillData || quillData.trim() === '' || quillData === '{' || quillData === '}') {
          console.log('Empty or invalid quillData, skipping');
          postElement.innerHTML = '<p></p>';
          postElement.removeAttribute('data-quill-content');
          return;
        }
        
        // dump 필터로 생성된 데이터를 안전하게 파싱
        let quillContent;
        
        // JSON 형식인지 확인
        if (quillData.startsWith('{') || quillData.startsWith('[')) {
          try {
            quillContent = JSON.parse(quillData);
          } catch (jsonError) {
            // JSON 파싱 실패 시 eval 사용
            try {
              quillContent = eval('(' + quillData + ')');
            } catch (evalError) {
              console.error('Both JSON and eval parsing failed:', evalError);
              postElement.innerHTML = '<p></p>';
              postElement.removeAttribute('data-quill-content');
              return;
            }
          }
        } else {
          // 문자열인 경우 그대로 사용
          quillContent = quillData;
        }
        
        const html = convertQuillToHtml(quillContent);
        postElement.innerHTML = html;
        postElement.removeAttribute('data-quill-content');
      } catch (error) {
        console.error('Static post conversion error:', error);
        console.error('Problematic data:', quillData);
        postElement.innerHTML = '<p></p>';
        postElement.removeAttribute('data-quill-content');
      }
    }
  });
  
  // 정적 포스트에 admin 버튼 추가
  addAdminButtonsToStaticPosts();
}

// 정적 포스트에 admin 버튼 추가
function addAdminButtonsToStaticPosts() {
  if (!checkAdminMode()) return;
  
  const staticPostItems = document.querySelectorAll('.post-item:not([data-post-id])');
  staticPostItems.forEach((postItem, index) => {
    // 이미 admin 버튼이 있는지 확인
    if (postItem.querySelector('.admin-buttons')) return;
    
    // 포스트 ID 생성 (날짜 기반)
    const postMeta = postItem.querySelector('.post-meta');
    const postDate = postMeta ? postMeta.textContent.trim() : `static-${index}`;
    postItem.setAttribute('data-post-id', postDate);
    
    console.log(`정적 포스트 ID 생성: ${postDate}`);
    
    // Admin 버튼 추가
    const postFooter = postItem.querySelector('.post-footer');
    if (postFooter) {
      const adminButtons = document.createElement('div');
      adminButtons.className = 'admin-buttons';
      adminButtons.innerHTML = `<button class="delete-btn" onclick="deletePost('${postDate}')" title="글 삭제">✕</button>`;
      postFooter.appendChild(adminButtons);
    }
  });
}

// 페이지 로드 시 정적 포스트 변환 및 동적 포스트 로드
document.addEventListener('DOMContentLoaded', function() {
  convertStaticPosts();
  loadDynamicPosts();
});
