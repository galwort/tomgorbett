import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LogPage } from './log.page';
import { LogPageRoutingModule } from './log-routing.module';

import { TimetrackerComponent } from 'src/app/components/timetracker/timetracker.component';
import { DailyComponent } from 'src/app/components/daily/daily.component';
import { TimechartComponent } from 'src/app/components/timechart/timechart.component';
import { TimepieComponent } from 'src/app/components/timepie/timepie.component';
import { TimebarComponent } from 'src/app/components/timebar/timebar.component';
import { TimelineComponent } from 'src/app/components/timeline/timeline.component';
import { ActivitiesComponent } from 'src/app/components/activities/activities.component';

import { NgChartsModule } from 'ng2-charts';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LogPageRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    NgChartsModule,
  ],
  declarations: [
    LogPage,
    TimetrackerComponent,
    DailyComponent,
    TimechartComponent,
    TimepieComponent,
    TimebarComponent,
    TimelineComponent,
    ActivitiesComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LogPageModule {}
