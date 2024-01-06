import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { LoginData } from '../interfaces/login-data.interface';

@Injectable({
    providedIn: 'root',
})
export class AuthService {

    constructor(private auth: Auth) {}

    login({ email, password }: LoginData) {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    isAuthenticated(): boolean {
        return this.auth.currentUser != null;
    }
}