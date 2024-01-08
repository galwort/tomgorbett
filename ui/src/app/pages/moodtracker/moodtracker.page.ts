import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-moodtracker',
  templateUrl: './moodtracker.page.html',
  styleUrls: ['./moodtracker.page.scss'],
})
export class MoodtrackerPage implements OnInit {
  icons = ['skull-outline', 'sad-outline', 'ellipse-outline', 'happy-outline', 'heart-circle-outline'];
  colors = ['tertiary', 'primary', 'warning', 'success', 'danger'];
  dietIndex = 2;
  marriageIndex = 2;
  parentsIndex = 2;
  productivityIndex = 2;
  sleepIndex = 2;

  changeDietIcon() {
    this.dietIndex = (this.dietIndex + 1) % this.icons.length;
  }

  changeMarriageIcon() {
    this.marriageIndex = (this.marriageIndex + 1) % this.icons.length;
  }

  changeParentsIcon() {
    this.parentsIndex = (this.parentsIndex + 1) % this.icons.length;
  }

  changeProductivityIcon() {
    this.productivityIndex = (this.productivityIndex + 1) % this.icons.length;
  }

  changeSleepIcon() {
    this.sleepIndex = (this.sleepIndex + 1) % this.icons.length;
  }

  constructor() { }

  ngOnInit() {
  }
}
