
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Representa os dados de um funcionário recebidos da API.
export interface Funcionario {
  idPessoa: number;
  nome: string;
  cpf: string | number;
  email: string;
  telefone: string | number;
  cargo: string;

  // Campos adicionais que podem ser exigidos pelo backend.
  dataNascimento?: string;
  sexo?: string;
  ativoPessoa?: string;
  data_admissao?: string;
}

// Dados enviados ao cadastrar ou editar um funcionário.
// O backend pode exigir outros campos conforme seu DTO.
export interface FuncionarioDados {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cargo: string;
  dataNascimento: string;
  sexo: string;
  ativoPessoa: string;
  data_admissao: string;
}

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {

  // Endereço da API de funcionários.
  private readonly apiUrl =
    'https://localhost:7038/api/FuncionarioEndereco';

  constructor(private http: HttpClient) {}

  // Busca todos os funcionários cadastrados.
  listar(): Observable<Funcionario[]> {
    return this.http.get<Funcionario[]>(this.apiUrl);
  }

  // Busca um funcionário específico pelo ID.
  buscarPorId(id: number): Observable<Funcionario> {
    return this.http.get<Funcionario>(`${this.apiUrl}/${id}`);
  }

  // Envia os dados para cadastrar um funcionário.
  cadastrar(dados: FuncionarioDados): Observable<any> {
    return this.http.post<any>(this.apiUrl, dados);
  }

  // Atualiza os dados de um funcionário existente.
  atualizar(
    id: number,
    dados: FuncionarioDados
  ): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dados);
  }

  // Exclui um funcionário pelo ID da pessoa.
  excluir(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
