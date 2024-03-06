import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TimePage } from './time.page';
import { TimePageRoutingModule } from './time-routing.module';

import { TimetrackerComponent } from '../../components/timetracker/timetracker.component';
import { TimechartComponent } from 'src/app/components/timechart/timechart.component';
import { TimepieComponent } from 'src/app/components/timepie/timepie.component';

import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TimePageRoutingModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [
    TimePage,
    TimetrackerComponent,
    TimechartComponent,
    TimepieComponent,
  ],
  providers: [provideCharts(withDefaultRegisterables())],
})
export class TimePageModule {}
