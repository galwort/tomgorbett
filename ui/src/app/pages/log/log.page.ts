import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TimetrackerComponent } from 'src/app/components/timetracker/timetracker.component';
import { TimechartComponent } from 'src/app/components/timechart/timechart.component';
import { TimepieComponent } from 'src/app/components/timepie/timepie.component';
import { TimebarComponent } from 'src/app/components/timebar/timebar.component';
import { TimelineComponent } from 'src/app/components/timeline/timeline.component';
import { ActivitiesComponent } from 'src/app/components/activities/activities.component';
import { GratitudesComponent } from 'src/app/components/gratitudes/gratitudes.component';
import { MoodComponent } from 'src/app/components/mood/mood.component';

@Component({
  selector: 'app-log',
  templateUrl: 'log.page.html',
  styleUrls: ['log.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    TimetrackerComponent,
    TimechartComponent,
    TimepieComponent,
    TimebarComponent,
    TimelineComponent,
    ActivitiesComponent,
    GratitudesComponent,
    MoodComponent,
  ],
})
export class LogPage {
  selectedComponent: string = 'timetracker';

  constructor() {}
}
