import { Injectable } from '@angular/core';
import { ItemCatalogo } from './catalogo.service';

// Representa um produto dentro do carrinho.
export interface ItemCarrinho {
  item: ItemCatalogo;
  quantidade: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {

  // Guarda os itens selecionados durante a navegação.
  private itensCarrinho: ItemCarrinho[] = [];

  // Retorna os itens do carrinho.
  listarItens(): ItemCarrinho[] {
    return this.itensCarrinho;
  }

  // Adiciona um produto ou aumenta sua quantidade.
  adicionar(item: ItemCatalogo): void {
    const existente = this.itensCarrinho.find(
      i => i.item.iditem === item.iditem
    );

    if (existente) {
      existente.quantidade++;
    } else {
      this.itensCarrinho.push({
        item: item,
        quantidade: 1
      });
    }
  }

  // Remove um produto completamente do carrinho.
  remover(iditem: number): void {
    this.itensCarrinho = this.itensCarrinho.filter(
      i => i.item.iditem !== iditem
    );
  }

  // Altera a quantidade de um produto.
  alterarQuantidade(iditem: number, quantidade: number): void {
    const existente = this.itensCarrinho.find(
      i => i.item.iditem === iditem
    );

    if (!existente) {
      return;
    }

    if (quantidade <= 0) {
      this.remover(iditem);
    } else {
      existente.quantidade = quantidade;
    }
  }

  // Calcula quantas unidades existem no carrinho.
  get quantidadeTotal(): number {
    return this.itensCarrinho.reduce(
      (total, i) => total + i.quantidade,
      0
    );
  }

  // Calcula o preço total de todos os itens.
  get valorTotal(): number {
    return this.itensCarrinho.reduce(
      (total, i) => total + i.item.preco * i.quantidade,
      0
    );
  }

  // Esvazia o carrinho.
  limpar(): void {
    this.itensCarrinho = [];
  }
}
