
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Representa um registro de estoque retornado pela API.
export interface Estoque {
  iditem: number;
  nomeProduto: string;
  quantidadeEstoque: number;
  unidade: string;
  precoVenda: number;
}

@Injectable({
  providedIn: 'root'
})
export class EstoqueService {

  // Endereço do controller Estoque no backend ASP.NET Core.
  private apiUrl = 'https://localhost:7038/api/Estoque';

  constructor(private http: HttpClient) {}

  // Busca todos os produtos cadastrados no estoque.
  listar(): Observable<Estoque[]> {
    return this.http.get<Estoque[]>(this.apiUrl);
  }

  // Consulta o estoque de um produto específico pelo ID.
  consultar(id: number): Observable<Estoque> {
    return this.http.get<Estoque>(`${this.apiUrl}/${id}`);
  }
}
