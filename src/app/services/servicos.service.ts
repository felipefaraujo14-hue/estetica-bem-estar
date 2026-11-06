
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Representa um serviço cadastrado na tabela Item.
export interface Servico {
  iditem: number;
  idcategoria: number;
  item1: string;
  descricaoItem: string;
  preco: number;
  tipoItem: string;
  ativoProdutoServico: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServicosService {

  // Endereço do controller ItemServico no backend.
  private apiUrl = 'https://localhost:7038/api/ItemServico';

  constructor(private http: HttpClient) {}

  // Consulta os itens cadastrados.
  listar(): Observable<Servico[]> {
    return this.http.get<Servico[]>(this.apiUrl);
  }

  // Consulta um serviço específico pelo ID.
  consultar(id: number): Observable<Servico> {
    return this.http.get<Servico>(`${this.apiUrl}/${id}`);
  }

  // Cadastra um novo serviço.
  cadastrar(dados: Servico): Observable<any> {
    return this.http.post(this.apiUrl, dados);
  }

  // Atualiza um serviço existente.
  atualizar(id: number, dados: Servico): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dados);
  }

  // Exclui um serviço pelo ID.
  excluir(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
