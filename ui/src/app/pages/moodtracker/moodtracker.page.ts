import { Component, OnInit } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { environment } from 'src/environments/environment';

export const app = initializeApp(environment.firebase);
export const db = getFirestore(app);

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

  constructor() { }

  ngOnInit() {
  }

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

  async submit() {
    const mood = {
      diet: this.dietIndex,
      marriage: this.marriageIndex,
      parents: this.parentsIndex,
      productivity: this.productivityIndex,
      sleep: this.sleepIndex
    };
    const docRef = await setDoc(doc(db, 'mood', 'mood'), mood);
  }
}
