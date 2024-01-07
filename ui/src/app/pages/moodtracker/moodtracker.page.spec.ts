import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoodtrackerPage } from './moodtracker.page';

describe('MoodtrackerPage', () => {
  let component: MoodtrackerPage;
  let fixture: ComponentFixture<MoodtrackerPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(MoodtrackerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
