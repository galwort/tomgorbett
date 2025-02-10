import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { LoginData } from 'src/app/interfaces/login-data.interface';

@Component({
  selector: 'app-unlock',
  templateUrl: './unlock.page.html',
  styleUrls: ['./unlock.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
})
export class UnlockPage implements OnInit {
  loginData: LoginData = { email: 'wthomasgorbett@gmail.com', password: '' };
  password: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/log']);
    }
  }

  login() {
    this.authService
      .login(this.loginData)
      .then(() => this.router.navigate(['/log']))
      .catch((e) => console.error('Login failed:', e.message));
  }
}
