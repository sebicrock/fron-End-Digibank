import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CdtForm } from './cdt-form';

describe('CdtForm', () => {
  let component: CdtForm;
  let fixture: ComponentFixture<CdtForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdtForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdtForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
