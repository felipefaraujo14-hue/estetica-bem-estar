
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Representa uma entrada registrada no backend.
export interface EntradaProduto {
  identradaProduto?: number;
  iditem: number;
  dataEntradaProduto: string;
  quantidadeEntrada: number;
  unidade: string;
  valorUnitarioEntrada: number;
}

// Representa os produtos disponíveis na consulta de estoque.
export interface ProdutoEstoque {
  iditem: number;
  nomeProduto: string;
  quantidadeEstoque: number;
  unidade: string;
  precoVenda: number;
}

// Dados enviados para cadastrar uma entrada.
export interface NovaEntradaProduto {
  iditem: number;
  dataEntradaProduto: string;
  quantidadeEntrada: number;
  unidade: string;
  valorUnitarioEntrada: number;
}

@Injectable({
  providedIn: 'root'
})
export class EntradaProdutoService {
  private readonly apiEntrada =
    'https://localhost:7038/api/EntradaProduto';

  private readonly apiEstoque =
    'https://localhost:7038/api/Estoque';

  constructor(private http: HttpClient) {}

  // Lista o histórico de entradas.
  listar(): Observable<EntradaProduto[]> {
    return this.http.get<EntradaProduto[]>(this.apiEntrada);
  }

  // Lista produtos e suas quantidades atuais.
  listarProdutosEstoque(): Observable<ProdutoEstoque[]> {
    return this.http.get<ProdutoEstoque[]>(this.apiEstoque);
  }

  // Registra uma nova entrada.
  cadastrar(dados: NovaEntradaProduto): Observable<EntradaProduto> {
    return this.http.post<EntradaProduto>(this.apiEntrada, dados);
  }
}
