import { Component, AfterViewInit } from '@angular/core';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent implements AfterViewInit {
  loadedSlides = [true, false, false];
  startDate: string;
  endDate: string;

  constructor() {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const isoDate = today.toISOString().split('T')[0];
    this.startDate = isoDate;
    this.endDate = isoDate;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const el = document.querySelector('swiper-container.analytics-swiper') as any;
      el?.swiper?.update();
      el?.addEventListener('swiperslidechange', () => {
        const index = el.swiper?.activeIndex ?? 0;
        this.loadedSlides[index] = true;
      });
    }, 100);
  }
}
