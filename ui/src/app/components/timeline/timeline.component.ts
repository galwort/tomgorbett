import { Component, OnInit, AfterViewInit } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  getDocs,
  where,
  orderBy,
  documentId,
} from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { register } from 'swiper/element/bundle';

register();

const app = initializeApp(environment.firebase);
const db = getFirestore(app);

const categoryColors = {
  Other: '#222222',
  Sleeping: '#0A2463',
  Work: '#1E5631',
  Productive: '#6A0DAD',
  Side_Projects: '#705D00',
};

interface TimelineActivity {
  name: string;
  color: string;
}

interface TimelineDay {
  date: Date;
  activities: TimelineActivity[];
}

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
})
export class TimelineComponent implements OnInit, AfterViewInit {
  public timelineData: TimelineDay[] = [];

  public weekView = false;
  public viewMode = 'day';
  public weekMatrix: (TimelineActivity | null)[][] = [];
  public weekDays: Date[] = [];
  public timeLabels: string[] = [];

  public startDate: string;
  public endDate: string;

  constructor() {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const isoDate = today.toISOString().split('T')[0];
    this.startDate = isoDate;
    this.endDate = isoDate;
  }

  ngOnInit() {
    this.updateTimelineData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const swiper = document.querySelector('swiper-container')?.swiper;
      swiper?.update();
    }, 100);
  }

  buildWeekMatrix(start: Date) {
    this.weekMatrix = Array.from({ length: 96 }, () => Array(7).fill(null));
    this.weekDays = [];
    this.timeLabels = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + d);
      this.weekDays.push(day);
    }
    for (let i = 0; i < 96; i++) {
      const h = Math.floor(i / 4);
      const m = (i % 4) * 15;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hh = h % 12 === 0 ? 12 : h % 12;
      const mm = m.toString().padStart(2, '0');
      this.timeLabels.push(`${hh}:${mm} ${ampm}`);
    }
    for (const entry of this.timelineData) {
      const dayIndex = Math.floor(
        (entry.date.getTime() - start.getTime()) / 86400000
      );
      const timeIndex =
        entry.date.getHours() * 4 + entry.date.getMinutes() / 15;
      if (dayIndex >= 0 && dayIndex < 7 && timeIndex >= 0 && timeIndex < 96) {
        this.weekMatrix[timeIndex][dayIndex] = entry.activities[0];
      }
    }
  }

  async fetchTimelineData(
    startDate: Date,
    endDate: Date
  ): Promise<TimelineDay[]> {
    const startId = this.formatDate(startDate);
    const endId = this.formatDate(endDate) + '\uf8ff';

    const trackerQuery = query(
      collection(db, 'tracker'),
      where(documentId(), '>=', startId),
      where(documentId(), '<=', endId),
      orderBy(documentId(), 'desc')
    );

    const trackerSnapshot = await getDocs(trackerQuery);

    const activityMap = new Map<string, any>();
    const activitiesQuery = query(collection(db, 'activities'));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    activitiesSnapshot.forEach((doc) => {
      activityMap.set(doc.id, doc.data());
    });

    const timelineData: TimelineDay[] = [];

    trackerSnapshot.forEach((doc) => {
      const activityId = doc.id;
      const date = new Date(
        parseInt(activityId.slice(0, 4)),
        parseInt(activityId.slice(4, 6)) - 1,
        parseInt(activityId.slice(6, 8)),
        parseInt(activityId.slice(8, 10)),
        parseInt(activityId.slice(10, 12)),
        0
      );

      const activity = doc.data()['Activity'];
      if (activity) {
        const activityData = activityMap.get(activity);
        if (activityData) {
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

          const timelineActivity: TimelineActivity = {
            name: activity,
            color,
          };

          const existingDayIndex = timelineData.findIndex(
            (day) => day.date.getTime() === date.getTime()
          );

          if (existingDayIndex !== -1) {
            timelineData[existingDayIndex].activities.push(timelineActivity);
          } else {
            const timelineDay: TimelineDay = {
              date,
              activities: [timelineActivity],
            };
            timelineData.push(timelineDay);
          }
        }
      }
    });

    return timelineData;
  }
  async updateTimelineData() {
    let start = this.parseDate(this.startDate);
    let end = this.parseDate(this.endDate);
    if (this.weekView) {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end = this.parseDate(this.endDate);
      end.setHours(23, 45, 0, 0);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 45, 0, 0);
    }

    this.timelineData = await this.fetchTimelineData(start, end);

    if (this.weekView) {
      this.buildWeekMatrix(start);
    }

    setTimeout(() => {
      const swiper = document.querySelector('swiper-container')?.swiper;
      swiper?.update();
    }, 100);
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

  onDateChange() {
    this.updateTimelineData();
  }

  getCategoryFromColor(color: string): string {
    switch (color) {
      case categoryColors.Sleeping:
        return 'Sleeping';
      case categoryColors.Work:
        return 'Work';
      case categoryColors.Side_Projects:
        return 'Side Project';
      case categoryColors.Productive:
        return 'Productive';
      default:
        return 'Other';
    }
  }
  onCategoryChange() {
    this.updateTimelineData();
  }

  onViewModeChange(event: any) {
    this.viewMode = event.detail.value;
    this.weekView = this.viewMode === 'week';
    this.updateTimelineData();
  }

  toggleWeekView() {
    this.weekView = !this.weekView;
    this.viewMode = this.weekView ? 'week' : 'day';
    this.updateTimelineData();
  }

  getBorderRadiusClass(rowIndex: number, colIndex: number): string {
    const currentCell = this.weekMatrix[rowIndex]?.[colIndex];
    if (!currentCell?.color || currentCell.color === 'transparent') {
      return '';
    }

    const currentColor = currentCell.color;
    const cellAbove = this.weekMatrix[rowIndex - 1]?.[colIndex];
    const cellBelow = this.weekMatrix[rowIndex + 1]?.[colIndex];

    const hasSameColorAbove = cellAbove?.color === currentColor;
    const hasSameColorBelow = cellBelow?.color === currentColor;

    if (!hasSameColorAbove && !hasSameColorBelow) {
      return 'full-radius';
    } else if (!hasSameColorAbove && hasSameColorBelow) {
      return 'top-radius';
    } else if (hasSameColorAbove && !hasSameColorBelow) {
      return 'bottom-radius';
    } else {
      return 'no-radius';
    }
  }

  getTooltipText(rowIndex: number, colIndex: number): string {
    const currentCell = this.weekMatrix[rowIndex]?.[colIndex];
    if (!currentCell?.color || currentCell.color === 'transparent') {
      return '';
    }

    const currentColor = currentCell.color;
    const currentActivity = currentCell.name;

    let startRow = rowIndex;
    let endRow = rowIndex;
    while (startRow > 0) {
      const cellAbove = this.weekMatrix[startRow - 1]?.[colIndex];
      if (
        cellAbove?.color === currentColor &&
        cellAbove?.name === currentActivity
      ) {
        startRow--;
      } else {
        break;
      }
    }

    while (endRow < this.weekMatrix.length - 1) {
      const cellBelow = this.weekMatrix[endRow + 1]?.[colIndex];
      if (
        cellBelow?.color === currentColor &&
        cellBelow?.name === currentActivity
      ) {
        endRow++;
      } else {
        break;
      }
    }

    const startTime = this.formatTimeFromRow(startRow);
    const endTime = this.formatTimeFromRow(endRow + 1);

    if (startRow === endRow) {
      return `${currentActivity} at ${startTime}`;
    } else {
      return `${currentActivity}\n${startTime} - ${endTime}`;
    }
  }

  formatTimeFromRow(rowIndex: number): string {
    const h = Math.floor(rowIndex / 4);
    const m = (rowIndex % 4) * 15;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 === 0 ? 12 : h % 12;
    const mm = m.toString().padStart(2, '0');
    return `${hh}:${mm} ${ampm}`;
  }

  getActivityGroupId(rowIndex: number, colIndex: number): string {
    const currentCell = this.weekMatrix[rowIndex]?.[colIndex];
    if (!currentCell?.color || currentCell.color === 'transparent') {
      return '';
    }

    const currentColor = currentCell.color;
    const currentActivity = currentCell.name;

    // Find the start of the activity group (same color AND same activity)
    let startRow = rowIndex;
    while (startRow > 0) {
      const cellAbove = this.weekMatrix[startRow - 1]?.[colIndex];
      if (cellAbove?.color === currentColor && cellAbove?.name === currentActivity) {
        startRow--;
      } else {
        break;
      }
    }

    // Create a unique ID for this activity group
    return `activity-group-${colIndex}-${startRow}-${currentActivity.replace(/\s+/g, '-')}`;
  }

  highlightActivityGroup(groupId: string) {
    if (!groupId) return;
    
    // Remove any existing highlights
    this.clearActivityGroupHighlight();
    
    // Add highlight to all cells with the same activity group ID
    const cells = document.querySelectorAll(`[data-activity-group="${groupId}"]`);
    cells.forEach(cell => {
      cell.classList.add('activity-group-highlight');
    });
  }

  clearActivityGroupHighlight() {
    const highlightedCells = document.querySelectorAll('.activity-group-highlight');
    highlightedCells.forEach(cell => {
      cell.classList.remove('activity-group-highlight');
    });
  }
}
