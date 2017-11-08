import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareViewComponent } from './shareview.component';

describe('ShareViewComponent', () => {
  let component: ShareViewComponent;
  let fixture: ComponentFixture<ShareViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShareViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
