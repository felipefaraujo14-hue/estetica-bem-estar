import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Endereco {
  idEndereco?: number;
  idPessoa?: number;
  cep?: string;
  numero?: string;
  complemento?: string;
}

export interface Cliente {
  idPessoa?: number;
  idpessoa?: number;
  nome: string;
  cpf?: string | number;
  dataNascimento?: string;
  sexo?: string;
  email?: string;
  telefone?: string | number;
  ativoPessoa?: string;
  enderecos?: Endereco[];
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  // Rota exata informada no Swagger que retorna os 16 cadastros
  private apiUrl = 'https://localhost:7038/api/PessoaEndereco';

  constructor(private http: HttpClient) {}

  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  consultar(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  cadastrar(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  atualizar(id: number, cliente: Cliente): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, cliente);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}