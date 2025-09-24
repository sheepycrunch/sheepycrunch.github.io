// 아이콘 변경 기능
class IconChanger {
  constructor() {
    this.currentIcon = 0;
    this.icons = [];
    this.button = null;
    this.init();
  }
  
  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.setupElements();
      this.setupEventListeners();
    });
  }
  
  setupElements() {
    const iconShowcase = document.getElementById('icon-showcase');
    if (iconShowcase) {
      this.icons = iconShowcase.querySelectorAll('ol > li');
      this.button = document.getElementById('misuzu-button');
    }
  }
  
  setupEventListeners() {
    if (this.button && this.icons.length > 0) {
      this.button.addEventListener('click', () => {
        this.changeIcon();
      });
    }
  }
  
  changeIcon() {
    if (this.icons.length === 0) return;
    
    // 현재 아이콘 숨기기
    this.icons[this.currentIcon].classList.add('hidden');
    
    // 다음 아이콘으로 이동
    this.currentIcon = (this.currentIcon + 1) % this.icons.length;
    
    // 새 아이콘 보이기
    this.icons[this.currentIcon].classList.remove('hidden');
    
    // 애니메이션 효과
    this.animateIconChange();
  }
  
  animateIconChange() {
    const currentIconElement = this.icons[this.currentIcon].querySelector('img');
    if (currentIconElement) {
      currentIconElement.style.transform = 'scale(1.2)';
      setTimeout(() => {
        currentIconElement.style.transform = 'scale(1)';
      }, 200);
    }
  }
}

// 아이콘 체인저 초기화
new IconChanger();
