import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-daily',
  templateUrl: './daily.component.html',
  styleUrls: ['./daily.component.scss'],
})
export class DailyComponent implements OnInit {
  dailyForm: FormGroup = new FormGroup({
    diet: new FormControl('Okay'),
    marriage: new FormControl('Okay'),
    parents: new FormControl('Okay'),
    productivity: new FormControl('Okay'),
    sleep: new FormControl('Okay'),
    gratitude: new FormControl(''),
  });

  moods = ['Very Bad', 'Bad', 'Okay', 'Good', 'Great'];
  isSubmitting: boolean = false;
  submitButtonText: string = 'Submit';

  constructor() {}

  ngOnInit() {}

  async submitData() {
    this.isSubmitting = true;
    this.submitButtonText = 'Submitting...';

    setTimeout(() => {
      console.log('Form submitted:', this.dailyForm.value);
      this.isSubmitting = false;
      this.submitButtonText = 'Submit';
      this.dailyForm.reset();
    }, 2000);
  }
}
