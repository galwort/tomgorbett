import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs } from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { NgChartsModule } from 'ng2-charts';

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
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, NgChartsModule],
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

    const endDate = new Date(currentDate);
    const dayOfWeek = endDate.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek;
    endDate.setDate(endDate.getDate() - daysToSubtract);
    const endDateString = endDate.toISOString().split('T')[0].replace(/-/g, '');

    const startDate = new Date(endDate);
    startDate.setMonth(endDate.getMonth() - 2);

    const startDayOfWeek = startDate.getDay();
    const daysToAdd = startDayOfWeek === 0 ? 1 : 8 - startDayOfWeek;
    startDate.setDate(startDate.getDate() + daysToAdd);
    const startDateString = `${startDate.getFullYear()}${(
      startDate.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}${startDate.getDate().toString().padStart(2, '0')}`;

    return { startDate: startDateString, endDate: endDateString };
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
            const mondayDate = this.getMondayDate(
              new Date(
                parseInt(docDate.substring(0, 4)),
                parseInt(docDate.substring(4, 6)) - 1,
                parseInt(docDate.substring(6, 8))
              )
            );

            const formattedDate = `${(mondayDate.getMonth() + 1)
              .toString()
              .padStart(2, '0')}/${mondayDate
              .getDate()
              .toString()
              .padStart(2, '0')}`;

            if (!weeklyData[formattedDate]) {
              weeklyData[formattedDate] = {
                work: 0,
                productive: 0,
                sleep: 0,
                other: 0,
              };
            }

            if (activity === 'Sleeping') {
              weeklyData[formattedDate].sleep += 0.25;
            } else if (activityData['Work']) {
              weeklyData[formattedDate].work += 0.25;
            } else if (activityData['Productive']) {
              weeklyData[formattedDate].productive += 0.25;
            } else {
              weeklyData[formattedDate].other += 0.25;
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

  getMondayDate(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
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
            pointRadius: 5,
            pointBackgroundColor: 'transparent',
            pointBorderColor: 'transparent',
          },
          {
            label: 'Productive',
            borderColor: '#6A0DAD',
            borderWidth: 5,
            data: chartData.productiveData,
            fill: false,
            pointRadius: 5,
            pointBackgroundColor: 'transparent',
            pointBorderColor: 'transparent',
          },
          {
            label: 'Other',
            borderColor: '#222222',
            borderWidth: 5,
            data: chartData.otherData,
            fill: false,
            pointRadius: 5,
            pointBackgroundColor: 'transparent',
            pointBorderColor: 'transparent',
          },
          {
            label: 'Sleeping',
            borderColor: '#0A2463',
            borderWidth: 5,
            data: chartData.sleepData,
            fill: false,
            pointRadius: 5,
            pointBackgroundColor: 'transparent',
            pointBorderColor: 'transparent',
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              display: false,
              stepSize: 10,
            },
            grid: {
              display: true,
              color: 'rgba(255, 255, 255, 0.2)',
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
          datalabels: {
            display: false,
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
