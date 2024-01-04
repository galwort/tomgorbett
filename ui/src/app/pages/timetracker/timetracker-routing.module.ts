import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TimetrackerPage } from './timetracker.page';

const routes: Routes = [
  {
    path: '',
    component: TimetrackerPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TimetrackerPageRoutingModule {}
