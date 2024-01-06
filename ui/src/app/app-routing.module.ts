import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'timetracker',
    loadChildren: () => import('./pages/timetracker/timetracker.module').then( m => m.TimetrackerPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'timetracker',
    pathMatch: 'full'
  },
  {
    path: 'unlock',
    loadChildren: () => import('./pages/unlock/unlock.module').then( m => m.UnlockPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
