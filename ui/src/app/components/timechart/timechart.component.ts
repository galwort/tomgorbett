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
  sleep: number;
  other: number;
}

interface ChartData {
  labels: string[];
  screenTimeData: number[];
  workData: number[];
  productiveData: number[];
  sleepData: number[];
  otherData: number[];
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
    console.log('Component initialized. Fetching chart data...');
    const chartData = await this.fetchChartData();
    console.log('Chart data fetched:', chartData);
    this.initializeChart(chartData);
  }

  getDefaultDateRange(): { startDate: string; endDate: string } {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const endDate = currentDate.toISOString().split('T')[0].replace(/-/g, '');

    const startOfWeekOffset = currentDate.getDay() === 0 ? -6 : 1;
    const startDate = new Date(currentDate);
    startDate.setDate(
      currentDate.getDate() - currentDate.getDay() + startOfWeekOffset - 13
    );
    startDate.setHours(0, 0, 0, 0);
    const startDateString = `${startDate.getFullYear()}${(
      startDate.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}${startDate.getDate().toString().padStart(2, '0')}`;

    console.log('Default date range:', {
      startDate: startDateString,
      endDate: endDate,
    });
    return { startDate: startDateString, endDate: endDate };
  }

  async fetchChartData(): Promise<ChartData> {
    const { startDate, endDate } = this.getDefaultDateRange();

    console.log(
      'Fetching data from Firestore between',
      startDate,
      'and',
      endDate
    );

    const activitiesQuery = query(collection(this.db, 'activities'));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    let activitiesMap = new Map();
    activitiesSnapshot.forEach((doc) => {
      activitiesMap.set(doc.id, doc.data());
    });

    console.log('Activities data fetched:', activitiesMap);

    const trackerQuery = query(collection(this.db, 'tracker'));
    const trackerSnapshot = await getDocs(trackerQuery);

    let weeklyData: Record<string, DailyData> = {};

    trackerSnapshot.docs.forEach((trackerDoc) => {
      const docId = trackerDoc.id;
      const docDate = docId.substring(0, 8);

      if (docDate >= startDate && docDate <= endDate) {
        const data = trackerDoc.data();
        if (data['Activity']) {
          const activityData = activitiesMap.get(data['Activity']);
          if (activityData) {
            const weekNumber = this.getWeekNumber(
              new Date(
                parseInt(docDate.substring(0, 4)),
                parseInt(docDate.substring(4, 6)) - 1,
                parseInt(docDate.substring(6, 8))
              )
            );

            if (!weeklyData[weekNumber]) {
              weeklyData[weekNumber] = {
                screenTime: 0,
                work: 0,
                productive: 0,
                sleep: 0,
                other: 0,
              };
            }

            weeklyData[weekNumber].screenTime += activityData['Screen_Time']
              ? activityData['Screen_Time'] / 4
              : 0;
            weeklyData[weekNumber].work += activityData['Work']
              ? activityData['Work'] / 4
              : 0;
            weeklyData[weekNumber].productive += activityData['Productive']
              ? activityData['Productive'] / 4
              : 0;
            weeklyData[weekNumber].sleep += activityData['Sleep']
              ? activityData['Sleep'] / 4
              : 0;
            weeklyData[weekNumber].other += activityData['Other']
              ? activityData['Other'] / 4
              : 0;
          }
        }
      }
    });

    console.log('Weekly data processed:', weeklyData);

    let chartData: ChartData = {
      labels: Object.keys(weeklyData).sort(),
      screenTimeData: Object.values(weeklyData).map((d) => d.screenTime),
      workData: Object.values(weeklyData).map((d) => d.work),
      productiveData: Object.values(weeklyData).map((d) => d.productive),
      sleepData: Object.values(weeklyData).map((d) => d.sleep),
      otherData: Object.values(weeklyData).map((d) => d.other),
    };

    console.log('Final chart data prepared:', chartData);

    return chartData;
  }

  initializeChart(chartData: ChartData) {
    console.log('Initializing chart with data:', chartData);
    const canvas = document.getElementById('myChart') as HTMLCanvasElement;
    console.log('Canvas element:', canvas);

    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Screen Time',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgb(255, 99, 132)',
            data: chartData.screenTimeData,
            fill: true,
          },
          {
            label: 'Work',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            data: chartData.workData,
            fill: true,
          },
          {
            label: 'Productive',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgb(75, 192, 192)',
            data: chartData.productiveData,
            fill: true,
          },
          {
            label: 'Sleep',
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
            borderColor: 'rgb(153, 102, 255)',
            data: chartData.sleepData,
            fill: true,
          },
          {
            label: 'Other',
            backgroundColor: 'rgba(255, 159, 64, 0.5)',
            borderColor: 'rgb(255, 159, 64)',
            data: chartData.otherData,
            fill: true,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            stacked: true,
            title: {
              display: true,
              text: 'Hours',
            },
          },
          x: {
            ticks: {
              padding: 10,
            },
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 40,
            },
          },
        },
      },
    });

    console.log('Chart initialized:', this.chart);
  }

  getWeekNumber(date: Date): string {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return `${date.getFullYear()}-W${Math.ceil(
      (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
    )}`;
  }
}
