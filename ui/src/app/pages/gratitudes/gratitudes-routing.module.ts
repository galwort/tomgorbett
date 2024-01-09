import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GratitudesPage } from './gratitudes.page';

const routes: Routes = [
  {
    path: '',
    component: GratitudesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GratitudesPageRoutingModule {}
