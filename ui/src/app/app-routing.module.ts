import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'unlock',
    loadComponent: () =>
      import('./pages/unlock/unlock.page').then((m) => m.UnlockPage),
  },
  {
    path: 'log',
    loadComponent: () => import('./pages/log/log.page').then((m) => m.LogPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./pages/blog/blog.page').then((m) => m.BlogPage),
  },
  {
    path: 'blog/:id',
    loadComponent: () =>
      import('./pages/blog-detail/blog-detail.page').then(
        (m) => m.BlogDetailPage
      ),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
