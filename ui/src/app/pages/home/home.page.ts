import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  constructor() {}

  ngOnInit() {
    const startButton = document.getElementById('start-button');
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
        audio
          .play()
          .catch((error) => console.error('Error playing audio:', error));
      }

      setTimeout(() => {
        if (animationOverlay) {
          animationOverlay.style.display = 'none';
        }

        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.style.display = 'block';
        }

        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      }, 4000);
    });
  }
}
