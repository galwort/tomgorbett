import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { environment } from 'src/environments/environment';

export const app = initializeApp(environment.firebase);
export const db = getFirestore(app);

@Component({
  selector: 'app-daily',
  templateUrl: './daily.component.html',
  styleUrls: ['./daily.component.scss'],
})
export class DailyComponent implements OnInit {
  dailyForm: FormGroup = new FormGroup({
    diet: new FormControl('Okay'),
    marriage: new FormControl('Okay'),
    parents: new FormControl('Okay'),
    productivity: new FormControl('Okay'),
    sleep: new FormControl('Okay'),
    gratitude: new FormControl(''),
  });

  moods = ['Very Bad', 'Bad', 'Okay', 'Good', 'Great'];
  isSubmitting: boolean = false;
  submitButtonText: string = 'Submit';

  constructor() {}

  ngOnInit() {}

  private getFormattedDate(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  async submitData() {
    this.isSubmitting = true;
    this.submitButtonText = 'Submitting...';

    const mood = {
      diet: this.moods.indexOf(this.dailyForm.value.diet),
      marriage: this.moods.indexOf(this.dailyForm.value.marriage),
      parents: this.moods.indexOf(this.dailyForm.value.parents),
      productivity: this.moods.indexOf(this.dailyForm.value.productivity),
      sleep: this.moods.indexOf(this.dailyForm.value.sleep),
    };
    const gratitude = this.dailyForm.value.gratitude;
    const dateId = this.getFormattedDate();

    try {
      await setDoc(doc(db, 'mood', dateId), mood);
      await setDoc(doc(db, 'gratitudes', dateId), { gratitude });
      this.submitButtonText = 'Submitted';
      this.dailyForm.reset();
    } catch (error) {
      this.submitButtonText = 'Submit Failed';
    } finally {
      this.isSubmitting = false;
      setTimeout(() => (this.submitButtonText = 'Submit'), 2000);
    }
  }
}
