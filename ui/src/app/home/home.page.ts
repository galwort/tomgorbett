import { Component } from '@angular/core';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { environment } from 'src/environments/environment';
import { FormControl, FormGroup } from '@angular/forms';

export const app = initializeApp(environment.firebase);
export const db = getFirestore(app);

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  trackerForm = new FormGroup({
    date: new FormControl(''),
    time: new FormControl(''),
    activity: new FormControl('')
  });

  constructor() {}

  async submitData() {
    const formData = this.trackerForm.value;
    const date = formData.date ?? '';
    const time = formData.time?.replace(/:/g, '') ?? '';
    const activity = formData.activity ?? '';
  
    if (!date || !time) {
      console.error("Date and time are required.");
      return;
    }
  
    const docId = date.replace(/-/g, '') + time;
    const docRef = doc(db, 'tracker', docId);
  
    try {
      await setDoc(docRef, {
        activity: activity,
        timestamp: new Date(date + 'T' + time)
      });
      console.log('Document written with ID: ', docId);
      this.trackerForm.reset();
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
}
