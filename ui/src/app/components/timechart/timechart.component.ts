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

  getDefaultDateRange(): { startDate: string, endDate: string } {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const endDate = currentDate.toISOString().split('T')[0].replace(/-/g, '');
  
    const startOfWeekOffset = currentDate.getDay() === 0 ? -6 : 1;
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - currentDate.getDay() + startOfWeekOffset - 13);
    startDate.setHours(0, 0, 0, 0);
    const startDateString = `${startDate.getFullYear()}${(startDate.getMonth() + 1).toString().padStart(2, '0')}${startDate.getDate().toString().padStart(2, '0')}`;
  
    return { startDate: startDateString, endDate: endDate };
  }
  

  async fetchChartData(): Promise<ChartData> {
    const { startDate, endDate } = this.getDefaultDateRange();
  
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
      const docId = trackerDoc.id;
      const docDate = docId.substring(0, 8);
  
      if (docDate >= startDate && docDate <= endDate) {
        const data = trackerDoc.data();
        if (data['Activity']) {
          const activityData = activitiesMap.get(data['Activity']);
          if (activityData) {
            const month = parseInt(docDate.substring(4, 6), 10);
            const day = parseInt(docDate.substring(6, 8), 10);
            const formattedDate = `${month}/${day}`;
  
            if (!dailyData[formattedDate]) {
              dailyData[formattedDate] = { screenTime: 0, work: 0, productive: 0 };
            }
  
            dailyData[formattedDate].screenTime += activityData['Screen_Time'] ? activityData['Screen_Time'] / 4 : 0;
            dailyData[formattedDate].work += activityData['Work'] ? activityData['Work'] / 4 : 0;
            dailyData[formattedDate].productive += activityData['Productive'] ? activityData['Productive'] / 4 : 0;
          }
        } else {
          console.log(`Activity is undefined for trackerDoc ID: ${trackerDoc.id}`);
        }
      }
    });
  
    let chartData: ChartData = {
      labels: Object.keys(dailyData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
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
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours'
            }
          },
          x: {
            ticks: {
              padding: 10
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 40
            }
          }
        },
      }
    });
  }
}
