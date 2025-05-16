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

  isSubmitting: boolean = false;
  submitButtonText: string = 'Submit';

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

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
    this.isSubmitting = true;
    this.submitButtonText = 'Submitting...';

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
  private searchString: string = '';
  private typingTimer: any;
  private typingTimeout: number = 1000; // 1 second timeout
  private lastKey: string = '';
  private currentMatchIndex: number = 0;
  private lastKeyPressTime: number = 0;

  /**
   * Global keyboard event listener that works even when select is not focused
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // Only handle if we're not in an input field or textarea
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      return;
    }

    this.handleKeyboardNavigation(event);
  }
  /**
   * Jump to activities that start with the typed keys
   * @param event Keyboard event
   */
  async handleKeyboardNavigation(event: any) {
    // Ignore special keys like Shift, Control, Alt, etc.
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const key = event.key.toLowerCase();
    const currentTime = Date.now();

    // Only handle alphanumeric and some special characters
    if (/^[a-z0-9]$/i.test(key)) {
      // Clear the timer if it exists
      clearTimeout(this.typingTimer);

      // Add to the search string
      if (currentTime - this.lastKeyPressTime < this.typingTimeout) {
        // If typing quickly, append to the current search string
        this.searchString += key;
      } else {
        // Start a new search string
        this.searchString = key;
      }

      // Reset match index when search string changes
      this.currentMatchIndex = 0;

      // Find and select matching activities
      this.findAndSelectMatch();

      // Update last key press data
      this.lastKey = key;
      this.lastKeyPressTime = currentTime;

      // Set a timer to clear the search string after the timeout
      this.typingTimer = setTimeout(() => {
        this.searchString = '';
        this.currentMatchIndex = 0;
      }, this.typingTimeout);
    } else if (key === 'escape') {
      // Clear search string on Escape
      this.searchString = '';
      this.currentMatchIndex = 0;
    } else if (key === 'enter') {
      // Clear search string on Enter
      this.searchString = '';
      this.currentMatchIndex = 0;
    } else if (key === 'tab') {
      // Cycle to next match on Tab
      this.cycleToNextMatch();
    }
  }
  /**
   * Cycles to the next matching activity
   */
  private async cycleToNextMatch() {
    // Find all matching options
    const matchingOptions = this.activities.filter((activity) =>
      activity.id.toLowerCase().startsWith(this.searchString.toLowerCase())
    );

    if (matchingOptions.length > 0) {
      // Increment the index or reset to 0 if we reach the end
      this.currentMatchIndex =
        (this.currentMatchIndex + 1) % matchingOptions.length;

      // Select the current match
      const activityControl = this.trackerForm.get('activity');
      if (activityControl) {
        activityControl.setValue(matchingOptions[this.currentMatchIndex].id);
      }
    }
  }
  /**
   * Finds and selects matching activities based on the search string
   */
  private async findAndSelectMatch() {
    // Find matching activities
    const matchingOptions = this.activities.filter((activity) =>
      activity.id.toLowerCase().startsWith(this.searchString.toLowerCase())
    );

    if (matchingOptions.length > 0) {
      // Select the first matching option
      const activityControl = this.trackerForm.get('activity');
      if (activityControl) {
        activityControl.setValue(matchingOptions[this.currentMatchIndex].id);
      }
    }
  }

  async presentSearchToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 1000,
      position: 'top',
      cssClass: 'search-toast',
      color: 'medium',
    });
    toast.present();
  }
}
