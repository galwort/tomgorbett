import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'unlock',
    loadChildren: () => import('./pages/unlock/unlock.module').then( m => m.UnlockPageModule)
  },
  {
    path: 'timetracker',
    loadChildren: () => import('./pages/timetracker/timetracker.module').then( m => m.TimetrackerPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'moodtracker',
    loadChildren: () => import('./pages/moodtracker/moodtracker.module').then( m => m.MoodtrackerPageModule),
    canActivate: [AuthGuard]
  },  {
    path: 'gratitudes',
    loadChildren: () => import('./pages/gratitudes/gratitudes.module').then( m => m.GratitudesPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
