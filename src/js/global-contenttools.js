// ContentTools 전역 설정 및 초기화
(function() {
  'use strict';

  let editor;
  let isInitialized = false;

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const AUTO_SAVE_DELAY = 2000; // 2초 후 자동 저장
  let autoSaveTimer = null;
  let isImageUploaderRegistered = false;

  // 갤러리 상태 관리
  let galleryState = { 
    items: [], 
    isLoaded: false 
  };

  // 자동 저장 스케줄링 함수
  function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      if (editor && isInitialized) {
        console.log('자동 저장 실행');
        editor.save(true); // 이벤트만 발동시키므로 기존 handleSaveEvent 로직 재사용
      }
    }, AUTO_SAVE_DELAY);
  }

  function uploadImageToServer(fileName, fileType, dataUrl) {
    return fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: fileName,
        type: fileType,
        dataUrl: dataUrl
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('이미지 업로드 요청이 실패했습니다.');
      }
      return response.json();
    })
    .then(result => {
      if (!result.success) {
        throw new Error(result.message || result.error || '이미지 업로드에 실패했습니다.');
      }
      return result;
    });
  }

  // 갤러리 이미지 목록 가져오기
  function fetchGallery() {
    return fetch('/api/list-uploads')
      .then(response => {
        if (!response.ok) {
          throw new Error('갤러리 목록을 불러오지 못했습니다.');
        }
        return response.json();
      })
      .then(result => {
        if (!result.success) {
          throw new Error(result.error || '갤러리 목록을 불러오지 못했습니다.');
        }
        galleryState.items = result.images || [];
        galleryState.isLoaded = true;
        return galleryState.items;
      });
  }

  // 갤러리 UI 빌드
  function buildGallery(dialog) {
    const domView = dialog._domView;
    if (!domView) return;

    // 기존 갤러리 제거
    const existingGallery = domView.querySelector('.ct-image-gallery');
    if (existingGallery) {
      existingGallery.remove();
    }

    // 갤러리 컨테이너 생성
    const galleryContainer = document.createElement('div');
    galleryContainer.className = 'ct-image-gallery';

    if (galleryState.items.length === 0) {
      galleryContainer.innerHTML = '<p class="ct-gallery-empty">업로드된 이미지가 없습니다.</p>';
    } else {
      // 썸네일 그리드 생성
      const grid = document.createElement('div');
      grid.className = 'ct-gallery-grid';

      galleryState.items.forEach(item => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'ct-gallery-thumbnail';

        const img = document.createElement('img');
        img.src = item.url;

        // 클릭 시 이미지 선택
        thumbnail.addEventListener('click', () => {
          const img = new Image();
          img.onload = () => {
            const size = [img.naturalWidth, img.naturalHeight];
            dialog.populate(item.url, size);
            dialog.save(item.url, size);
          };
          img.onerror = () => {
            dialog.state('failed');
            showMessage('이미지 정보를 불러올 수 없습니다.', 'error');
            setTimeout(() => {
              dialog.state('empty');
              dialog.progress(0);
            }, 1500);
          };
          img.src = item.url;
        });

        thumbnail.appendChild(img);
        grid.appendChild(thumbnail);
      });

      galleryContainer.appendChild(grid);
    }

    // 갤러리를 다이얼로그에 추가
    domView.appendChild(galleryContainer);
  }

  function registerImageUploader() {
    if (isImageUploaderRegistered) return;
    if (typeof ContentTools === 'undefined') return;

    ContentTools.IMAGE_UPLOADER = function(dialog) {
      const resetDialog = () => {
        dialog.state('empty');
        dialog.progress(0);
      };

      dialog.addEventListener('imageuploader.cancel', function() {
        resetDialog();
      });

      dialog.addEventListener('imageuploader.clear', function() {
        resetDialog();
      });

      dialog.addEventListener('imageuploader.url', function(ev) {
        const url = ev.detail().url;
        if (!url) {
          if (typeof dialog.error === 'function') {
            dialog.error('URL을 입력해주세요.');
          } else {
            showMessage('URL을 입력해주세요.', 'error');
          }
          return;
        }
        dialog.save(url);
      });

      // 갤러리 마운트 이벤트 처리
      dialog.addEventListener('imageuploader.mount', function() {
        if (galleryState.isLoaded) {
          buildGallery(dialog);
        } else {
          fetchGallery()
            .then(() => buildGallery(dialog))
            .catch(error => {
              console.error('갤러리 로드 실패:', error);
              showMessage('갤러리를 불러오지 못했습니다.', 'error');
            });
        }
      });

      dialog.addEventListener('imageuploader.fileready', function(ev) {
        const file = ev.detail().file;
        if (!file) {
          if (typeof dialog.error === 'function') {
            dialog.error('선택된 파일이 없습니다.');
          } else {
            showMessage('선택된 파일이 없습니다.', 'error');
          }
          return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
          if (typeof dialog.error === 'function') {
            dialog.error('이미지 크기가 너무 큽니다. 최대 5MB 파일만 업로드할 수 있습니다.');
          } else {
            showMessage('이미지 크기가 너무 큽니다. 최대 5MB 파일만 업로드할 수 있습니다.', 'error');
          }
          return;
        }

        dialog.state('uploading');
        dialog.progress(0);

        const reader = new FileReader();
        reader.onload = function(loadEvent) {
          const dataUrl = loadEvent.target.result;
          const previewImage = new Image();

          previewImage.onload = function() {
            const imageSize = [previewImage.naturalWidth, previewImage.naturalHeight];

            uploadImageToServer(file.name, file.type, dataUrl)
              .then(result => {
                dialog.progress(1);
                
                // 이미지 크기를 다시 로드하여 정확한 크기 정보 전달
                const img = new Image();
                img.onload = () => {
                  const size = [img.naturalWidth, img.naturalHeight];
                  dialog.populate(result.url, size);
                  dialog.save(result.url, size);
                  
                  // 갤러리 상태 업데이트 (새 이미지를 맨 앞에 추가)
                  const newItem = {
                    name: result.url.split('/').pop(),
                    url: result.url,
                    size: result.size,
                    modified: new Date().toISOString()
                  };
                  galleryState.items.unshift(newItem);
                  buildGallery(dialog);
                  
                  // 이미지 업로드 후 현재 에디터 내용을 자동 저장
                  setTimeout(() => {
                    if (window.ContentTools && window.ContentTools.EditorApp) {
                      const editor = window.ContentTools.EditorApp.get();
                      if (editor) {
                        editor.save(true); // 자동 저장 실행
                      }
                    }
                  }, 100);
                };
                
                img.onerror = () => {
                  dialog.state('failed');
                  showMessage('이미지 정보를 불러올 수 없습니다.', 'error');
                  setTimeout(() => resetDialog(), 1500);
                };
                
                img.src = result.url;
              })
              .catch(error => {
                console.error('이미지 업로드 실패:', error);
                dialog.state('failed');
                showMessage(error.message || '이미지 업로드에 실패했습니다.', 'error');
                setTimeout(() => resetDialog(), 1500);
              });
          };

          previewImage.onerror = function() {
            dialog.state('failed');
            showMessage('이미지를 불러오지 못했습니다.', 'error');
            setTimeout(() => resetDialog(), 1500);
          };

          previewImage.src = dataUrl;
        };
        reader.onerror = function() {
          dialog.state('failed');
          showMessage('이미지를 읽는 중 오류가 발생했습니다.', 'error');
          setTimeout(() => resetDialog(), 1500);
        };

        reader.readAsDataURL(file);
      });
    };

    isImageUploaderRegistered = true;
  }

