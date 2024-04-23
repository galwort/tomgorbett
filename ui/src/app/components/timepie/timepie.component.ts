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
import {
  ChartConfiguration,
  ChartData,
  ChartType,
  Chart,
  registerables,
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);

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
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        formatter: (value, ctx) => {
          let sum = 0;
          let dataArr = ctx.chart.data.datasets[0].data;
          dataArr.map((data) => {
            if (typeof data === 'number') {
              sum += data;
            } else {
              console.warn('Unexpected data type encountered:', data);
            }
          });
          let percentage = ((value * 100) / sum).toFixed(2) + '%';
          return percentage;
        },
        color: 'white',
        font: {
          weight: 'bold',
          size: 16,
        },
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

  public otherHours = 0;
  public sleepingHours = 0;
  public workHours = 0;
  public productiveHours = 0;

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
    [
      this.otherHours,
      this.sleepingHours,
      this.workHours,
      this.productiveHours,
    ] = data;
    if (this.chart) {
      this.chart.update();
    } else {
      console.warn('Chart reference is not available.');
    }
  }
}
