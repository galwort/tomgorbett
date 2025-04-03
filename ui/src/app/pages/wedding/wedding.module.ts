import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { IonicModule } from '@ionic/angular';

import { WeddingPageRoutingModule } from './wedding-routing.module';

import { WeddingPage } from './wedding.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WeddingPageRoutingModule,
    HttpClientModule
  ],
  declarations: [WeddingPage]
})
export class WeddingPageModule {}
