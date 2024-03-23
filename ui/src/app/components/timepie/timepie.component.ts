import { Component, OnInit, ViewChild } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  getDocs,
  where,
  documentId,
} from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

const app = initializeApp(environment.firebase);
const db = getFirestore(app);

@Component({
  selector: 'app-timepie',
  templateUrl: './timepie.component.html',
  styleUrls: ['./timepie.component.scss'],
})
export class TimepieComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
  };

  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: ['Other', 'Sleeping', 'Work', 'Productive'],
    datasets: [
      {
        data: [],
        backgroundColor: ['#222222', '#0A2463', '#2E8B57', '#6FFF00'],
      },
    ],
  };

  public pieChartType: ChartType = 'pie';

  constructor() {}

  async ngOnInit() {
    const chartData = await this.fetchChartData();
    this.updateChartData(chartData);
  }

  async fetchChartData(): Promise<number[]> {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1);
    const formattedDate = currentDate
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    const startId = formattedDate;
    const endId = formattedDate + '\uf8ff';

    const trackerQuery = query(
      collection(db, 'tracker'),
      where(documentId(), '>=', startId),
      where(documentId(), '<=', endId)
    );

    const trackerSnapshot = await getDocs(trackerQuery);

    const activityMap = new Map<string, any>();
    const activitiesQuery = query(collection(db, 'activities'));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    activitiesSnapshot.forEach((doc) => {
      activityMap.set(doc.id, doc.data());
    });

    let sleeping = 0;
    let work = 0;
    let productive = 0;
    let other = 0;

    const loggedActivities = new Set<string>();

    trackerSnapshot.forEach((doc) => {
      const activity = doc.data()['Activity'];
      if (activity) {
        const activityData = activityMap.get(activity);
        if (activityData) {
          if (activity === 'Sleeping') {
            sleeping += 0.25;
          } else if (activityData['Work']) {
            work += 0.25;
          } else if (activityData['Productive']) {
            productive += 0.25;
          } else {
            other += 0.25;
          }
        } else {
          if (!loggedActivities.has(activity)) {
            console.log('Activity data not found for:', activity);
            loggedActivities.add(activity);
          }
        }
      }
    });

    return [other, sleeping, work, productive];
  }

  updateChartData(data: number[]) {
    this.pieChartData.datasets[0].data = data;
    if (this.chart) {
      this.chart.update();
    } else {
      console.warn('Chart reference is not available.');
    }
  }
}
