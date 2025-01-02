import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  activeLink: string = 'about';
  constructor() {}
  ngOnInit() {
    const randomBgHue = Math.floor(Math.random() * 360);
    let randomPrimaryHue = Math.floor(Math.random() * 360);
    while (randomPrimaryHue === randomBgHue) {
      randomPrimaryHue = Math.floor(Math.random() * 360);
    }
    const backgroundColor = this.hsvToHex(randomBgHue, 79, 15);
    const backgroundShade = this.hsvToHex(randomBgHue, 79, 30);
    const primaryColor = this.hsvToHex(randomPrimaryHue, 61, 100);
    const ionContent = document.querySelector('ion-content') as HTMLElement;
    if (ionContent) {
      ionContent.style.setProperty('--random-bg', backgroundColor);
      ionContent.style.setProperty('--random-bg-shade', backgroundShade);
      ionContent.style.setProperty('--random-primary', primaryColor);
    }
    const startButton = document.getElementById('start-button') as HTMLElement;
    const audio = document.getElementById('logo-audio') as HTMLAudioElement;
    startButton?.addEventListener('click', () => {
      const startOverlay = document.getElementById('start-overlay');
      if (startOverlay) {
        startOverlay.style.display = 'none';
      }
      const animationOverlay = document.getElementById('animation-overlay');
      if (animationOverlay) {
        animationOverlay.style.display = 'flex';
      }
      if (audio) {
        audio.play().catch((error) => console.error(error));
      }
      setTimeout(() => {
        if (animationOverlay) {
          animationOverlay.style.display = 'none';
        }
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.style.display = 'flex';
        }
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      }, 4000);
    });
  }
  toggleActiveLink(section: string) {
    this.activeLink = section;
  }
  hsvToHex(h: number, s: number, v: number): string {
    s /= 100;
    v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (h >= 300 && h < 360) {
      r = c;
      g = 0;
      b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return (
      '#' +
      ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
  }
}