// 링크 클릭 방지 함수들 제거 - ContentTools 기본 동작 사용

// 저장 이벤트 처리 함수 (ContentTools 공식 문서 방식)
function handleSaveEvent(ev) {
  console.log('저장 이벤트 처리');
  
  // 공식 문서에 따른 regions 가져오기
  const regions = ev.detail().regions;
  
  // 변경사항이 있는지 확인
  if (Object.keys(regions).length === 0) {
    console.log('변경사항이 없습니다.');
    return;
  }
  
  console.log('저장할 regions:', regions);
  
  // 에디터를 busy 상태로 설정
  editor.busy(true);
  
  const url = window.location.pathname;
  const timestamp = new Date().toISOString();
  
  // API로 저장
  saveContent(url, timestamp, regions).then(() => {
    // 저장 성공
    editor.busy(false);
    new ContentTools.FlashUI('ok');
    showMessage('success', '콘텐츠가 성공적으로 저장되었습니다.');
  }).catch((error) => {
    // 저장 실패
    editor.busy(false);
    new ContentTools.FlashUI('no');
    showMessage('error', '콘텐츠 저장 실패: ' + error.message);
  });
}


// 에디터 초기화
function initEditor() {
    if (isInitialized) return;

    // ContentTools가 로드되었는지 확인
    if (typeof ContentTools === 'undefined') {
      console.error('ContentTools가 로드되지 않았습니다.');
      return;
    }

    try {
      console.log('ContentTools 초기화 시작...');
      
      // 에디터 인스턴스 생성
      editor = ContentTools.EditorApp.get();
      if (!editor) {
        throw new Error('에디터 인스턴스를 생성할 수 없습니다.');
      }
      
      console.log('에디터 인스턴스 생성됨:', editor);
      
      // 에디터 초기화 - 모든 요소 편집 가능하도록 설정
      editor.init('*[data-editable]', 'data-name');
      console.log('에디터 초기화 완료');
      
      // 변경 감지 이벤트 추가 (자동 저장용)
      const root = ContentEdit.Root.get();
      root.bind('change', scheduleAutoSave);
      
      // ContentTools 기본 동작에 맡김
      
      // 이미지 업로더 등록
      registerImageUploader();
      
      // 에디터가 제대로 초기화되었는지 확인
      console.log('에디터 프로토타입:', Object.getPrototypeOf(editor));
      console.log('에디터 프로토타입의 속성들:', Object.getOwnPropertyNames(Object.getPrototypeOf(editor)));
      
      // ContentTools 공식 문서에 따른 올바른 이벤트 바인딩
      console.log('ContentTools 이벤트 바인딩 시도');
      
      // 공식 문서에 따르면 addEventListener를 사용해야 함
      editor.addEventListener('saved', function(ev) {
        console.log('저장 이벤트 발생 (addEventListener)');
        handleSaveEvent(ev);
      });

      // 편집 이벤트 설정
      editor.addEventListener('start', function(ev) {
        console.log('편집 시작');
        // 에디터가 시작된 후 콘텐츠 로드 (영역이 준비된 후)
        setTimeout(loadContent, 0);
      });

      editor.addEventListener('stop', function(ev) {
        console.log('편집 중단');
      });

      isInitialized = true;
      console.log('ContentTools 에디터가 초기화되었습니다.');
      
      // 에디터 초기화 직후에는 영역이 준비되지 않을 수 있으므로 제거
      // loadContent();
      
    } catch (error) {
      console.error('ContentTools 초기화 실패:', error);
      console.log('오류 상세:', error.message);
    }
  }

  // 콘텐츠 저장 함수 (Promise 반환)
  function saveContent(url, timestamp, regions) {
    const data = {
      url: url,
      timestamp: timestamp,
      regions: regions
    };

    return fetch('/api/save-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        console.log('저장 성공:', result);
        return result;
      } else {
        throw new Error(result.details || result.error || '저장 실패');
      }
    })
    .catch(error => {
      console.error('저장 오류:', error);
      throw error;
    });
  }

  // 콘텐츠 로드 함수
  function loadContent() {
    const url = window.location.pathname;
    console.log('loadContent 시작:', url);
    
    fetch(`/api/load-content?page=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(result => {
        console.log('API 응답:', result);
        if (!result.success || !result.regions) {
          console.log('저장된 콘텐츠가 없거나 실패');
          return;
        }

        const editor = ContentTools.EditorApp.get();
        const regions = editor.regions();
        console.log('에디터 영역들:', regions);

        Object.entries(result.regions).forEach(([name, html]) => {
          console.log('적용 시도:', name, html);
          const region = regions[name];
          if (!region) {
            console.log('영역을 찾을 수 없음:', name);
            return;
          }

          console.log('영역 객체:', region, 'DOM 요소:', region.domElement());
          region.domElement().innerHTML = html;
          region._snapshot = html;      // 내부 스냅샷도 최신으로 맞춰줌
          console.log('적용 완료:', name);
        });

        editor.syncRegions();           // 에디터 상태 갱신
        console.log('콘텐츠 로드 완료');
      })
      .catch(console.error);
  }

  // 메시지 표시 함수
  function showMessage(message, type = 'info') {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.contenttools-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // 새 메시지 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = `contenttools-message contenttools-message-${type}`;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      font-weight: bold;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    if (type === 'success') {
      messageDiv.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
      messageDiv.style.backgroundColor = '#f44336';
    } else {
      messageDiv.style.backgroundColor = '#2196F3';
    }

    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    // 3초 후 자동 제거
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 3000);
  }


// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM 로드 완료, ContentTools 초기화 시작...');
  
  // ContentTools 로드 확인을 위한 재시도 로직
  let retryCount = 0;
  const maxRetries = 30;
  
  function tryInit() {
    console.log(`ContentTools 로드 확인 시도 ${retryCount + 1}/${maxRetries}`);
    console.log('ContentTools:', typeof ContentTools);
    console.log('ContentEdit:', typeof ContentEdit);
    
    if (typeof ContentTools !== 'undefined' && typeof ContentEdit !== 'undefined') {
      console.log('ContentTools 로드 확인됨, 초기화 진행...');
      console.log('ContentTools 객체:', ContentTools);
      console.log('ContentEdit 객체:', ContentEdit);
      
      try {
        initEditor();
        console.log('ContentTools 초기화 완료!');
        return;
      } catch (error) {
        console.error('ContentTools 초기화 중 오류:', error);
        console.log('오류 상세:', error.message);
        console.log('스택:', error.stack);
      }
    }
    
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`ContentTools 로드 대기 중... (${retryCount}/${maxRetries})`);
      setTimeout(tryInit, 300);
    } else {
      console.error('ContentTools 로드 실패: 최대 재시도 횟수 초과');
      console.log('수동 초기화를 시도해보세요: window.ContentToolsManager.init()');
      
      // 수동 초기화 버튼 추가
      const manualInitButton = document.createElement('button');
      manualInitButton.textContent = '수동 ContentTools 초기화';
      manualInitButton.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: #ff6b6b; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;';
      manualInitButton.onclick = function() {
        console.log('수동 초기화 시도...');
        try {
          initEditor();
          this.remove();
          console.log('수동 초기화 성공!');
        } catch (error) {
          console.error('수동 초기화 실패:', error);
        }
      };
      document.body.appendChild(manualInitButton);
    }
  }
  
  tryInit();
});

  // 전역 함수로 노출 (디버깅용)
  window.ContentToolsManager = {
    init: initEditor,
    loadContent: loadContent,
    saveContent: saveContent,
    showMessage: showMessage,
    isInitialized: () => isInitialized,
    editor: () => editor
  };

  // 디버깅을 위한 전역 함수
  window.debugContentTools = function() {
    console.log('=== ContentTools 디버깅 정보 ===');
    console.log('ContentTools 로드됨:', typeof ContentTools !== 'undefined');
    console.log('ContentEdit 로드됨:', typeof ContentEdit !== 'undefined');
    console.log('에디터 초기화됨:', isInitialized);
    console.log('에디터 인스턴스:', editor);
    console.log('편집 가능한 요소들:', document.querySelectorAll('*[data-editable]').length);
    console.log('================================');
  };

})();