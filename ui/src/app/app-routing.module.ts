import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'timetracker',
    loadChildren: () => import('./pages/timetracker/timetracker.module').then( m => m.TimetrackerPageModule)
  },
  {
    path: '',
    redirectTo: 'timetracker',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
