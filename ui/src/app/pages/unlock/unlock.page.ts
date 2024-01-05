import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unlock',
  templateUrl: './unlock.page.html',
  styleUrls: ['./unlock.page.scss'],
})
export class UnlockPage implements OnInit {
  password: string = '';

  constructor(private router: Router) { }

  ngOnInit() {
  }

  checkPassword() {
    const correctPassword = 'BattyFives';
    if (this.password === correctPassword) {
      this.router.navigate(['/timetracker']);
    } else {
      console.log('Incorrect password');
    }
  }
}
