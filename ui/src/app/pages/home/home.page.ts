import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from 'firebase/firestore';
import { environment } from 'src/environments/environment';

const app = initializeApp(environment.firebase);
const db = getFirestore(app);

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  activeLink: string = 'about';
  recentBlogs: { id: string; title: string }[] = [];
  private observer?: IntersectionObserver;
  private clickCount: number = 0;
  private clickTimeout: any;
  coffeeShops = [
    'https://instagram.com/metropolitancoffee',
    'https://instagram.com/lekkocoffee',
    'https://instagram.com/roastedtremont',
    'https://instagram.com/blueskybrews',
  ];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.setupThemeColors();
    this.setupStartButton();
    this.setupTripleClick();
    this.fetchRecentBlogs();
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
    this.setupNavMenuAudio();
    this.setupExternalLinksAudio();
  }

  private setupThemeColors() {
    function generateHueExcludingRange(min: number, max: number): number {
      const random = Math.random() * (360 - (max - min));
      return random < min ? random : random + (max - min);
    }

    const randomBgHue = Math.floor(generateHueExcludingRange(20, 70));
    let randomPrimaryHue = Math.floor(Math.random() * 360);
    while (randomPrimaryHue === randomBgHue) {
      randomPrimaryHue = Math.floor(Math.random() * 360);
    }

    const backgroundColor = this.hsvToHex(randomBgHue, 80, 10);
    const backgroundShade = this.hsvToHex(randomBgHue, 80, 25);
    const primaryColor = this.hsvToHex(randomPrimaryHue, 35, 100);

    const ionContent = document.querySelector('ion-content') as HTMLElement;
    if (ionContent) {
      ionContent.style.setProperty('--random-bg', backgroundColor);
      ionContent.style.setProperty('--random-bg-shade', backgroundShade);
      ionContent.style.setProperty('--random-primary', primaryColor);
    }

    this.loadAndReplaceProfileSVG(primaryColor);
  }

  private loadAndReplaceProfileSVG(primaryColor: string) {
    fetch('assets/profile.svg')
      .then((response) => response.text())
      .then((svgText) => {
        const updatedSVG = svgText.replace(
          '--shirt: #000000;',
          `--shirt: ${primaryColor};`
        );

        const container = document.querySelector('.profile-pic-container');
        if (!container) return;

        container.innerHTML = updatedSVG;

        const injectedSVG = container.querySelector('svg');
        if (injectedSVG) {
          injectedSVG.classList.add('profile-pic');
        }
      })
      .catch((err) => console.error('Error loading SVG:', err));
  }

  private setupStartButton() {
    const startButton = document.getElementById('start-button') as HTMLElement;
    const audio = document.getElementById('logo-audio') as HTMLAudioElement;

    startButton?.addEventListener('click', () => {
      const startOverlay = document.getElementById('start-overlay');
      const animationOverlay = document.getElementById('animation-overlay');
      const mainContent = document.getElementById('main-content');

      if (startOverlay) startOverlay.style.display = 'none';
      if (animationOverlay) animationOverlay.style.display = 'flex';

      if (audio) {
        audio
          .play()
          .catch((error) => console.error('Audio play error:', error));
      }

      setTimeout(() => {
        if (animationOverlay) animationOverlay.style.display = 'none';
        if (mainContent) mainContent.style.display = 'flex';
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      }, 4000);
    });
  }

  private setupTripleClick() {
    const startOverlay = document.getElementById('start-overlay');
    if (startOverlay) {
      startOverlay.addEventListener('click', this.handleTripleClick.bind(this));
    }
  }

  private handleTripleClick() {
    this.clickCount++;

    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }

    this.clickTimeout = setTimeout(() => {
      this.clickCount = 0;
    }, 1500);

    if (this.clickCount === 3) {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/log']);
      } else {
        this.router.navigate(['/unlock']);
      }
    }
  }

  private setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.activeLink = entry.target.id;
          }
        });
      },
      {
        threshold: 0.6,
      }
    );

    const sections = document.querySelectorAll('section');
    sections.forEach((section) => {
      if (this.observer) {
        this.observer.observe(section);
      }
    });
  }

  private setupNavMenuAudio() {
    const navItems = document.querySelectorAll('#nav-menu li');
    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const audio = document.getElementById(
          'downbeat-audio'
        ) as HTMLAudioElement;
        audio.currentTime = 0;
        audio.play();
      });
    });
  }

  private setupExternalLinksAudio() {
    const externalLinks = document.querySelectorAll(
      '#social-links a, #right-col a[href]'
    );
    externalLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const audio = document.getElementById(
          'upbeat-audio'
        ) as HTMLAudioElement;
        audio.currentTime = 0;
        audio.play();
      });
    });
  }

  toggleActiveLink(section: string) {
    this.activeLink = section;
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
  }

  openRandomCoffeeShop() {
    const randomIndex = Math.floor(Math.random() * this.coffeeShops.length);
    const url = this.coffeeShops[randomIndex];
    window.open(url, '_blank');
  }

  downloadResume() {
    const link = document.createElement('a');
    link.href = 'assets/Tom Gorbett Resume.pdf';
    link.download = 'Tom Gorbett Resume.pdf';
    link.click();
  }

  async fetchRecentBlogs() {
    const blogsRef = collection(db, 'blogs');
    const today = new Date();
    const blogsQuery = query(
      blogsRef,
      orderBy('published', 'desc'),
      where('published', '<=', today),
      limit(3)
    );
    const snapshot = await getDocs(blogsQuery);

    this.recentBlogs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data['title'],
      };
    });
  }

  navigateToBlog(id: string) {
    this.router.navigate([`/blog/${id}`]);
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
