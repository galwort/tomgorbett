import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TimepieComponent } from './timepie.component';

describe('TimepieComponent', () => {
  let component: TimepieComponent;
  let fixture: ComponentFixture<TimepieComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TimepieComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(TimepieComponent);
    component = fixture.componentInstance;
    component.startDate = '2024-01-01';
    component.endDate = '2024-01-01';
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
