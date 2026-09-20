export class VisitorCounter {
  constructor(tickerId, buttonId) {
    this.container = document.getElementById(tickerId);
    this.button = document.getElementById(buttonId || 'upcountBtn');
    if (!this.container) return;

    this.countKey = 'jaijitesh_os_visitor_count';
    this.baseCount = 1428;
    this.currentCount = this.getCount();

    this.init();
  }

  getCount() {
    let saved = parseInt(localStorage.getItem(this.countKey), 10);
    if (isNaN(saved) || saved < this.baseCount) {
      saved = this.baseCount;
    }
    return saved;
  }

  init() {
    this.render(this.currentCount.toString().padStart(6, '0'));

    if (this.button) {
      this.button.addEventListener('click', () => {
        this.upcount();
      });
    }
  }

  upcount() {
    this.currentCount += 1;
    localStorage.setItem(this.countKey, this.currentCount.toString());

    this.render(this.currentCount.toString().padStart(6, '0'));

    if (this.button) {
      this.button.classList.add('pulse');
      setTimeout(() => {
        this.button.classList.remove('pulse');
      }, 400);
    }
  }

  render(digitString) {
    this.container.innerHTML = '';
    const digits = digitString.split('');

    digits.forEach((digitChar, i) => {
      const col = document.createElement('div');
      col.className = 'ticker-digit-col';

      const strip = document.createElement('div');
      strip.className = 'ticker-digit-strip ticker-blur';

      for (let d = 0; d <= 9; d++) {
        const item = document.createElement('div');
        item.className = 'ticker-digit-item';
        item.textContent = d.toString();
        strip.appendChild(item);
      }

      col.appendChild(strip);
      this.container.appendChild(col);

      const targetDigit = parseInt(digitChar, 10);
      const targetY = -(targetDigit * 48);

      setTimeout(() => {
        strip.style.transform = `translateY(${targetY}px)`;
        setTimeout(() => {
          strip.classList.remove('ticker-blur');
        }, 800);
      }, 50 + i * 80);
    });
  }
}
