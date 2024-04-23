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

const categoryColors = {
  Other: '#222222',
  Sleeping: '#0A2463',
  Work: '#1E5631',
  Productive: '#3CB371',
};

@Component({
  selector: 'app-timebar',
  templateUrl: './timebar.component.html',
  styleUrls: ['./timebar.component.scss'],
})
export class TimebarComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: 'white',
        },
      },
      y: {
        ticks: {
          mirror: true,
          z: 1,
          color: 'white',
        },
      },
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
        backgroundColor: [],
      },
    ],
  };

  public barChartType: ChartType = 'bar';

  constructor() {}

  async ngOnInit() {
    const chartData = await this.fetchChartData();
    this.updateChartData(chartData);
  }

  async fetchChartData(): Promise<{
    labels: string[];
    data: number[];
    colors: string[];
  }> {
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

    const activityTimes = new Map<string, { time: number; color: string }>();

    trackerSnapshot.forEach((doc) => {
      const activity = doc.data()['Activity'];
      if (activity) {
        const activityData = activityMap.get(activity);
        if (activityData) {
          const currentData = activityTimes.get(activity) || {
            time: 0,
            color: categoryColors.Other,
          };

          let color = categoryColors.Other;
          if (activity === 'Sleeping') {
            color = categoryColors.Sleeping;
          } else if (activityData['Work']) {
            color = categoryColors.Work;
          } else if (activityData['Productive']) {
            color = categoryColors.Productive;
          }

          activityTimes.set(activity, {
            time: currentData.time + 0.25,
            color: color,
          });
        }
      }
    });

    const sortedActivities = Array.from(activityTimes.entries())
      .sort((a, b) => b[1].time - a[1].time)
      .slice(0, 10);

    const labels = sortedActivities.map(([activity]) => activity);
    const data = sortedActivities.map(([, { time }]) => time);
    const colors = sortedActivities.map(([, { color }]) => color);

    return { labels, data, colors };
  }

  updateChartData(chartData: {
    labels: string[];
    data: number[];
    colors: string[];
  }) {
    this.barChartData.labels = chartData.labels;
    this.barChartData.datasets[0].data = chartData.data;
    this.barChartData.datasets[0].backgroundColor = chartData.colors;
    if (this.chart) {
      this.chart.update();
    } else {
      console.warn('Chart reference is not available.');
    }
  }
}
