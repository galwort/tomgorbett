import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
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
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
})
export class ActivitiesComponent implements OnInit {
  activityForm = new FormGroup({
    name: new FormControl(''),
  });

  constructor() {}

  ngOnInit() {
    this.fetchActivities();
  }

  async fetchActivities() {
    const querySnapshot = await getDocs(collection(db, 'activities'));
  }
}
