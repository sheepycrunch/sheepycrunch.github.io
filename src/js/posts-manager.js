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
      // 로컬 환경: /posts.json 직접 fetch
      console.log('Local environment detected. Fetching from /posts.json');
      
      try {
        response = await fetch('/posts.json');
        console.log('Local fetch response:', response.status);
      } catch (error) {
        console.error('Error fetching from /posts.json:', error);
        // Eleventy 변수로 폴백 시도
        try {
          const posts = window.eleventyPosts || [];
          if (posts && posts.length > 0) {
            posts.forEach(post => {
              const postElement = createPostElement(post);
              dynamicPostsContainer.appendChild(postElement);
            });
            console.log(`Loaded ${posts.length} dynamic posts from Eleventy variable (fallback).`);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback to Eleventy variable also failed:', fallbackError);
        }
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
  console.log('포스트 요소 생성 중, Admin 모드:', isAdminMode, '포스트 ID:', post.id || post.date);
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
  console.log('Admin 모드 확인 중...');
  if (typeof AdminAuth !== 'undefined') {
    const adminAuth = new AdminAuth();
    const isLoggedIn = adminAuth.isAdminLoggedIn();
    console.log('AdminAuth 클래스 존재, 로그인 상태:', isLoggedIn);
    return isLoggedIn;
  }
  console.log('AdminAuth 클래스가 정의되지 않음');
  return false;
}

// 포스트 삭제 함수
async function deletePost(postId) {
  console.log('deletePost 함수 호출됨, postId:', postId);
  
  if (!checkAdminMode()) {
    console.log('관리자 권한이 없어서 삭제 중단');
    alert('관리자 권한이 필요합니다.');
    return;
  }
  
  console.log('관리자 권한 확인됨, 삭제 진행');
  
  // 삭제 확인
  if (!confirm('정말로 이 글을 삭제하시겠습니까?\n\n삭제된 글은 복구할 수 없습니다.\n\nNeocities에 직접 수정사항이 반영됩니다.')) {
    return;
  }
  
  // 로딩 상태 표시
  const deleteBtn = event.target;
  const originalText = deleteBtn.textContent;
  deleteBtn.textContent = '삭제 중...';
  deleteBtn.disabled = true;
  
  try {
    // 1. Neocities에서 posts.json 직접 수정
    console.log('Neocities에서 포스트 삭제 시작...');
    await deletePostFromLocal(postId);
    
     // 2. 관련 이미지 삭제 (토큰이 있을 때만)
     let imageDeleteResult = null;
     const neocitiesApiToken = getNeocitiesApiToken();
     if (neocitiesApiToken) {
       try {
         console.log('관련 이미지 삭제 시작...');
         imageDeleteResult = await deletePostImages(postId);
         if (imageDeleteResult && imageDeleteResult.deleted.length > 0) {
           console.log(`이미지 ${imageDeleteResult.deleted.length}개가 삭제되었습니다.`);
         }
       } catch (error) {
         console.warn('이미지 삭제 중 오류:', error);
       }
     } else {
       console.log('Neocities API 토큰이 없어서 이미지 삭제를 건너뜁니다.');
     }
    
    // 3. UI에서 즉시 제거
    removePostFromUI(postId);
    
     // 4. 성공 메시지 표시
     setTimeout(() => {
       const neocitiesApiToken = getNeocitiesApiToken();
       const message = neocitiesApiToken 
         ? '글이 성공적으로 삭제되었습니다!\n\n✓ 로컬에서 포스트가 삭제되었습니다\n✓ Neocities에 직접 업데이트되었습니다'
         : '글이 성공적으로 삭제되었습니다!\n\n✓ 로컬에서 포스트가 삭제되었습니다\n✓ Neocities API 토큰이 필요합니다';
       alert(message);
     }, 100);
    
  } catch (error) {
    console.error('포스트 삭제 중 오류 발생:', error);
    
    // 에러 타입별 메시지
    let errorMessage = '포스트 삭제 중 오류가 발생했습니다.';
    if (error.message.includes('Neocities API 토큰')) {
      errorMessage = 'Neocities API 토큰이 필요합니다. 관리자에게 문의하세요.';
    } else if (error.message.includes('posts.json을 가져올 수 없습니다')) {
      errorMessage = '로컬에서 posts.json을 가져올 수 없습니다. 파일을 확인하세요.';
    } else if (error.message.includes('업데이트 실패')) {
      errorMessage = 'Neocities에 수정사항을 저장할 수 없습니다. API 토큰을 확인하세요.';
    } else if (error.message.includes('삭제할 포스트를 찾을 수 없습니다')) {
      errorMessage = '삭제할 포스트를 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.';
    } else {
      errorMessage = `오류: ${error.message}`;
    }
    
    alert(errorMessage);
  } finally {
    // 버튼 상태 복원
    deleteBtn.textContent = originalText;
    deleteBtn.disabled = false;
  }
}

// 로컬 posts.json 수정 및 GitHub Actions 트리거
async function deletePostFromLocal(postId) {
  try {
    // 1. 현재 posts.json 내용 가져오기
    console.log('현재 posts.json 가져오는 중...');
    const response = await fetch('/posts.json');
    if (!response.ok) {
      throw new Error('posts.json을 불러올 수 없습니다.');
    }
    
    const data = await response.json();
    const existingPosts = data.posts || [];
    
    console.log('현재 포스트들:', existingPosts.map(p => ({ id: p.id, date: p.date })));
    console.log('삭제할 포스트 ID:', postId);
    
    // 포스트 찾기 및 삭제
    const filteredPosts = existingPosts.filter(post => {
      const postIdentifier = post.id || post.date;
      const postIdStr = String(postIdentifier);
      const targetIdStr = String(postId);
      console.log(`포스트 비교: "${postIdStr}" !== "${targetIdStr}" = ${postIdStr !== targetIdStr}`);
      return postIdStr !== targetIdStr;
    });
    
    console.log(`원본 포스트 수: ${existingPosts.length}, 필터링 후: ${filteredPosts.length}`);
    
    if (filteredPosts.length === existingPosts.length) {
      throw new Error(`삭제할 포스트를 찾을 수 없습니다. (ID: ${postId})`);
    }

     // 2. 로컬 스토리지에 업데이트된 포스트 저장
     const updatedContent = { posts: filteredPosts };
     localStorage.setItem('hamster_posts', JSON.stringify(filteredPosts));
     console.log('로컬 스토리지에 업데이트된 포스트 저장됨');
     
     // 3. Neocities에 직접 posts.json 업데이트 (토큰이 있을 때만)
     const neocitiesApiToken = getNeocitiesApiToken();
     if (neocitiesApiToken) {
       try {
         await updateNeocitiesPostsJson(filteredPosts);
         console.log('Neocities에 posts.json이 업데이트되었습니다.');
       } catch (error) {
         console.warn('Neocities 업데이트 실패:', error);
         // Neocities 업데이트 실패해도 삭제는 계속 진행
       }
     } else {
       console.log('Neocities API 토큰이 없어서 Neocities 업데이트를 건너뜁니다.');
       console.log('로컬에서만 삭제되고, GitHub 푸시 시 Neocities에 자동 동기화됩니다.');
     }
     
     // 4. Neocities API를 통한 직접 업데이트
     await triggerDeployment();
     
     console.log('포스트 삭제가 완료되었습니다.');
    
  } catch (error) {
    console.error('포스트 삭제 오류:', error);
    throw error;
  }
}

// GitHub API는 더 이상 사용하지 않음 (Neocities API만 사용)

// Neocities API를 사용하여 posts.json 업데이트
async function triggerDeployment() {
  try {
    console.log('Neocities API를 사용하여 posts.json 업데이트 시도 중...');
    
    // 로컬 posts.json 파일 업데이트
    const localPosts = JSON.parse(localStorage.getItem('hamster_posts') || '[]');
    
    // Neocities API 토큰 확인
    const neocitiesApiToken = getNeocitiesApiToken();
    if (!neocitiesApiToken) {
      console.warn('Neocities API 토큰이 없어서 로컬에서만 업데이트합니다.');
      
      // 로컬 스토리지에 삭제 요청 저장 (수동 푸시용)
      const deletionRequest = {
        action: 'delete_post',
        timestamp: new Date().toISOString(),
        posts: localPosts
      };
      localStorage.setItem('pending_deletion', JSON.stringify(deletionRequest));
      
      alert('Neocities API 토큰이 없어서 로컬에서만 삭제되었습니다.\nNeocities API 토큰을 설정해야 합니다.');
      return;
    }
    
    try {
      // Neocities에 posts.json 업데이트
      await updateNeocitiesPostsJson(localPosts);
      console.log('Neocities에 posts.json이 성공적으로 업데이트되었습니다.');
      
      // 성공 메시지
      alert('글이 성공적으로 삭제되었습니다!\n\n✓ 로컬에서 포스트가 삭제되었습니다\n✓ Neocities에 직접 업데이트되었습니다');
      
    } catch (neocitiesError) {
      console.warn('Neocities 업데이트 실패:', neocitiesError);
      
      // 로컬 스토리지에 삭제 요청 저장 (수동 푸시용)
      const deletionRequest = {
        action: 'delete_post',
        timestamp: new Date().toISOString(),
        posts: localPosts
      };
      localStorage.setItem('pending_deletion', JSON.stringify(deletionRequest));
      
      alert('Neocities 업데이트 실패로 로컬에서만 삭제되었습니다.\nNeocities API 토큰을 확인하세요.');
    }
    
  } catch (error) {
    console.error('업데이트 실패:', error);
    alert('업데이트 중 오류가 발생했습니다.');
  }
}

// Neocities는 GitHub Actions를 통해 자동으로 동기화됨

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

// Neocities에서 이미지 삭제 (직접 API 사용)
async function deleteImageFromNeocities(imagePath) {
  const token = getNeocitiesApiToken();
  if (!token) {
    throw new Error('Neocities API 토큰이 없습니다.');
  }

  // 이미지 경로에서 파일명 추출
  let fileName = imagePath;
  if (imagePath.includes('/')) {
    fileName = imagePath.split('/').pop();
  }
  
  console.log(`Neocities API를 직접 사용하여 이미지 삭제 시도: ${fileName} (원본 경로: ${imagePath})`);
  
  // FormData 생성
  const formData = new FormData();
  formData.append('filenames[]', fileName);
  
  // Neocities API로 직접 파일 삭제
  const response = await fetch('https://neocities.org/api/delete', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
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

// Neocities API 토큰 가져오기 (직접 API 사용)
function getNeocitiesApiToken() {
  // 환경변수에서 토큰 가져오기 (빌드 시 주입됨)
  const token = window.NEOCITIES_API_KEY;
  if (!token) {
    console.error('Neocities API 토큰이 설정되지 않았습니다.');
    return null;
  }
  console.log('Neocities API 직접 사용');
  return token;
}

// Neocities에 posts.json 업데이트 (직접 API 사용)
async function updateNeocitiesPostsJson(posts) {
  const token = getNeocitiesApiToken();
  if (!token) {
    throw new Error('Neocities API 토큰이 없습니다.');
  }

  // posts.json 내용 생성
  const postsJsonContent = JSON.stringify({ posts }, null, 2);
  
  // FormData 생성
  const formData = new FormData();
  const blob = new Blob([postsJsonContent], { type: 'application/json' });
  formData.append('posts.json', blob, 'posts.json');
  
  console.log('Neocities API를 직접 사용하여 posts.json 업로드 중...');
  
  // Neocities API로 직접 파일 업로드
  const response = await fetch('https://neocities.org/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
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
