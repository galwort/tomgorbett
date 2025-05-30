import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-log',
  templateUrl: 'log.page.html',
  styleUrls: ['log.page.scss'],
})
export class LogPage {
  selectedComponent: string = 'analytics';

  constructor() {}

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      return;
    }
    if (!event.shiftKey) return;
    const key = event.key.toUpperCase();
    if (key === 'T') this.selectedComponent = 'timetracker';
    else if (key === 'D') this.selectedComponent = 'daily';
    else if (key === 'C') this.selectedComponent = 'analytics';
    else if (key === 'G') this.selectedComponent = 'timeline';
    else if (key === 'A') this.selectedComponent = 'activities';
  }
}
