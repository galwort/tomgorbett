import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  getIdToken,
} from '@angular/fire/auth';
import { LoginData } from '../interfaces/login-data.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: Auth) {}

  async login({ email, password }: LoginData) {
    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    const token = await getIdToken(userCredential.user);
    localStorage.setItem('auth_token', token);
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
