import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GratitudesPageRoutingModule } from './gratitudes-routing.module';

import { GratitudesPage } from './gratitudes.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GratitudesPageRoutingModule
  ],
  declarations: [GratitudesPage]
})
export class GratitudesPageModule {}
