import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { environment } from 'src/environments/environment';

export const app = initializeApp(environment.firebase);
export const db = getFirestore(app);

@Component({
  selector: 'app-gratitudes',
  templateUrl: './gratitudes.component.html',
  styleUrls: ['./gratitudes.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class GratitudesComponent implements OnInit {
  gratitude: string = '';
  isSaving: boolean = false;
  saveButtonText: string = 'Save';

  constructor() {}

  ngOnInit() {}

  adjustTextareaHeight(event: any) {
    const textarea = event.target;
    textarea.style.height = '2em';
    textarea.style.height = textarea.scrollHeight + 8 + 'px';
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

    const dateId = this.getFormattedDate();
    try {
      const docRef = await setDoc(doc(db, 'gratitudes', dateId), {
        gratitude: this.gratitude,
      });
      this.saveButtonText = 'Saved';
    } catch (error) {
      console.error('Error saving: ', error);
      this.saveButtonText = 'Save Failed';
    } finally {
      this.isSaving = false;
      setTimeout(() => (this.saveButtonText = 'Save'), 2000);
    }
  }
}
