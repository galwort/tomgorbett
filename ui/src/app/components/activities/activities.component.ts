import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { environment } from 'src/environments/environment';

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

  constructor() {}

  ngOnInit() {
    this.fetchActivities();
    const activityControl = this.activityForm.get('activity');
    if (activityControl) {
      activityControl.valueChanges.subscribe((value) => {
        this.isSelectedActivity = !!value;
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
  }
}
