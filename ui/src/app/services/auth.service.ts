import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, getIdToken } from '@angular/fire/auth';
import { LoginData } from '../interfaces/login-data.interface';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(private auth: Auth) {}

    async login({ email, password }: LoginData) {
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        const token = await getIdToken(userCredential.user);
        localStorage.setItem('auth_token', token);
    }

    isAuthenticated(): boolean {
        const token = localStorage.getItem('auth_token');
        return token != null;
    }

    getCurrentToken(): string | null {
        return localStorage.getItem('auth_token');
    }
}
