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

    if (!this.updatedFields) {
      this.updatedFields = {};
    }

    this.updatedFields[field] = newValue;

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

      Object.keys(this.updatedFields).forEach((field) => {
        this.selectedActivity[field] = this.updatedFields[field];
      });

      this.updatedFields = {};
      this.updateButtonText = 'Update';

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
  private typingTimeout: number = 1000;
  private lastKey: string = '';
  private currentMatchIndex: number = 0;
  private lastKeyPressTime: number = 0;

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      if (!this.updateDisabled) {
        this.updateActivity();
      }
      event.preventDefault();
      return;
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

      const activityControl = this.activityForm.get('activity');
      if (activityControl) {
        activityControl.setValue(matchingOptions[this.currentMatchIndex].id);
        this.selectedActivity = matchingOptions[this.currentMatchIndex];
        this.updateDisabled = true;
        this.updatedFields = {};
      }
    }
  }

  private async findAndSelectMatch() {
    const matchingOptions = this.activities.filter((activity) =>
      activity.id.toLowerCase().startsWith(this.searchString.toLowerCase())
    );

    if (matchingOptions.length > 0) {
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
