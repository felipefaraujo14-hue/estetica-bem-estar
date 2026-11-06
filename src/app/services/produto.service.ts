
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Representa os dados da tabela Item retornados pela API.
export interface ItemProduto {
  iditem: number;
  idcategoria: number;
  item1: string;
  descricaoItem: string;
  preco: number;
  tipoItem: string;
  ativoProdutoServico: string;
}

// Representa os dados da tabela Produto.
export interface Produto {
  iditem: number;
  codigoPreco: number;
  precoVenda: number;
  unidade: string;
  estoque?: number | null;

  // Relacionamento entre Produto e Item.
  iditemNavigation?: ItemProduto | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private apiUrl = 'https://localhost:7038/api/ProdutoItem';

  constructor(private http: HttpClient) {}

  // Busca os produtos cadastrados.
  listar(): Observable<Produto[]> {
    return this.http.get<Produto[]>(this.apiUrl);
  }

  // Busca um produto pelo ID do item.
  consultar(id: number): Observable<Produto> {
    return this.http.get<Produto>(`${this.apiUrl}/${id}`);
  }

  // Cadastra um produto.
  cadastrar(dados: any): Observable<any> {
    return this.http.post(this.apiUrl, dados);
  }

  // Atualiza um produto.
  atualizar(id: number, dados: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dados);
  }

  // Exclui um produto.
  excluir(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
