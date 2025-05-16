import { Component, OnInit } from '@angular/core';
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
import { ToastController } from '@ionic/angular';

export const app = initializeApp(environment.firebase);
export const db = getFirestore(app);

@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
})
export class ActivitiesComponent implements OnInit {
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
}
