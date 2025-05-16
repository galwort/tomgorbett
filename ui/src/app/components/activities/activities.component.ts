import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { ToastController, IonSelect } from '@ionic/angular';

export const app = initializeApp(environment.firebase);
export const db = getFirestore(app);

@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
})
export class ActivitiesComponent implements OnInit {
  @ViewChild('activitySelect') activitySelect!: IonSelect;

  activityForm = new FormGroup({
    activity: new FormControl(''),
  });

  activities: any[] = [];
  isSelectedActivity = false;
  selectedActivity: any = null;
  updateDisabled: boolean = true;
  updateButtonText: string = 'Update';
  updatedFields: any = {};

  constructor(private toastController: ToastController) {}

  ngOnInit() {
    this.fetchActivities();
    const activityControl = this.activityForm.get('activity');
    if (activityControl) {
      activityControl.valueChanges.subscribe((value) => {
        this.isSelectedActivity = !!value;
        // Reset the updated fields when a new activity is selected
        this.updatedFields = {};
        this.updateDisabled = true;
      });
    }
  }

  async fetchActivities() {
    const querySnapshot = await getDocs(collection(db, 'activities'));
    this.activities = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  onActivityChange(event: any) {
    const selectedActivityId = event.detail.value;
    this.selectedActivity = this.activities.find(
      (activity) => activity.id === selectedActivityId
    );
    this.updateDisabled = true;
    this.updatedFields = {};
  }

  onToggleChange(field: string, event: any) {
    const newValue = event.detail.checked;

    // Store the updated value
    if (!this.updatedFields) {
      this.updatedFields = {};
    }

    this.updatedFields[field] = newValue;

    // Enable the update button when changes are made
    this.updateDisabled = Object.keys(this.updatedFields).length === 0;
  }

  async updateActivity() {
    if (
      !this.selectedActivity ||
      Object.keys(this.updatedFields).length === 0
    ) {
      return;
    }

    try {
      this.updateButtonText = 'Updating...';
      this.updateDisabled = true;

      const activityDoc = doc(db, 'activities', this.selectedActivity.id);
      await updateDoc(activityDoc, this.updatedFields);

      // Update local object with new values
      Object.keys(this.updatedFields).forEach((field) => {
        this.selectedActivity[field] = this.updatedFields[field];
      });

      // Reset updated fields
      this.updatedFields = {};
      this.updateButtonText = 'Update';

      // Show success message
      this.presentToast('Activity updated successfully');
    } catch (error) {
      console.error('Error updating activity:', error);
      this.updateButtonText = 'Update';
      this.updateDisabled = false;
      this.presentToast('Error updating activity');
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: message.includes('Error') ? 'danger' : 'success',
    });
    toast.present();
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
    // Check for Ctrl+Enter to submit the form (update activity)
    if (event.ctrlKey && event.key === 'Enter') {
      if (!this.updateDisabled) {
        this.updateActivity();
      }
      event.preventDefault();
      return;
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
      const activityControl = this.activityForm.get('activity');
      if (activityControl) {
        activityControl.setValue(matchingOptions[this.currentMatchIndex].id);
        this.selectedActivity = matchingOptions[this.currentMatchIndex];
        this.updateDisabled = true;
        this.updatedFields = {};
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
      const activityControl = this.activityForm.get('activity');
      if (activityControl) {
        activityControl.setValue(matchingOptions[this.currentMatchIndex].id);
        this.selectedActivity = matchingOptions[this.currentMatchIndex];
        this.updateDisabled = true;
        this.updatedFields = {};
      }
    }
  }
}
