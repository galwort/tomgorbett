import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  AfterViewInit,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IonSelect, IonInput } from '@ionic/angular';
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
export class DailyComponent implements OnInit, AfterViewInit {
  defaultValues = {
    diet: 'Okay',
    marriage: 'Okay',
    parents: 'Okay',
    productivity: 'Okay',
    sleep: 'Okay',
    gratitude: '',
  };
  dailyForm: FormGroup = new FormGroup({
    diet: new FormControl(this.defaultValues.diet),
    marriage: new FormControl(this.defaultValues.marriage),
    parents: new FormControl(this.defaultValues.parents),
    productivity: new FormControl(this.defaultValues.productivity),
    sleep: new FormControl(this.defaultValues.sleep),
    gratitude: new FormControl(this.defaultValues.gratitude),
  });

  moods = ['Very Bad', 'Bad', 'Okay', 'Good', 'Great'];
  isSubmitting: boolean = false;
  submitButtonText: string = 'Submit';

  @ViewChild('dietSelect') dietSelect!: IonSelect;
  @ViewChild('marriageSelect') marriageSelect!: IonSelect;
  @ViewChild('parentsSelect') parentsSelect!: IonSelect;
  @ViewChild('productivitySelect') productivitySelect!: IonSelect;
  @ViewChild('sleepSelect') sleepSelect!: IonSelect;
  @ViewChild('gratitudeInput') gratitudeInput!: IonInput;

  focusableElements: Array<IonSelect | IonInput> = [];
  currentFocusIndex: number = 0;

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.focusableElements = [
      this.dietSelect,
      this.marriageSelect,
      this.parentsSelect,
      this.productivitySelect,
      this.sleepSelect,
      this.gratitudeInput,
    ];
  }

  setFocusIndex(index: number) {
    this.currentFocusIndex = index;
  }

  private focusCurrent() {
    const element: any = this.focusableElements[this.currentFocusIndex];
    if (element && element.setFocus) {
      element.setFocus();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (!this.isSubmitting) this.submitData();
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowDown') {
      this.currentFocusIndex =
        (this.currentFocusIndex + 1) % this.focusableElements.length;
      this.focusCurrent();
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowUp') {
      this.currentFocusIndex =
        (this.currentFocusIndex - 1 + this.focusableElements.length) %
        this.focusableElements.length;
      this.focusCurrent();
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowLeft') {
      this.adjustSelect(-1);
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowRight') {
      this.adjustSelect(1);
      event.preventDefault();
      return;
    }
  }

  private adjustSelect(direction: number) {
    const controlNames = [
      'diet',
      'marriage',
      'parents',
      'productivity',
      'sleep',
    ];
    if (this.currentFocusIndex < controlNames.length) {
      const control = this.dailyForm.get(controlNames[this.currentFocusIndex]);
      if (!control) return;
      const index = this.moods.indexOf(control.value);
      const newIndex = index + direction;
      if (newIndex >= 0 && newIndex < this.moods.length) {
        control.setValue(this.moods[newIndex]);
      }
    }
  }

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
      this.dailyForm.reset(this.defaultValues);
    } catch (error) {
      this.submitButtonText = 'Submit Failed';
    } finally {
      this.isSubmitting = false;
      setTimeout(() => (this.submitButtonText = 'Submit'), 2000);
    }
  }
}
