import { Component } from '@angular/core';

@Component({
  selector: 'app-time',
  templateUrl: 'time.page.html',
  styleUrls: ['time.page.scss'],
})
export class TimePage {
  selectedComponent: string = 'timebar';

  constructor() {}
}
