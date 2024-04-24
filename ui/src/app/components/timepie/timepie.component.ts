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
          let percentage = Math.round((value * 100) / sum) + '%';
          return percentage;
        },
        color: 'white',
        font: (context) => {
          const chart = context.chart;
          const chartHeight = chart.height;
          const chartWidth = chart.width;
          let fontHeight = Math.min(chartHeight, chartWidth) / 16;
          return {
            size: fontHeight,
            weight: 'bold',
          };
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.parsed + ' hours';
            return label;
          },
          title: function () {
            return '';
          },
        },
        displayColors: false,
        bodyFont: {
          size: 24,
        },
      },
    },
  };

  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: ['Work', 'Productive', 'Other', 'Sleeping'],
    datasets: [
      {
        data: [],
        backgroundColor: ['#2E8B57', '#6A0DAD', 'transparent', '#0A2463'],
      },
    ],
  };

  public pieChartType: ChartType = 'pie';

  public otherHours = 0;
  public sleepingHours = 0;
  public workHours = 0;
  public productiveHours = 0;

  public startDate: string;
  public endDate: string;

  constructor() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.startDate = yesterday.toISOString();
    this.endDate = yesterday.toISOString();
  }

  async ngOnInit() {
    await this.fetchChartData();
  }

  async fetchChartData() {
    const startTimestamp = new Date(this.startDate).setHours(0, 0, 0, 0);
    const endTimestamp = new Date(this.endDate).setHours(23, 45, 0, 0);

    const startId = this.formatDate(new Date(startTimestamp));
    const endId = this.formatDate(new Date(endTimestamp)) + '\uf8ff';

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

    this.updateChartData([other, sleeping, work, productive]);
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

  formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  onDateChange() {
    this.fetchChartData();
  }
}
