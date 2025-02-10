import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  getIdToken,
  UserCredential,
} from '@angular/fire/auth';
import { LoginData } from '../interfaces/login-data.interface';

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly BUFFER_TIME = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(private readonly auth: Auth) {}

  async login({ email, password }: LoginData): Promise<void> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const token = await getIdToken(userCredential.user);
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Authentication failed. Please check your credentials.');
    }
  }

  isAuthenticated(): boolean {
    try {
      const token = this.getCurrentToken();
      if (!token) return false;

      const decodedToken = this.decodeToken(token);
      const currentTime = Math.floor(Date.now() / 1000);

      return decodedToken.exp > currentTime - this.BUFFER_TIME;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  getCurrentToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private decodeToken(token: string): DecodedToken {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
      );
    } catch (error) {
      console.error('Token decoding failed:', error);
      throw new Error('Invalid token format');
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
