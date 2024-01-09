import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GratitudesPage } from './gratitudes.page';

describe('GratitudesPage', () => {
  let component: GratitudesPage;
  let fixture: ComponentFixture<GratitudesPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(GratitudesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
