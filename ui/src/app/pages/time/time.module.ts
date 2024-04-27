import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TimePage } from './time.page';
import { TimePageRoutingModule } from './time-routing.module';

import { TimetrackerComponent } from 'src/app/components/timetracker/timetracker.component';
import { TimechartComponent } from 'src/app/components/timechart/timechart.component';
import { TimepieComponent } from 'src/app/components/timepie/timepie.component';
import { TimebarComponent } from 'src/app/components/timebar/timebar.component';
import { TimelineComponent } from 'src/app/components/timeline/timeline.component';
import { ActivitiesComponent } from 'src/app/components/activities/activities.component';

import { NgChartsModule } from 'ng2-charts';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TimePageRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    NgChartsModule,
  ],
  declarations: [
    TimePage,
    TimetrackerComponent,
    TimechartComponent,
    TimepieComponent,
    TimebarComponent,
    TimelineComponent,
    ActivitiesComponent,
  ],
})
export class TimePageModule {}
