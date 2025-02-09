import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { initializeApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { getFirestore } from '@angular/fire/firestore';
import { getAuth } from '@angular/fire/auth';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { FirebaseApp } from '@angular/fire/app';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@NgModule({
  imports: [
    AppComponent,
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgChartsModule,
    MarkdownModule.forRoot(),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: FIREBASE_OPTIONS, useValue: environment.firebase },
    { provide: FirebaseApp, useValue: initializeApp(environment.firebase) },
    { provide: Firestore, useFactory: () => getFirestore() },
    { provide: Auth, useFactory: () => getAuth() },
    provideHttpClient(withInterceptorsFromDi()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
