export class VisitorCounter {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.init();
  }

  init() {
    const storageKey = 'jaijitesh_os_visitor_logged';
    const countKey = 'jaijitesh_os_visitor_count';
    const baseCount = 1428;

    let currentCount = parseInt(localStorage.getItem(countKey), 10);
    if (isNaN(currentCount) || currentCount < baseCount) {
      currentCount = baseCount;
    }

    const hasLogged = localStorage.getItem(storageKey);
    if (!hasLogged) {
      currentCount += 1;
      localStorage.setItem(storageKey, 'true');
      localStorage.setItem(countKey, currentCount.toString());
    }

    const formatted = currentCount.toString().padStart(6, '0');
    this.render(formatted);
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
        }, 1200);
      }, 100 + i * 140);
    });
  }
}
