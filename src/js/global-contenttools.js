// ContentTools 전역 설정 및 초기화
(function() {
  'use strict';

  let editor;
  let isInitialized = false;

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  let isImageUploaderRegistered = false;

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
          dialog.error('URL을 입력해주세요.');
          return;
        }
        dialog.save(url);
      });

      dialog.addEventListener('imageuploader.file', function(ev) {
        const file = ev.detail().file;
        if (!file) {
          dialog.error('선택된 파일이 없습니다.');
          return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
          dialog.error('이미지 크기가 너무 큽니다. 최대 5MB 파일만 업로드할 수 있습니다.');
          return;
        }

        dialog.state('uploading');
        dialog.progress(0);

        const reader = new FileReader();
        reader.onload = function(loadEvent) {
          const dataUrl = loadEvent.target.result;

          uploadImageToServer(file.name, file.type, dataUrl)
            .then(result => {
              dialog.progress(1);
              dialog.save(result.url);
            })
            .catch(error => {
              console.error('이미지 업로드 실패:', error);
              dialog.state('failed');
              dialog.error(error.message || '이미지 업로드에 실패했습니다.');
              setTimeout(() => resetDialog(), 1500);
            });
        };
        reader.onerror = function() {
          dialog.state('failed');
          dialog.error('이미지를 읽는 중 오류가 발생했습니다.');
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
      });

      editor.addEventListener('stop', function(ev) {
        console.log('편집 중단');
      });

      isInitialized = true;
      console.log('ContentTools 에디터가 초기화되었습니다.');
      
      // 페이지 로드 시 최신 콘텐츠 불러오기
      loadContent();
      
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
    
    fetch(`/api/load-content?page=${encodeURIComponent(url)}`)
    .then(response => response.json())
    .catch(error => {
      console.log('저장된 콘텐츠가 없거나 로드 실패:', error);
    });
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

  // 다운로드 기능
  function setupDownloadButton() {
    const downloadBtn = document.getElementById('download-content');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function() {
        const url = window.location.pathname;
        
        fetch(`/api/load-content?page=${encodeURIComponent(url)}`)
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            // JSON 파일로 다운로드
            const dataStr = JSON.stringify(result, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `content-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showMessage('콘텐츠가 다운로드되었습니다.', 'success');
          } else {
            showMessage('다운로드에 실패했습니다.', 'error');
          }
        })
        .catch(error => {
          console.error('다운로드 오류:', error);
          showMessage('다운로드 중 오류가 발생했습니다.', 'error');
        });
      });
    }
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
        setupDownloadButton();
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
          setupDownloadButton();
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