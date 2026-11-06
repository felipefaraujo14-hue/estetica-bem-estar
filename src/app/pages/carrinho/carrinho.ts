import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CarrinhoService,
  ItemCarrinho
} from '../../services/carrinho.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrinho.html',
  styleUrl: './carrinho.css'
})
export class Carrinho {

  // Acessa o serviço que guarda os produtos selecionados.
  private carrinhoService = inject(CarrinhoService);

  // Retorna os itens que estão no carrinho.
  get itens(): ItemCarrinho[] {
    return this.carrinhoService.listarItens();
  }

  // Retorna o valor total de unidades no carrinho.
  get quantidadeTotal(): number {
    return this.carrinhoService.quantidadeTotal;
  }

  // Retorna o valor total da compra.
  get valorTotal(): number {
    return this.carrinhoService.valorTotal;
  }

  // Aumenta ou diminui a quantidade de um item.
  alterarQuantidade(iditem: number, quantidade: number): void {
    this.carrinhoService.alterarQuantidade(iditem, quantidade);
  }

  // Remove um item do carrinho.
  removerItem(iditem: number): void {
    this.carrinhoService.remover(iditem);
  }

  // Remove todos os itens do carrinho.
  limparCarrinho(): void {
    this.carrinhoService.limpar();
  }

  // Formata o preço no padrão monetário brasileiro.
  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}
