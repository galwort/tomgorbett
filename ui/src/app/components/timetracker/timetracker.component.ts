import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AlertController, IonSelect, ToastController } from '@ionic/angular';
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
  writeBatch,
  startAt,
  endBefore,
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
  @ViewChild('activitySelect') activitySelect!: IonSelect;

  trackerForm = new FormGroup({
    datetime: new FormControl(''),
    activity: new FormControl(''),
    datetimeTo: new FormControl(''),
  });

  docId: string = '';
  activities: any[] = [];
  lastUpdatedDateTime: string = '';
  isLoading: boolean = true;
  loadError: string | null = null;
  isSubmitting: boolean = false;
  submitButtonText: string = 'Submit';
  isDeletingEntries: boolean = false;
  deleteButtonText: string = 'Delete';
  existingDocIds: string[] = [];

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadInitialData();
  }
  async loadInitialData() {
    try {
      this.isLoading = true;
      this.loadError = null;
      await Promise.all([
        this.fetchActivities(),
        this.fetchLastUpdatedDateTime(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.loadError =
        'Failed to load data. Network connection may be slow or unavailable.';
    } finally {
      this.isLoading = false;
    }
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

    lastUpdatedTime.setMinutes(lastUpdatedTime.getMinutes() + 15);
    const datetimeToISOTime = new Date(
      lastUpdatedTime.getTime() - timezoneOffset
    )
      .toISOString()
      .slice(0, -1);

    const datetimeToControl = this.trackerForm.get('datetimeTo');
    if (datetimeToControl) {
      datetimeToControl.setValue(datetimeToISOTime);
    }
    this.checkExistingEntries();
  }
  async fetchActivities() {
    try {
      const cachedActivities = this.getCachedActivities();
      if (cachedActivities) {
        this.activities = cachedActivities.sort((a, b) =>
          a.id.localeCompare(b.id, undefined, { sensitivity: 'base' })
        );
        this.fetchActivitiesFromServer().catch((err) =>
          console.error('Error refreshing activities:', err)
        );
        return;
      }
      await this.fetchActivitiesFromServer();
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  private async fetchActivitiesFromServer() {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'activities'),
        where('Active', '==', true),
        limit(100)
      )
    );

    this.activities = querySnapshot.docs
      .map((doc) => ({ id: doc.id }))
      .sort((a, b) =>
        a.id.localeCompare(b.id, undefined, { sensitivity: 'base' })
      );
    this.cacheActivities(this.activities);
  }
  private cacheActivities(activities: any[]) {
    const cacheItem = {
      timestamp: Date.now(),
      data: activities,
    };
    localStorage.setItem('cached_activities', JSON.stringify(cacheItem));
  }
  private getCachedActivities(): any[] | null {
    const cached = localStorage.getItem('cached_activities');
    if (!cached) return null;

    const cacheItem = JSON.parse(cached);
    const cacheAge = Date.now() - cacheItem.timestamp;

    if (cacheAge < 24 * 60 * 60 * 1000) {
      return cacheItem.data;
    }

    return null;
  }

  changeTimeFrom(event: any) {
    const value = event.detail.value;
    if (this.trackerForm.get('datetime')) {
      this.trackerForm.get('datetime')?.setValue(value);
    }
    this.updateDocId(value);
    this.checkExistingEntries();
  }

  changeTimeTo(event: any) {
    const value = event.detail.value;
    if (this.trackerForm.get('datetimeTo')) {
      this.trackerForm.get('datetimeTo')?.setValue(value);
    }
    this.checkExistingEntries();
  }

  updateDocId(datetime: string) {
    const formattedDateTime = this.convertToLocalTimezone(new Date(datetime));
    this.docId = formattedDateTime.replace(/[-:T]/g, '').slice(0, -7);
  }
  async fetchLastUpdatedDateTime() {
    try {
      const cachedDateTime = this.getCachedLastDateTime();
      if (cachedDateTime) {
        this.lastUpdatedDateTime = cachedDateTime;
        this.setDateTimeElements();
        this.fetchLastUpdatedDateTimeFromServer().catch((err) =>
          console.error('Error refreshing last datetime:', err)
        );
        return;
      }
      await this.fetchLastUpdatedDateTimeFromServer();
    } catch (error) {
      console.error('Error fetching last updated date time:', error);
      this.lastUpdatedDateTime = new Date().toISOString();
      this.setDateTimeElements();
      throw error;
    }
  }

  private async fetchLastUpdatedDateTimeFromServer() {
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
      this.cacheLastDateTime(this.lastUpdatedDateTime);
      this.setDateTimeElements();
    } else {
      this.lastUpdatedDateTime = new Date().toISOString();
      this.setDateTimeElements();
    }
  }
  private cacheLastDateTime(dateTime: string) {
    const cacheItem = {
      timestamp: Date.now(),
      data: dateTime,
    };
    localStorage.setItem('cached_last_datetime', JSON.stringify(cacheItem));
  }
  private getCachedLastDateTime(): string | null {
    const cached = localStorage.getItem('cached_last_datetime');
    if (!cached) return null;

    const cacheItem = JSON.parse(cached);
    const cacheAge = Date.now() - cacheItem.timestamp;

    if (cacheAge < 60 * 60 * 1000) {
      return cacheItem.data;
    }

    return null;
  }
  async submitData() {
    this.isSubmitting = true;
    this.submitButtonText = 'Submitting...';

    const formData = this.trackerForm.value;
    const activity = formData.activity ?? '';
    const datetime = formData.datetime ?? '';
    const datetimeTo = formData.datetimeTo ?? '';

    if (!this.validateFormData(activity, datetime, datetimeTo)) {
      this.isSubmitting = false;
      this.submitButtonText = 'Submit';
      return;
    }

    try {
      const startDateTime = new Date(formData.datetime ?? '');
      const endDateTime = new Date(formData.datetimeTo ?? '');

      const hoursDiff =
        (endDateTime.getTime() - startDateTime.getTime()) / 36e5;

      if (hoursDiff > 8) {
        const warnAlert = await this.alertController.create({
          header: 'Large Entry',
          message:
            'You are about to submit more than 8 hours at once. Continue?',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Continue',
              role: 'confirm',
            },
          ],
        });
        await warnAlert.present();
        const { role } = await warnAlert.onDidDismiss();
        if (role !== 'confirm') {
          this.isSubmitting = false;
          this.submitButtonText = 'Submit';
          return;
        }
      }

      await this.batchWriteTimeEntries(startDateTime, endDateTime, activity);

      this.trackerForm.reset();

      localStorage.removeItem('cached_last_datetime');
      await this.fetchLastUpdatedDateTime();

      this.existingDocIds = [];

      this.submitButtonText = 'Submitted';
    } catch (e) {
      console.error('Error adding document: ', e);

      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to submit data. Please try again.',
        buttons: ['OK'],
      });
      await errorAlert.present();
    } finally {
      this.isSubmitting = false;
      setTimeout(() => (this.submitButtonText = 'Submit'), 2000);
    }
  }

  private async validateFormData(
    activity: string,
    datetime: string,
    datetimeTo: string
  ): Promise<boolean> {
    if (!activity) {
      const alert = await this.alertController.create({
        header: 'Missing Information',
        message: 'Please select an activity.',
        buttons: ['OK'],
      });
      await alert.present();
      return false;
    }

    if (!datetime || !datetimeTo) {
      const alert = await this.alertController.create({
        header: 'Missing Information',
        message: 'Please enter a time range.',
        buttons: ['OK'],
      });
      await alert.present();
      return false;
    }

    return true;
  }
  private async batchWriteTimeEntries(
    startDateTime: Date,
    endDateTime: Date,
    activity: string
  ): Promise<void> {
    let current = new Date(startDateTime.getTime());
    const batchSize = 500;
    let batch = writeBatch(db);
    let operationCount = 0;
    while (current < endDateTime) {
      if (operationCount >= batchSize) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }

      const docId = this.formatDateForDocId(current);
      const docRef = doc(db, 'tracker', docId);
      batch.set(docRef, { Activity: activity });

      current.setMinutes(current.getMinutes() + 15);
      operationCount++;
    }
    if (operationCount > 0) {
      await batch.commit();
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

  async checkExistingEntries(): Promise<void> {
    const start = this.trackerForm.get('datetime')?.value;
    const end = this.trackerForm.get('datetimeTo')?.value;
    if (!start || !end) {
      this.existingDocIds = [];
      return;
    }
    const startId = this.formatDateForDocId(new Date(start));
    const endId = this.formatDateForDocId(new Date(end));
    const snapshot = await getDocs(
      query(
        collection(db, 'tracker'),
        orderBy('__name__'),
        startAt(startId),
        endBefore(endId)
      )
    );
    this.existingDocIds = snapshot.docs.map((d) => d.id);
  }
  async deleteExistingEntries(): Promise<void> {
    if (this.existingDocIds.length === 0) return;
    this.isDeletingEntries = true;
    this.deleteButtonText = 'Deleting...';
    let batch = writeBatch(db);
    let count = 0;
    for (const id of this.existingDocIds) {
      if (count >= 500) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
      batch.delete(doc(db, 'tracker', id));
      count++;
    }
    if (count > 0) {
      await batch.commit();
    }
    this.trackerForm.reset();
    this.existingDocIds = [];
    localStorage.removeItem('cached_last_datetime');
    await this.fetchLastUpdatedDateTime();
    this.deleteButtonText = 'Deleted';
    this.isDeletingEntries = false;
    setTimeout(() => (this.deleteButtonText = 'Delete'), 2000);
  }
  private searchString: string = '';
  private typingTimer: any;
  private typingTimeout: number = 1000;
  private lastKey: string = '';
  private currentMatchIndex: number = 0;
  private lastKeyPressTime: number = 0;
  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      this.submitData();
      event.preventDefault();
      return;
    }
    
    if (event.shiftKey && event.key === 'Backspace') {
      if (this.existingDocIds.length > 0 && !this.isDeletingEntries) {
        this.deleteExistingEntries();
        event.preventDefault();
      }
      return;
    }
    
    if (!event.ctrlKey && !event.altKey && !event.metaKey) {
      if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
        this.adjustEndTime(1);
        event.preventDefault();
        return;
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
        this.adjustEndTime(-1);
        event.preventDefault();
        return;
      }
    }
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      return;
    }

    this.handleKeyboardNavigation(event);
  }
  async handleKeyboardNavigation(event: any) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const key = event.key.toLowerCase();
    const currentTime = Date.now();
    if (/^[a-z0-9]$/i.test(key)) {
      clearTimeout(this.typingTimer);
      if (currentTime - this.lastKeyPressTime < this.typingTimeout) {
        this.searchString += key;
      } else {
        this.searchString = key;
      }
      this.currentMatchIndex = 0;
      this.findAndSelectMatch();
      this.lastKey = key;
      this.lastKeyPressTime = currentTime;
      this.typingTimer = setTimeout(() => {
        this.searchString = '';
        this.currentMatchIndex = 0;
      }, this.typingTimeout);
    } else if (key === 'escape') {
      this.searchString = '';
      this.currentMatchIndex = 0;
    } else if (key === 'enter') {
      this.searchString = '';
      this.currentMatchIndex = 0;
    } else if (key === 'tab') {
      this.cycleToNextMatch();
    }
  }

  private async cycleToNextMatch() {
    const matchingOptions = this.activities.filter((activity) =>
      activity.id.toLowerCase().startsWith(this.searchString.toLowerCase())
    );

    if (matchingOptions.length > 0) {
      this.currentMatchIndex =
        (this.currentMatchIndex + 1) % matchingOptions.length;

      const activityControl = this.trackerForm.get('activity');
      if (activityControl) {
        activityControl.setValue(matchingOptions[this.currentMatchIndex].id);
      }
    }
  }

  private async findAndSelectMatch() {
    const matchingOptions = this.activities.filter((activity) =>
      activity.id.toLowerCase().startsWith(this.searchString.toLowerCase())
    );

    if (matchingOptions.length > 0) {
      const activityControl = this.trackerForm.get('activity');
      if (activityControl) {
        activityControl.setValue(matchingOptions[this.currentMatchIndex].id);
      }
    }
  }

  adjustEndTime(direction: number): void {
    const datetimeToControl = this.trackerForm.get('datetimeTo');
    const datetimeFromControl = this.trackerForm.get('datetime');

    if (!datetimeToControl || !datetimeToControl.value) return;
    if (!datetimeFromControl || !datetimeFromControl.value) return;

    const startDate = new Date(datetimeFromControl.value);
    const currentEndDate = new Date(datetimeToControl.value);

    const newEndDate = new Date(currentEndDate);
    newEndDate.setMinutes(newEndDate.getMinutes() + 15 * direction);

    if (direction < 0 && newEndDate <= startDate) {
      return;
    }

    const timezoneOffset = newEndDate.getTimezoneOffset() * 60000;
    const newDateTimeValue = new Date(newEndDate.getTime() - timezoneOffset)
      .toISOString()
      .slice(0, -1);

    datetimeToControl.setValue(newDateTimeValue);
  }
}
