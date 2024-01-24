import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { TimePage } from './time.page';

import { TimePageRoutingModule } from './time-routing.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TimePageRoutingModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  declarations: [TimePage]
})
export class TimePageModule {}
