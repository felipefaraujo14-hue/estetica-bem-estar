
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Representa um endereço cadastrado para o cliente.
export interface EnderecoCliente {
  idEndereco: number;
  idPessoa: number;
  cep: string;
  numero: string;
  complemento: string | null;
}

// Representa os dados pessoais de um cliente.
export interface Cliente {
  idPessoa: number;
  nome: string;
  cpf: number | string;
  dataNascimento?: string;
  sexo?: string;
  email?: string;
  telefone?: number | string;
  ativoPessoa?: string | boolean;
  enderecos?: EnderecoCliente[];
}

// Representa um funcionário cadastrado.
export interface Funcionario {
  idPessoa: number;
  nome: string;
}

// Representa um item incluído no atendimento.
export interface AtendimentoItem {
  iditem: number;
  idpessoaFuncionario: number;
  quantidade: number;
  valorUnitario: number;
}

// Representa os dados enviados para registrar um atendimento.
export interface Atendimento {
  idpessoaCliente: number;
  dataAtendimento: string;
  status: string;
  itens: AtendimentoItem[];
}

@Injectable({
  providedIn: 'root'
})
export class AtendimentoService {

  // Endereço da API de atendimentos e pedidos.
  private readonly apiAtendimento =
    'https://localhost:7038/api/AtendimentoProdutoServico';

  // Endereço da API de clientes e endereços.
  private readonly apiClientes =
    'https://localhost:7038/api/PessoaEndereco';

  // Endereço da API de funcionários.
  private readonly apiFuncionarios =
    'https://localhost:7038/api/FuncionarioEndereco';

  constructor(private http: HttpClient) {}

  // Consulta todos os clientes com os dados retornados pela API.
  listarClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiClientes);
  }

  // Consulta os dados completos de um cliente específico.
  consultarCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiClientes}/${id}`);
  }

  // Mantém o método anterior para não quebrar componentes existentes.
  httpConsultarCliente(id: number): Observable<Cliente> {
    return this.consultarCliente(id);
  }

  // Cadastra um novo cliente.
  cadastrarCliente(dados: any): Observable<any> {
    return this.http.post<any>(this.apiClientes, dados);
  }

  // Atualiza os dados de um cliente existente.
  atualizarCliente(id: number, dados: any): Observable<any> {
    return this.http.put<any>(`${this.apiClientes}/${id}`, dados);
  }

  // Consulta todos os funcionários cadastrados.
  listarFuncionarios(): Observable<Funcionario[]> {
    return this.http.get<Funcionario[]>(this.apiFuncionarios);
  }

  // Consulta os atendimentos registrados no backend.
  listarPedidos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiAtendimento);
  }

  // Envia os dados para registrar um novo atendimento.
  finalizarPedido(dados: Atendimento): Observable<any> {
    return this.http.post<any>(this.apiAtendimento, dados);
  }
}
