import { Component, OnInit } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  getDocs,
  where,
  orderBy,
  documentId,
} from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { register } from 'swiper/element/bundle';

register();

const app = initializeApp(environment.firebase);
const db = getFirestore(app);

const categoryColors = {
  Other: '#222222',
  Sleeping: '#0A2463',
  Work: '#1E5631',
  Productive: '#6A0DAD',
};

interface TimelineActivity {
  name: string;
  color: string;
}

interface TimelineDay {
  date: Date;
  activities: TimelineActivity[];
}

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
})
export class TimelineComponent implements OnInit {
  public timelineData: TimelineDay[] = [];

  public startDate: string;
  public endDate: string;

  constructor() {
    const today = new Date();
    this.startDate = today.toISOString();
    this.endDate = today.toISOString();
  }

  ngOnInit() {
    this.updateTimelineData();
  }

  async fetchTimelineData(): Promise<TimelineDay[]> {
    const startTimestamp = new Date(this.startDate).setHours(0, 0, 0, 0);
    const endTimestamp = new Date(this.endDate).setHours(23, 45, 0, 0);

    const startId = this.formatDate(new Date(startTimestamp));
    const endId = this.formatDate(new Date(endTimestamp)) + '\uf8ff';

    const trackerQuery = query(
      collection(db, 'tracker'),
      where(documentId(), '>=', startId),
      where(documentId(), '<=', endId),
      orderBy(documentId(), 'desc')
    );

    const trackerSnapshot = await getDocs(trackerQuery);

    const activityMap = new Map<string, any>();
    const activitiesQuery = query(collection(db, 'activities'));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    activitiesSnapshot.forEach((doc) => {
      activityMap.set(doc.id, doc.data());
    });

    const timelineData: TimelineDay[] = [];

    trackerSnapshot.forEach((doc) => {
      const activityId = doc.id;
      const date = new Date(
        parseInt(activityId.slice(0, 4)),
        parseInt(activityId.slice(4, 6)) - 1,
        parseInt(activityId.slice(6, 8)),
        parseInt(activityId.slice(8, 10)),
        parseInt(activityId.slice(10, 12)),
        0
      );

      const activity = doc.data()['Activity'];
      if (activity) {
        const activityData = activityMap.get(activity);
        if (activityData) {
          let color = categoryColors.Other;
          if (activity === 'Sleeping') {
            color = categoryColors.Sleeping;
          } else if (activityData['Work']) {
            color = categoryColors.Work;
          } else if (activityData['Productive']) {
            color = categoryColors.Productive;
          }

          const timelineActivity: TimelineActivity = {
            name: activity,
            color,
          };

          const existingDayIndex = timelineData.findIndex(
            (day) => day.date.getTime() === date.getTime()
          );

          if (existingDayIndex !== -1) {
            timelineData[existingDayIndex].activities.push(timelineActivity);
          } else {
            const timelineDay: TimelineDay = {
              date,
              activities: [timelineActivity],
            };
            timelineData.push(timelineDay);
          }
        }
      }
    });

    return timelineData;
  }

  async updateTimelineData() {
    this.timelineData = await this.fetchTimelineData();
  }

  formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  onDateChange() {
    this.updateTimelineData();
  }

  getCategoryFromColor(color: string): string {
    switch (color) {
      case categoryColors.Sleeping:
        return 'Sleeping';
      case categoryColors.Work:
        return 'Work';
      case categoryColors.Productive:
        return 'Productive';
      default:
        return 'Other';
    }
  }

  onCategoryChange() {
    this.updateTimelineData();
  }
}
