import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs } from 'firebase/firestore';
import { environment } from 'src/environments/environment';

const app = initializeApp(environment.firebase);
const db = getFirestore(app);

interface DailyData {
  screenTime: number;
  work: number;
  productive: number;
}

interface ChartData {
  labels: string[];
  screenTimeData: number[];
  workData: number[];
  productiveData: number[];
}

@Component({
  selector: 'app-timechart',
  templateUrl: './timechart.component.html',
  styleUrls: ['./timechart.component.scss'],
})
export class TimechartComponent implements OnInit {
  chart: any;
  db = getFirestore(app);

  constructor() {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    const chartData = await this.fetchChartData();
    this.initializeChart(chartData);
  }

  async fetchChartData(): Promise<ChartData> {
    const activitiesQuery = query(collection(this.db, 'activities'));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    let activitiesMap = new Map();
    activitiesSnapshot.forEach(doc => {
      activitiesMap.set(doc.id, doc.data());
    });

    const trackerQuery = query(collection(this.db, 'tracker'));
    const trackerSnapshot = await getDocs(trackerQuery);

    let dailyData: Record<string, DailyData> = {};

    trackerSnapshot.docs.forEach(trackerDoc => {
      const data = trackerDoc.data();
      if (data['Activity']) {
        const activityData = activitiesMap.get(data['Activity']);
        if (activityData) {
          const date = trackerDoc.id.substring(0, 8);
          if (!dailyData[date]) {
            dailyData[date] = { screenTime: 0, work: 0, productive: 0 };
          }
          dailyData[date].screenTime += activityData['Screen_Time'] ? 1 : 0;
          dailyData[date].work += activityData['Work'] ? 1 : 0;
          dailyData[date].productive += activityData['Productive'] ? 1 : 0;
        }
      } else {
        console.log(`Activity is undefined for trackerDoc ID: ${trackerDoc.id}`);
      }
    });

    let chartData: ChartData = {
      labels: Object.keys(dailyData),
      screenTimeData: Object.values(dailyData).map(d => d.screenTime),
      workData: Object.values(dailyData).map(d => d.work),
      productiveData: Object.values(dailyData).map(d => d.productive),
    };

    return chartData;
  }

  initializeChart(chartData: ChartData) {
    this.chart = new Chart('myChart', {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Screen Time',
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          data: chartData.screenTimeData,
        }, {
          label: 'Work',
          backgroundColor: 'rgb(54, 162, 235)',
          borderColor: 'rgb(54, 162, 235)',
          data: chartData.workData,
        }, {
          label: 'Productive',
          backgroundColor: 'rgb(75, 192, 192)',
          borderColor: 'rgb(75, 192, 192)',
          data: chartData.productiveData,
        }],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}
