import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { environment } from 'src/environments/environment';

export const app = initializeApp(environment.firebase);
export const db = getFirestore(app);

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

  async fetchChartData() {
    const trackerQuery = query(collection(this.db, 'tracker'));
    const trackerDocs = await getDocs(trackerQuery);

    let chartData = {
      labels: [],
      screenTimeData: [],
      workData: [],
      productiveData: []
    };

    for (const trackerDoc of trackerDocs.docs) {
      const data = trackerDoc.data();
      const activityRef = doc(this.db, 'activities', data['Activity']);
      const activityDoc = await getDoc(activityRef);

      if (activityDoc.exists()) {
        const activityData = activityDoc.data();
        chartData.labels.push(doc.id);
        chartData.screenTimeData.push(activityData['screen_time'] ? 1 : 0);
        chartData.workData.push(activityData['work'] ? 1 : 0);
        chartData.productiveData.push(activityData['productive'] ? 1 : 0);
      }
    }

    return chartData;
  }

  initializeChart(chartData) {
    this.chart = new Chart('myChart', {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Screen Time',
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          data: chartData.screenTimeData,
        },
        {
          label: 'Work',
          backgroundColor: 'rgb(54, 162, 235)',
          borderColor: 'rgb(54, 162, 235)',
          data: chartData.workData,
        },
        {
          label: 'Productive',
          backgroundColor: 'rgb(75, 192, 192)',
          borderColor: 'rgb(75, 192, 192)',
          data: chartData.productiveData,
        }]
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
