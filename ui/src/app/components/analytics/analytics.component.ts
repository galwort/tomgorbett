import { Component, AfterViewInit, HostListener } from '@angular/core';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent implements AfterViewInit {
  loadedSlides = [true, false, false, false, false];
  startDate: string;
  endDate: string;
  today: string;
  private swiper: any;

  constructor() {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const isoDate = today.toISOString().split('T')[0];
    this.startDate = isoDate;
    this.endDate = isoDate;
    this.today = isoDate;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const el = document.querySelector(
        'swiper-container.analytics-swiper'
      ) as any;
      this.swiper = el?.swiper;
      this.swiper?.update();
      el?.addEventListener('swiperslidechange', () => {
        const index = this.swiper?.activeIndex ?? 0;
        this.loadedSlides[index] = true;
      });
    }, 100);
  }

  previousSlide() {
    this.swiper?.slidePrev();
  }

  nextSlide() {
    this.swiper?.slideNext();
  }

  onStartDateChange() {
    if (this.startDate > this.endDate) {
      this.endDate = this.startDate;
    }
    if (this.startDate > this.today) {
      this.startDate = this.today;
    }
  }
  onEndDateChange() {
    if (this.endDate < this.startDate) {
      this.startDate = this.endDate;
    }
    if (this.endDate > this.today) {
      this.endDate = this.today;
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      this.previousSlide();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.nextSlide();
      event.preventDefault();
    }
  }
}
