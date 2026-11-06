import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsultarPedidos } from './consultar-pedidos';

describe('ConsultarPedidos', () => {
  let component: ConsultarPedidos;
  let fixture: ComponentFixture<ConsultarPedidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultarPedidos],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultarPedidos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
