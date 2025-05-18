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

  // Add loading and error states
  isLoading: boolean = true;
  loadError: string | null = null;
  isSubmitting: boolean = false;
  submitButtonText: string = 'Submit';

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadInitialData();
  }
  // Method to handle initial data loading with better error handling
  async loadInitialData() {
    try {
      this.isLoading = true;
      this.loadError = null;

      // Load data in parallel for better performance
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
  // Method intentionally removed

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
    try {
      // Add cache timeout to prevent excessive refreshes
      const cachedActivities = this.getCachedActivities();
      if (cachedActivities) {
        this.activities = cachedActivities;
        return;
      }

      // Add limit to query to improve performance
      const querySnapshot = await getDocs(
        query(
          collection(db, 'activities'),
          where('Active', '==', true),
          limit(100) // Limit results to prevent loading too much data
        )
      );

      this.activities = querySnapshot.docs.map((doc) => ({ id: doc.id }));

      // Cache the activities
      this.cacheActivities(this.activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  // Cache activities in localStorage to avoid repeated Firestore calls
  private cacheActivities(activities: any[]) {
    const cacheItem = {
      timestamp: Date.now(),
      data: activities,
    };
    localStorage.setItem('cached_activities', JSON.stringify(cacheItem));
  }

  // Get cached activities if available and not expired
  private getCachedActivities(): any[] | null {
    const cached = localStorage.getItem('cached_activities');
    if (!cached) return null;

    const cacheItem = JSON.parse(cached);
    const cacheAge = Date.now() - cacheItem.timestamp;

    // Cache valid for 24 hours
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
    try {
      // Check if we have a cached last updated time that's recent (last hour)
      const cachedDateTime = this.getCachedLastDateTime();
      if (cachedDateTime) {
        this.lastUpdatedDateTime = cachedDateTime;
        this.setDateTimeElements();
        return;
      }

      // Add a starting point to query to improve performance
      // Only look at records from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startKey = this.formatDateForDocId(thirtyDaysAgo);

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

        // Cache the last updated time
        this.cacheLastDateTime(this.lastUpdatedDateTime);
        this.setDateTimeElements();
      } else {
        // If no records found, use current time
        this.lastUpdatedDateTime = new Date().toISOString();
        this.setDateTimeElements();
      }
    } catch (error) {
      console.error('Error fetching last updated date time:', error);

      // Fallback to current time if there's an error
      this.lastUpdatedDateTime = new Date().toISOString();
      this.setDateTimeElements();
      throw error;
    }
  }

  // Cache the last updated date time
  private cacheLastDateTime(dateTime: string) {
    const cacheItem = {
      timestamp: Date.now(),
      data: dateTime,
    };
    localStorage.setItem('cached_last_datetime', JSON.stringify(cacheItem));
  }

  // Get cached last updated date time if not expired
  private getCachedLastDateTime(): string | null {
    const cached = localStorage.getItem('cached_last_datetime');
    if (!cached) return null;

    const cacheItem = JSON.parse(cached);
    const cacheAge = Date.now() - cacheItem.timestamp;

    // Cache valid for 1 hour
    if (cacheAge < 60 * 60 * 1000) {
      return cacheItem.data;
    }

    return null;
  }  async submitData() {
    this.isSubmitting = true;
    this.submitButtonText = 'Submitting...';

    const formData = this.trackerForm.value;
    const activity = formData.activity ?? '';
    const datetime = formData.datetime ?? '';
    const datetimeTo = formData.datetimeTo ?? '';

    // Validate form data first
    if (!this.validateFormData(activity, datetime, datetimeTo)) {
      this.isSubmitting = false;
      this.submitButtonText = 'Submit';
      return;
    }

    try {
      const startDateTime = new Date(formData.datetime ?? '');
      const endDateTime = new Date(formData.datetimeTo ?? '');

      // Batch writes for better performance
      await this.batchWriteTimeEntries(startDateTime, endDateTime, activity);

      // Reset form and update
      this.trackerForm.reset();
      await this.fetchLastUpdatedDateTime();

      // Remove the cached date-time since we've added new entries
      localStorage.removeItem('cached_last_datetime');

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

  // Helper method to validate form data
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
  // Method intentionally removed
  // Use batched writes for better performance
  private async batchWriteTimeEntries(
    startDateTime: Date,
    endDateTime: Date,
    activity: string
  ): Promise<void> {
    let current = new Date(startDateTime.getTime());
    const batchSize = 500; // Firestore batch limit is 500
    let batch = writeBatch(db);
    let operationCount = 0;

    while (current < endDateTime) {
      // Create a new batch if needed
      if (operationCount >= batchSize) {
        // Commit the current batch
        await batch.commit();

        // Create a new batch
        batch = writeBatch(db);
        operationCount = 0;
      }

      const docId = this.formatDateForDocId(current);
      const docRef = doc(db, 'tracker', docId);
      batch.set(docRef, { Activity: activity });

      current.setMinutes(current.getMinutes() + 15);
      operationCount++;
    }

    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit();
    }
  }
  // Methods intentionally removed

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
    // Check for Ctrl+Enter to submit the form
    if (event.ctrlKey && event.key === 'Enter') {
      this.submitData();
      event.preventDefault();
      return;
    }

    // Handle arrow keys for adjusting end time
    if (!event.ctrlKey && !event.altKey && !event.metaKey) {
      if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
        this.adjustEndTime(1); // Increase end time by 15 minutes
        event.preventDefault();
        return;
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
        this.adjustEndTime(-1); // Decrease end time by 15 minutes
        event.preventDefault();
        return;
      }
    }

    // Only handle other keyboard shortcuts if we're not in an input field or textarea
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
  /**
   * Adjusts end time by 15-minute increments
   * @param direction 1 for forward, -1 for backward
   */
  adjustEndTime(direction: number): void {
    const datetimeToControl = this.trackerForm.get('datetimeTo');
    const datetimeFromControl = this.trackerForm.get('datetime');

    if (!datetimeToControl || !datetimeToControl.value) return;
    if (!datetimeFromControl || !datetimeFromControl.value) return;

    // Get current start and end dates
    const startDate = new Date(datetimeFromControl.value);
    const currentEndDate = new Date(datetimeToControl.value);

    // Adjust by 15 minutes in the specified direction
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMinutes(newEndDate.getMinutes() + 15 * direction);

    // Validate that the new end time is after the start time when decreasing
    if (direction < 0 && newEndDate <= startDate) {
      // Don't allow end time to be before start time
      return;
    }

    // Format as ISO string and update the control
    const timezoneOffset = newEndDate.getTimezoneOffset() * 60000;
    const newDateTimeValue = new Date(newEndDate.getTime() - timezoneOffset)
      .toISOString()
      .slice(0, -1);

    datetimeToControl.setValue(newDateTimeValue);
  }
}
