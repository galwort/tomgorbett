import { Component } from '@angular/core';
import { getFirestore, collection, doc, getDocs, setDoc } from "firebase/firestore";
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
    datetime: new FormControl(''),
    activity: new FormControl('')
  });

  docId: string = '';
  activities: any[] = [];

  constructor() {}

  ngOnInit() {
    this.fetchActivities();
  }

  async fetchActivities() {
    const querySnapshot = await getDocs(collection(db, "activities"));
    this.activities = querySnapshot.docs.map(doc => ({ id: doc.id}));
    console.log(this.activities);
  }

  changeTimeFrom(event: any) {
    const datetime = event.detail.value;
    if (this.trackerForm.get('datetime')) {
      this.trackerForm.get('datetime')?.setValue(datetime);
    }
    this.updateDocId(datetime);
  }

  updateDocId(datetime: string) {
    const formattedDateTime = this.convertToLocalTimezone(new Date(datetime));
    this.docId = formattedDateTime.replace(/[-:T]/g, '').slice(0, -7);
  }

  async submitData() {
    const formData = this.trackerForm.value;
    const datetime = formData.datetime ?? '';
    const activity = formData.activity ?? '';
  
    if (!datetime) {
      console.error("Date and time are required.");
      return;
    }
    
    const formattedDateTime = this.convertToLocalTimezone(new Date(datetime));
    const docId = formattedDateTime.replace(/[-:T]/g, '').slice(0, -7);
    const docRef = doc(db, 'tracker', docId);
  
    try {
      await setDoc(docRef, {
        activity: activity
      });
      this.trackerForm.reset();
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  convertToLocalTimezone(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString();
  }
}
