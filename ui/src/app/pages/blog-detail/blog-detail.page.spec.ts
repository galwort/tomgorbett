import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlogDetailPage } from './blog-detail.page';

describe('BlogDetailPage', () => {
  let component: BlogDetailPage;
  let fixture: ComponentFixture<BlogDetailPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(BlogDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
