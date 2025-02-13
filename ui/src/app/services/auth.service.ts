import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { LoginData } from '../interfaces/login-data.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: AngularFireAuth) {}

  async login({ email, password }: LoginData) {
    const userCredential = await this.auth.signInWithEmailAndPassword(
      email,
      password
    );
    const token = await userCredential.user?.getIdToken();
    if (token) {
      localStorage.setItem('auth_token', token);
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const bufferTime = 7 * 24 * 60 * 60;
      return decodedToken.exp > currentTime - bufferTime;
    }
    return false;
  }

  getCurrentToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}
