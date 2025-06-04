import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
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

Chart.register(...registerables);

const app = initializeApp(environment.firebase);
const db = getFirestore(app);

const categoryColors = {
  Other: '#222222',
  Sleeping: '#0A2463',
  Work: '#1E5631',
  Productive: '#6A0DAD',
  Side_Projects: '#705D00',
};

const categoryOrder = [
  'Sleeping',
  'Work',
  'Productive',
  'Side_Projects',
  'Other',
];

@Component({
  selector: 'app-timevert',
  templateUrl: './timevert.component.html',
  styleUrls: ['./timevert.component.scss'],
})
export class TimevertComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  @Input() startDate!: string;
  @Input() endDate!: string;

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: 'white',
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      y: {
        display: false,
        stacked: true,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return context.parsed.y + ' hours';
          },
          title: function () {
            return '';
          },
        },
        displayColors: false,
        bodyFont: {
          size: 14,
        },
      },
      datalabels: {
        display: false,
      },
    },
    animation: {
      onComplete: (animation) => {
        this.drawOuterBorders(animation.chart);
      },
    },
  };

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  public barChartType: ChartType = 'bar';

  constructor() {}

  ngOnInit() {
    this.loadChartData();
    window.addEventListener('resize', this.onResize.bind(this));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      (changes['startDate'] || changes['endDate']) &&
      this.startDate &&
      this.endDate
    ) {
      this.loadChartData();
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

  async loadChartData() {
    if (!this.startDate || !this.endDate) {
      return;
    }

    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);

    const chartData = await this.fetchChartData(startDate, endDate);
    this.updateChartData(chartData);
  }

  async fetchChartData(
    startDate: Date,
    endDate: Date
  ): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
    }>;
  }> {
    const days: string[] = [];
    const dayData = new Map<string, Map<string, number>>();

    // Generate all days in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayLabel = currentDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      days.push(dayLabel);
      dayData.set(dayLabel, new Map());
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fetch activity mapping
    const activityMap = new Map<string, any>();
    const activitiesQuery = query(collection(db, 'activities'));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    activitiesSnapshot.forEach((doc) => {
      activityMap.set(doc.id, doc.data());
    });

    // Fetch tracker data for the 7-day period
    const startId = this.formatDate(startDate);
    const endId = this.formatDate(endDate) + '\uf8ff';

    const trackerQuery = query(
      collection(db, 'tracker'),
      where(documentId(), '>=', startId),
      where(documentId(), '<=', endId)
    );

    const trackerSnapshot = await getDocs(trackerQuery);

    trackerSnapshot.forEach((doc) => {
      const docId = doc.id;
      const docDate = this.parseDocumentDate(docId);
      const dayLabel = docDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      if (dayData.has(dayLabel)) {
        const activity = doc.data()['Activity'];
        if (activity) {
          const activityData = activityMap.get(activity);
          if (activityData) {
            let category = 'Other';

            if (activity === 'Sleeping') {
              category = 'Sleeping';
            } else if (activityData['Work']) {
              category = 'Work';
            } else if (activityData['Side_Project']) {
              category = 'Side_Projects';
            } else if (activityData['Productive']) {
              category = 'Productive';
            }

            const currentData = dayData.get(dayLabel)!;
            const currentTime = currentData.get(category) || 0;
            currentData.set(category, currentTime + 0.25);
          }
        }
      }
    });

    // Create datasets for each category
    const datasets = categoryOrder.map((category) => ({
      label: this.getCategoryDisplayName(category),
      data: days.map((day) => dayData.get(day)?.get(category) || 0),
      backgroundColor: categoryColors[category as keyof typeof categoryColors],
      datalabels: {
        display: false,
      },
    }));

    return { labels: days, datasets };
  }

  updateChartData(chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
    }>;
  }) {
    this.barChartData.labels = chartData.labels;
    this.barChartData.datasets = chartData.datasets;

    if (this.chart) {
      this.chart.update();
    }
  }

  formatDate(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 10).replace(/-/g, '');
  }

  parseDocumentDate(docId: string): Date {
    // Parse document ID format YYYYMMDDHHMMSS
    const year = parseInt(docId.substring(0, 4));
    const month = parseInt(docId.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(docId.substring(6, 8));
    return new Date(year, month, day);
  }

  getCategoryDisplayName(category: string): string {
    switch (category) {
      case 'Side_Projects':
        return 'Side Projects';
      default:
        return category;
    }
  }

  drawOuterBorders(chart: Chart) {
    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0); // Get meta for first dataset to get bar positions

    if (!meta || !meta.data) return;

    ctx.save();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    // For each bar (x-axis position)
    meta.data.forEach((element: any, index: number) => {
      if (!element) return;

      const barX = element.x;
      const barWidth = element.width;

      // Calculate the total height by summing all datasets for this bar
      let barTop = chart.chartArea.bottom;
      let barBottom = chart.chartArea.bottom;

      // Find the topmost point and bottom point across all datasets
      chart.data.datasets?.forEach((dataset, datasetIndex) => {
        const datasetMeta = chart.getDatasetMeta(datasetIndex);
        if (datasetMeta.data[index]) {
          const point = datasetMeta.data[index] as any;
          if (point.y < barTop) {
            barTop = point.y;
          }
        }
      });

      // Draw the outer border rectangle
      ctx.strokeRect(barX - barWidth / 2, barTop, barWidth, barBottom - barTop);
    });

    ctx.restore();
  }
}
