import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { TimetrackerPage } from './timetracker.page';

import { TimetrackerPageRoutingModule } from './timetracker-routing.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TimetrackerPageRoutingModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [TimetrackerPage]
})
export class TimetrackerPageModule {}
