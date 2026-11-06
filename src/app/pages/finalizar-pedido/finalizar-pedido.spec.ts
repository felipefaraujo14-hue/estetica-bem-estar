import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinalizarPedido } from './finalizar-pedido';

describe('FinalizarPedido', () => {
  let component: FinalizarPedido;
  let fixture: ComponentFixture<FinalizarPedido>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalizarPedido],
    }).compileComponents();

    fixture = TestBed.createComponent(FinalizarPedido);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
