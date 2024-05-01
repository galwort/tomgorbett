import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { LoginData } from 'src/app/interfaces/login-data.interface';

@Component({
  selector: 'app-unlock',
  templateUrl: './unlock.page.html',
  styleUrls: ['./unlock.page.scss'],
})
export class UnlockPage implements OnInit {
  loginData: LoginData = { email: 'wthomasgorbett@gmail.com', password: '' };
  password: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/time']);
    }
  }

  login() {
    this.authService
      .login(this.loginData)
      .then(() => this.router.navigate(['/time']))
      .catch((e) => console.error('Login failed:', e.message));
  }
}
