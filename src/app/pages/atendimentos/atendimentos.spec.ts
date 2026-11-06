import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Atendimentos } from './atendimentos';

describe('Atendimentos', () => {
  let component: Atendimentos;
  let fixture: ComponentFixture<Atendimentos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Atendimentos],
    }).compileComponents();

    fixture = TestBed.createComponent(Atendimentos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
