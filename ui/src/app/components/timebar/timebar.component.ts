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
  selector: 'app-timebar',
  templateUrl: './timebar.component.html',
  styleUrls: ['./timebar.component.scss'],
})
export class TimebarComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    indexAxis: 'y',
    scales: {
      x: { stacked: true },
      y: { ticks: { mirror: true } },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: '#6FFF00',
      },
    ],
  };

  public barChartType: ChartType = 'bar';

  constructor() {}

  async ngOnInit() {
    const chartData = await this.fetchChartData();
    this.updateChartData(chartData);
  }

  async fetchChartData(): Promise<{ labels: string[]; data: number[] }> {
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - 7);

    const formattedStartDate = startDate
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    const formattedEndDate = currentDate
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    const startId = formattedStartDate;
    const endId = formattedEndDate + '\uf8ff';

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

    const activityTimes = new Map<string, number>();

    trackerSnapshot.forEach((doc) => {
      const activity = doc.data()['Activity'];
      if (activity) {
        const activityData = activityMap.get(activity);
        if (activityData) {
          const currentTime = activityTimes.get(activity) || 0;
          activityTimes.set(activity, currentTime + 0.25);
        }
      }
    });

    const sortedActivities = Array.from(activityTimes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const labels = sortedActivities.map(([activity]) => activity);
    const data = sortedActivities.map(([, time]) => time);

    return { labels, data };
  }

  updateChartData(chartData: { labels: string[]; data: number[] }) {
    this.barChartData.labels = chartData.labels;
    this.barChartData.datasets[0].data = chartData.data;
    if (this.chart) {
      this.chart.update();
    } else {
      console.warn('Chart reference is not available.');
    }
  }
}
