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
    time: new FormControl(''),
    activity: new FormControl(''),
    dateCheckbox: new FormControl(false),
    rangeCheckbox: new FormControl(false),
    datetimeTo: new FormControl(''),
    timeTo: new FormControl(''),
  });

  docId: string = '';
  activities: any[] = [];

  constructor(private alertController: AlertController) {}

  ngOnInit() {
    this.fetchActivities();
    this.setRoundedDateTime();
  }

  setRoundedDateTime() {
    const currentDateTime = new Date();
    const minutes = currentDateTime.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    currentDateTime.setMinutes(roundedMinutes);
    currentDateTime.setSeconds(0);
    currentDateTime.setMilliseconds(0);
    const timezoneOffset = currentDateTime.getTimezoneOffset() * 60000;

    const localISOTime = new Date(currentDateTime.getTime() - timezoneOffset)
      .toISOString()
      .slice(0, -1);
    const datetimeControl = this.trackerForm.get('datetime');
    if (datetimeControl) {
      datetimeControl.setValue(localISOTime);
    }

    currentDateTime.setMinutes(currentDateTime.getMinutes() + 30);
    const datetimeToISOTime = new Date(
      currentDateTime.getTime() - timezoneOffset
    )
      .toISOString()
      .slice(0, -1);
    const datetimeToControl = this.trackerForm.get('datetimeTo');
    if (datetimeToControl) {
      datetimeToControl.setValue(datetimeToISOTime);
    }
  }

  async fetchActivities() {
    const querySnapshot = await getDocs(collection(db, 'activities'));
    this.activities = querySnapshot.docs.map((doc) => ({ id: doc.id }));
  }

  changeTimeFrom(event: any) {
    const value = event.detail.value;
    if (this.trackerForm.get('datetime')) {
      this.trackerForm.get('datetime')?.setValue(value);
    }
    if (this.trackerForm.get('time')) {
      this.trackerForm.get('time')?.setValue(value);
    }
    this.updateDocId(value);
  }

  changeTimeTo(event: any) {
    const value = event.detail.value;
    if (this.trackerForm.get('datetimeTo')) {
      this.trackerForm.get('datetimeTo')?.setValue(value);
    }
    if (this.trackerForm.get('timeTo')) {
      this.trackerForm.get('timeTo')?.setValue(value);
    }
  }

  updateDocId(datetime: string) {
    const formattedDateTime = this.convertToLocalTimezone(new Date(datetime));
    this.docId = formattedDateTime.replace(/[-:T]/g, '').slice(0, -7);
  }

  async submitData() {
    const formData = this.trackerForm.value;
    const isRange = this.trackerForm.get('rangeCheckbox')?.value;
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

    if (!isRange && !datetime) {
      const alert = await this.alertController.create({
        header: 'Missing Information',
        message: 'Please enter a time.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    if (isRange && (!datetime || !datetimeTo)) {
      const alert = await this.alertController.create({
        header: 'Missing Information',
        message: 'Please enter a time range.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    try {
      if (isRange) {
        const startDateTime = formData.datetime
          ? new Date(formData.datetime)
          : new Date();
        const endDateTime = formData.datetimeTo
          ? new Date(formData.datetimeTo)
          : new Date();
        let current = new Date(startDateTime.getTime());

        while (current <= endDateTime) {
          const docId = this.formatDateForDocId(current);
          const docRef = doc(db, 'tracker', docId);
          await setDoc(docRef, { Activity: activity });
          current.setMinutes(current.getMinutes() + 15);
        }
      } else {
        const datetime = formData.datetime
          ? new Date(formData.datetime)
          : new Date();
        const docId = this.formatDateForDocId(datetime);
        const docRef = doc(db, 'tracker', docId);
        await setDoc(docRef, {
          Activity: activity,
        });
      }

      this.trackerForm.reset();

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
