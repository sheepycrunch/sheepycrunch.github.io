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
  
  
  postDiv.innerHTML = `
    <div class="post-content">
      <div class="post-text">${contentHtml}</div>
      <div class="post-footer">
        <div class="post-meta">${post.date}</div>
        ${post.tags ? `<div class="post-tags">${tagButtons}</div>` : ''}
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



// 로컬 posts.json 수정 및 GitHub Actions 트리거
async function deletePostFromLocal(postId) {
  try {
    // 1. 현재 posts.json 내용 가져오기
    console.log('Loading current posts.json...');
    const response = await fetch('/posts.json');
    if (!response.ok) {
      throw new Error('posts.json을 불러올 수 없습니다.');
    }
    
    const data = await response.json();
    const existingPosts = data.posts || [];
    
    console.log('Current posts:', existingPosts.map(p => ({ id: p.id, date: p.date })));
    console.log('Post ID to delete:', postId);
    
    // 포스트 찾기 및 삭제
    const filteredPosts = existingPosts.filter(post => {
      const postIdentifier = post.id || post.date;
      const postIdStr = String(postIdentifier);
      const targetIdStr = String(postId);
      console.log(`Post comparison: "${postIdStr}" !== "${targetIdStr}" = ${postIdStr !== targetIdStr}`);
      return postIdStr !== targetIdStr;
    });
    
    console.log(`Original post count: ${existingPosts.length}, after filtering: ${filteredPosts.length}`);
    
    if (filteredPosts.length === existingPosts.length) {
      throw new Error(`삭제할 포스트를 찾을 수 없습니다. (ID: ${postId})`);
    }

     // 2. 로컬 스토리지에 업데이트된 포스트 저장
     const updatedContent = { posts: filteredPosts };
     localStorage.setItem('hamster_posts', JSON.stringify(filteredPosts));
     console.log('Updated posts saved to local storage');
     
     // 3. Neocities에 직접 posts.json 업데이트 (토큰이 있을 때만)
     const neocitiesApiToken = getNeocitiesApiToken();
     if (neocitiesApiToken) {
       try {
         await updateNeocitiesPostsJson(filteredPosts);
         console.log('posts.json has been updated on Neocities.');
       } catch (error) {
         console.warn('Neocities update failed:', error);
         // Neocities 업데이트 실패해도 삭제는 계속 진행
       }
     } else {
       console.log('No Neocities API token, skipping Neocities update.');
       console.log('Deleted locally only, will auto-sync to Neocities on GitHub push.');
     }
     
     // 4. Neocities API를 통한 직접 업데이트
     await triggerDeployment();
     
     console.log('Post deletion completed.');
    
  } catch (error) {
    console.error('Post deletion error:', error);
    throw error;
  }
}

// GitHub API는 더 이상 사용하지 않음 (Neocities API만 사용)

// Neocities API를 사용하여 posts.json 업데이트
async function triggerDeployment() {
  try {
    console.log('Attempting to update posts.json using Neocities API...');
    
    // 로컬 posts.json 파일 업데이트
    const localPosts = JSON.parse(localStorage.getItem('hamster_posts') || '[]');
    
    // Neocities API 토큰 확인
    const neocitiesApiToken = getNeocitiesApiToken();
    if (!neocitiesApiToken) {
      console.warn('No Neocities API token, updating locally only.');
      
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
      console.log('posts.json successfully updated on Neocities.');
      
      // 성공 메시지
      alert('글이 성공적으로 삭제되었습니다!\n\n✓ 로컬에서 포스트가 삭제되었습니다\n✓ Neocities에 직접 업데이트되었습니다');
      
    } catch (neocitiesError) {
      console.warn('Neocities update failed:', neocitiesError);
      
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
    console.error('Update failed:', error);
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
      console.warn('Cannot load posts.json, skipping image deletion.');
      return;
    }
    
    const data = await response.json();
    const posts = data.posts || [];
    const post = posts.find(p => String(p.id || p.date) === String(postId));
    
    if (!post || !post.description) {
      console.log('Post to delete not found.');
      return;
    }
    
    // Quill 콘텐츠에서 이미지 경로 추출
    const imagePaths = extractImagePaths(post.description);
    console.log('Extracted image paths:', imagePaths);
    
    if (imagePaths.length === 0) {
      console.log('No images to delete.');
      return;
    }
    
    // 각 이미지 삭제
    let deletedImages = [];
    let failedImages = [];
    
    for (const imagePath of imagePaths) {
      try {
        await deleteImageFromNeocities(imagePath);
        deletedImages.push(imagePath);
        console.log(`Image deletion successful: ${imagePath}`);
      } catch (error) {
        failedImages.push(imagePath);
        console.warn(`Image deletion failed: ${imagePath}`, error);
      }
    }
    
    // 삭제 결과 요약
    if (deletedImages.length > 0) {
      console.log(`Successfully deleted images: ${deletedImages.length}`);
    }
    if (failedImages.length > 0) {
      console.warn(`Failed to delete images: ${failedImages.length}`);
    }
    
    return {
      deleted: deletedImages,
      failed: failedImages,
      total: imagePaths.length
    };
    
  } catch (error) {
    console.error('Image deletion error:', error);
  }
}

// Neocities에서 이미지 삭제 (자동 업로드 스크립트 사용)
async function deleteImageFromNeocities(imagePath) {
  // 자동 업로드 스크립트가 처리하므로 로컬에서만 삭제
  console.log('Images deleted locally. Auto-upload script will handle it.');
  return;
}

// Neocities API 토큰 가져오기 (직접 API 사용)
function getNeocitiesApiToken() {
  // 환경변수에서 토큰 가져오기 (빌드 시 주입됨)
  const token = window.NEOCITIES_API_KEY;
  if (!token) {
    console.error('Neocities API token is not set.');
    return null;
  }
  console.log('Using Neocities API directly');
  return token;
}

// Neocities에 posts.json 업데이트 (자동 업로드 스크립트 사용)
async function updateNeocitiesPostsJson(posts) {
  // 자동 업로드 스크립트가 처리하므로 로컬 파일만 저장
  console.log('posts.json saved locally. Auto-upload script will handle it.');
  return;
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
  console.log('Attempting to remove post from UI:', postId);
  
  // 동적 포스트에서 제거
  const dynamicPosts = document.querySelectorAll('#dynamic-posts .post-item[data-post-id="' + postId + '"]');
  console.log('Dynamic posts found:', dynamicPosts.length);
  dynamicPosts.forEach(post => {
    console.log('Removing dynamic post:', post);
    post.remove();
  });
  
  // 모든 포스트에서 제거 (동적 + 정적)
  const allPosts = document.querySelectorAll('.post-item[data-post-id="' + postId + '"]');
  console.log('All posts found:', allPosts.length);
  allPosts.forEach(post => {
    console.log('Removing post:', post);
    post.remove();
  });
  
  // 정적 포스트에서 제거 (페이지 새로고침 필요)
  const staticPosts = document.querySelectorAll('.post-item[data-post-id="' + postId + '"]');
  console.log('Static posts found:', staticPosts.length);
  
  if (staticPosts.length > 0) {
    console.log('Static posts exist, refreshing page');
    // 정적 포스트가 있는 경우 페이지 새로고침
    window.location.reload();
  } else {
    console.log('No static posts, not refreshing');
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
  
}


// 페이지 로드 시 정적 포스트 변환 및 동적 포스트 로드
document.addEventListener('DOMContentLoaded', function() {
  convertStaticPosts();
  loadDynamicPosts();
});
