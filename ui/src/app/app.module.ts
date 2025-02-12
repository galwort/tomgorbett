import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Form and Charts modules
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    ReactiveFormsModule,
    NgChartsModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: 'FIREBASE_APP',
      useFactory: () => initializeApp(environment.firebase),
    },
    { provide: 'FIRESTORE', useFactory: () => getFirestore() },
    { provide: 'AUTH', useFactory: () => getAuth() },
  ],
  exports: [FormsModule, ReactiveFormsModule],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Fix for Ionic elements not recognized
})
export class AppModule {}
