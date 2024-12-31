import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  constructor() {}

  ngOnInit() {
    setTimeout(() => {
      const overlay = document.getElementById('animation-overlay');
      if (overlay) {
        overlay.style.display = 'none';
      }

      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.style.display = 'block';
      }
    }, 4000);
  }
}
