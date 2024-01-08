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
  isSaving: boolean = false;
  saveButtonText: string = 'Save';

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

  private getFormattedDate(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  async submit() {
    this.isSaving = true;
    this.saveButtonText = 'Saving...';

    const mood = {
      diet: this.dietIndex,
      marriage: this.marriageIndex,
      parents: this.parentsIndex,
      productivity: this.productivityIndex,
      sleep: this.sleepIndex
    };
    const dateId = this.getFormattedDate();
    try {
      const docRef = await setDoc(doc(db, 'mood', dateId), mood);
      this.saveButtonText = 'Saved';
    } catch (error) {
      console.error('Error saving: ', error);
      this.saveButtonText = 'Save Failed';
    } finally {
      this.isSaving = false;
      setTimeout(() => this.saveButtonText = 'Save', 2000);
    }
  }
}