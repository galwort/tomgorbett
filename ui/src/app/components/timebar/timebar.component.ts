import { Component, OnInit, OnDestroy, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
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
  Productive: '#6A0DAD',
  Side_Projects: '#705D00',
};

@Component({
  selector: 'app-timebar',
  templateUrl: './timebar.component.html',
  styleUrls: ['./timebar.component.scss'],
})
export class TimebarComponent implements OnInit, OnDestroy, OnChanges {
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
          stepSize: 0.5,
        },
      },
      y: {
        ticks: {
          mirror: true,
          z: 1,
          color: 'rgba(255, 255, 255, 0.9)',
          font: (context) => {
            const chart = context.chart;
            const chartHeight = chart.height;
            const scale = chart.scales['y'];
            let barHeight = chartHeight / scale.ticks.length / 2;
            barHeight = Math.min(Math.max(barHeight, 20), 40);
            return {
              size: barHeight,
              weight: 'bold',
            };
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.parsed.x + ' hours';
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

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        datalabels: {
          display: false,
        },
      },
    ],
  };

  public barChartType: ChartType = 'bar';

  @Input() startDate!: string;
  @Input() endDate!: string;
  public selectedCategories: string[] = [
    'Work',
    'Productive',
    'Side Projects',
    'Other',
  ];

  constructor() {}

  ngOnInit() {
    this.fetchChartData().then((chartData) => {
      this.updateChartData(chartData);
    });

    window.addEventListener('resize', this.onResize.bind(this));

    setTimeout(() => {
      if (this.chart) {
        this.chart.update();
      }
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['startDate'] || changes['endDate']) {
      this.fetchChartData().then((chartData) => {
        this.updateChartData(chartData);
      });
    }
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    if (this.chart) {
      this.chart.update();
    }
  }

  async fetchChartData(): Promise<{
    labels: string[];
    data: number[];
    colors: string[];
  }> {
    const startDate = this.parseDate(this.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = this.parseDate(this.endDate);
    endDate.setHours(23, 45, 0, 0);

    const startId = this.formatDate(startDate);
    const endId = this.formatDate(endDate) + '\uf8ff';

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
          } else if (activityData['Side_Project']) {
            color = categoryColors.Side_Projects;
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
    const filteredActivities = Array.from(activityTimes.entries())
      .filter(([activity, { color }]) => {
        const category = this.getCategoryFromColor(color);
        return this.selectedCategories.includes(category);
      })
      .sort((a, b) => b[1].time - a[1].time)
      .slice(0, 10);

    const labels = filteredActivities.map(([activity]) => activity);
    const data = filteredActivities.map(([, { time }]) => time);
    const colors = filteredActivities.map(([, { color }]) => color);

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

  formatDate(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 10).replace(/-/g, '');
  }

  parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.substring(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  getCategoryFromColor(color: string): string {
    switch (color) {
      case categoryColors.Sleeping:
        return 'Sleeping';
      case categoryColors.Work:
        return 'Work';
      case categoryColors.Productive:
        return 'Productive';
      case categoryColors.Side_Projects:
        return 'Side Projects';
      default:
        return 'Other';
    }
  }

  onCategoryChange() {
    this.fetchChartData().then((chartData) => {
      this.updateChartData(chartData);
    });
  }
}
