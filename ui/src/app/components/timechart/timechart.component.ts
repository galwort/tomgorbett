import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs } from 'firebase/firestore';
import { environment } from 'src/environments/environment';

const app = initializeApp(environment.firebase);
const db = getFirestore(app);

interface DailyData {
  work: number;
  productive: number;
  sleep: number;
  other: number;
}

interface ChartData {
  labels: string[];
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
    const chartData = await this.fetchChartData();
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

    return { startDate: startDateString, endDate: endDate };
  }

  async fetchChartData(): Promise<ChartData> {
    const { startDate, endDate } = this.getDefaultDateRange();

    const activitiesQuery = query(collection(this.db, 'activities'));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    let activitiesMap = new Map();
    activitiesSnapshot.forEach((doc) => {
      activitiesMap.set(doc.id, doc.data());
    });

    const trackerQuery = query(collection(this.db, 'tracker'));
    const trackerSnapshot = await getDocs(trackerQuery);

    let weeklyData: Record<string, DailyData> = {};

    trackerSnapshot.docs.forEach((trackerDoc) => {
      const docId = trackerDoc.id;
      const docDate = docId.substring(0, 8);

      if (docDate >= startDate && docDate <= endDate) {
        const data = trackerDoc.data();
        if (data['Activity']) {
          const activity = data['Activity'];
          const activityData = activitiesMap.get(activity);

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
                work: 0,
                productive: 0,
                sleep: 0,
                other: 0,
              };
            }

            if (activity === 'Sleeping') {
              weeklyData[weekNumber].sleep += 0.25;
            } else if (activityData['Work']) {
              weeklyData[weekNumber].work += 0.25;
            } else if (activityData['Productive']) {
              weeklyData[weekNumber].productive += 0.25;
            } else {
              weeklyData[weekNumber].other += 0.25;
            }
          } else {
            console.log('Activity data not found for:', activity);
          }
        }
      }
    });

    let chartData: ChartData = {
      labels: Object.keys(weeklyData).sort(),
      workData: Object.values(weeklyData).map((d) => d.work),
      productiveData: Object.values(weeklyData).map((d) => d.productive),
      sleepData: Object.values(weeklyData).map((d) => d.sleep),
      otherData: Object.values(weeklyData).map((d) => d.other),
    };

    return chartData;
  }

  initializeChart(chartData: ChartData) {
    const canvas = document.getElementById('myChart') as HTMLCanvasElement;

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Work',
            borderColor: '#2E8B57',
            borderWidth: 5,
            data: chartData.workData,
            fill: false,
          },
          {
            label: 'Productive',
            borderColor: '#6A0DAD',
            borderWidth: 5,
            data: chartData.productiveData,
            fill: false,
          },
          {
            label: 'Other',
            borderColor: '#222222',
            borderWidth: 5,
            data: chartData.otherData,
            fill: false,
          },
          {
            label: 'Sleeping',
            borderColor: '#0A2463',
            borderWidth: 5,
            data: chartData.sleepData,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
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
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} hours`,
              title: () => '',
            },
            displayColors: false,
            bodyFont: {
              size: 24,
            },
          },
        },
      },
    });
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
