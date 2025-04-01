import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: 'unlock',
    loadChildren: () =>
      import('./pages/unlock/unlock.module').then((m) => m.UnlockPageModule),
  },
  {
    path: 'log',
    loadChildren: () =>
      import('./pages/log/log.module').then((m) => m.LogPageModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'blog',
    loadChildren: () =>
      import('./pages/blog/blog.module').then((m) => m.BlogPageModule),
  },
  {
    path: 'blog/:id',
    loadChildren: () =>
      import('./pages/blog-detail/blog-detail.module').then(
        (m) => m.BlogDetailPageModule
      ),
  },  {
    path: 'wedding',
    loadChildren: () => import('./pages/wedding/wedding.module').then( m => m.WeddingPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
