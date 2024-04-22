import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { environment } from 'src/environments/environment';

export const app = initializeApp(environment.firebase);
export const db = getFirestore(app);

@Component({
  selector: 'app-timetracker',
  templateUrl: './timetracker.component.html',
  styleUrls: ['./timetracker.component.scss'],
})
export class TimetrackerComponent implements OnInit {
  trackerForm = new FormGroup({
    datetime: new FormControl(''),
    activity: new FormControl(''),
    datetimeTo: new FormControl(''),
  });

  docId: string = '';
  activities: any[] = [];
  lastUpdatedDateTime: string = '';

  constructor(private alertController: AlertController) {}

  ngOnInit() {
    this.fetchActivities();
    this.fetchLastUpdatedDateTime();
  }

  setDateTimeElements() {
    const lastUpdatedTime = new Date(this.lastUpdatedDateTime);
    lastUpdatedTime.setMinutes(lastUpdatedTime.getMinutes() + 15);

    const timezoneOffset = lastUpdatedTime.getTimezoneOffset() * 60000;
    const localISOTime = new Date(lastUpdatedTime.getTime() - timezoneOffset)
      .toISOString()
      .slice(0, -1);

    const datetimeControl = this.trackerForm.get('datetime');
    if (datetimeControl) {
      datetimeControl.setValue(localISOTime);
    }

    lastUpdatedTime.setMinutes(lastUpdatedTime.getMinutes() + 30);
    const datetimeToISOTime = new Date(
      lastUpdatedTime.getTime() - timezoneOffset
    )
      .toISOString()
      .slice(0, -1);

    const datetimeToControl = this.trackerForm.get('datetimeTo');
    if (datetimeToControl) {
      datetimeToControl.setValue(datetimeToISOTime);
    }
  }

  async fetchActivities() {
    const querySnapshot = await getDocs(
      query(collection(db, 'activities'), where('Active', '==', true))
    );
    this.activities = querySnapshot.docs.map((doc) => ({ id: doc.id }));
  }

  changeTimeFrom(event: any) {
    const value = event.detail.value;
    if (this.trackerForm.get('datetime')) {
      this.trackerForm.get('datetime')?.setValue(value);
    }
    this.updateDocId(value);
  }

  changeTimeTo(event: any) {
    const value = event.detail.value;
    if (this.trackerForm.get('datetimeTo')) {
      this.trackerForm.get('datetimeTo')?.setValue(value);
    }
  }

  updateDocId(datetime: string) {
    const formattedDateTime = this.convertToLocalTimezone(new Date(datetime));
    this.docId = formattedDateTime.replace(/[-:T]/g, '').slice(0, -7);
  }

  async fetchLastUpdatedDateTime() {
    const querySnapshot = await getDocs(
      query(collection(db, 'tracker'), orderBy('__name__', 'desc'), limit(1))
    );
    if (!querySnapshot.empty) {
      const lastDocId = querySnapshot.docs[0].id;
      const year = parseInt(lastDocId.slice(0, 4), 10);
      const month = parseInt(lastDocId.slice(4, 6), 10);
      const day = parseInt(lastDocId.slice(6, 8), 10);
      const hour = parseInt(lastDocId.slice(8, 10), 10);
      const minute = parseInt(lastDocId.slice(10, 12), 10);
      this.lastUpdatedDateTime = new Date(
        year,
        month - 1,
        day,
        hour,
        minute
      ).toISOString();
      this.setDateTimeElements();
    }
  }

  async submitData() {
    const formData = this.trackerForm.value;
    const activity = formData.activity ?? '';
    const datetime = formData.datetime ?? '';
    const datetimeTo = formData.datetimeTo ?? '';

    if (!activity) {
      const alert = await this.alertController.create({
        header: 'Missing Information',
        message: 'Please select an activity.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    if (!datetime || !datetimeTo) {
      const alert = await this.alertController.create({
        header: 'Missing Information',
        message: 'Please enter a time range.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    try {
      const startDateTime = new Date(formData.datetime ?? '');
      const endDateTime = new Date(formData.datetimeTo ?? '');
      let current = new Date(startDateTime.getTime());

      while (current < endDateTime) {
        const docId = this.formatDateForDocId(current);
        const docRef = doc(db, 'tracker', docId);
        await setDoc(docRef, { Activity: activity });
        current.setMinutes(current.getMinutes() + 15);
      }

      this.trackerForm.reset();

      await this.fetchLastUpdatedDateTime();

      const successAlert = await this.alertController.create({
        header: 'Success',
        message: 'Data submitted successfully!',
        buttons: ['OK'],
      });
      await successAlert.present();
    } catch (e) {
      console.error('Error adding document: ', e);

      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to submit data. Please try again.',
        buttons: ['OK'],
      });
      await errorAlert.present();
    }
  }

  formatDateTime(dateTimeString: string): string {
    const dateTime = new Date(dateTimeString);
    const formattedDate = dateTime.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
    });
    const formattedTime = dateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
    });
    return `${formattedDate}, ${formattedTime}`;
  }

  convertToLocalTimezone(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString();
  }

  formatDateForDocId(date: Date): string {
    const formatted = this.convertToLocalTimezone(date);
    return formatted.replace(/[-:T]/g, '').slice(0, -7);
  }
}
