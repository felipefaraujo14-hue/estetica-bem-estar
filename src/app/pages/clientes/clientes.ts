import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService, Cliente } from '../../services/cliente.service';

interface EnderecoCliente {
  idEndereco?: number;
  cep: string;
  numero: string;
  complemento: string;
}

interface DadosCliente {
  idPessoa?: number;
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  email: string;
  telefone: string;
  ativoPessoa: string;
  enderecos: EnderecoCliente[];
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css'
})
export class Clientes implements OnInit {
  clientes: Cliente[] = [];
  pesquisa = '';
  pesquisaId: number | null = null;
  carregando = false;
  buscandoId = false;
  salvando = false;
  mensagemErro = '';
  mensagemSucesso = '';

  formularioAberto = false;
  modoEdicao = false;
  idEditando: number | null = null;

  clienteSelecionado: any = null;
  modalConsultaAberto = false;

  cliente: DadosCliente = this.novoCliente();

  constructor(
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.listarClientes();
  }

  novoCliente(): DadosCliente {
    return {
      nome: '',
      cpf: '',
      dataNascimento: '',
      sexo: '',
      email: '',
      telefone: '',
      ativoPessoa: 'S',
      enderecos: [
        {
          cep: '',
          numero: '',
          complemento: ''
        }
      ]
    };
  }

  listarClientes(): void {
    this.carregando = true;
    this.mensagemErro = '';

    this.clienteService.listar().subscribe({
      next: (dados) => {
        let lista = dados ?? [];
        if (!Array.isArray(lista)) {
          lista = (lista as any)?.$values ?? (lista as any)?.data ?? [];
        }
        this.clientes = lista;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao listar clientes:', erro);
        this.mensagemErro = 'Não foi possível carregar os clientes.';
        this.carregando = false;
        this.cdr.markForCheck();
      }
    });
  }

  buscarPorId(): void {
    if (!this.pesquisaId) {
      this.mensagemErro = 'Informe um código/ID válido para buscar.';
      return;
    }

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    const clienteLocal = this.clientes.find(c => Number(c.idPessoa ?? c.idpessoa) === Number(this.pesquisaId));
    if (clienteLocal) {
      this.consultarCliente(clienteLocal.idPessoa ?? clienteLocal.idpessoa);
      this.mensagemSucesso = `Cliente #${this.pesquisaId} encontrado!`;
      return;
    }

    this.buscandoId = true;

    this.clienteService.consultar(this.pesquisaId).subscribe({
      next: (dados: any) => {
        this.buscandoId = false;
        if (dados && (dados.idPessoa || dados.idpessoa)) {
          this.clienteSelecionado = dados;
          this.modalConsultaAberto = true;
          this.mensagemSucesso = `Cliente #${this.pesquisaId} encontrado!`;
        } else {
          this.mensagemErro = `Cliente com ID #${this.pesquisaId} não foi encontrado.`;
        }
        this.cdr.markForCheck();
      },
      error: (erro: any) => {
        console.error('Erro ao consultar cliente por ID:', erro);
        this.buscandoId = false;
        this.mensagemErro = `Cliente com ID #${this.pesquisaId} não foi encontrado.`;
        this.cdr.markForCheck();
      }
    });
  }

  get clientesFiltrados(): Cliente[] {
    const termo = this.pesquisa.trim().toLowerCase();
    const idFiltro = this.pesquisaId !== null && this.pesquisaId !== undefined && String(this.pesquisaId).trim() !== '' 
      ? String(this.pesquisaId).trim() 
      : '';

    return this.clientes.filter(cliente => {
      const idCliente = cliente.idPessoa ?? cliente.idpessoa;
      const bateId = idFiltro ? String(idCliente) === idFiltro : true;
      const bateTermo = !termo ||
        String(idCliente).includes(termo) ||
        (cliente.nome ?? '').toLowerCase().includes(termo) ||
        String(cliente.cpf ?? '').includes(termo);

      return bateId && bateTermo;
    });
  }

  abrirCadastro(): void {
    this.fecharConsulta();
    this.cliente = this.novoCliente();
    this.modoEdicao = false;
    this.idEditando = null;
    this.formularioAberto = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';
  }

  consultarCliente(id: number | undefined): void {
    if (!id) return;

    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.formularioAberto = false;

    const clienteLocal = this.clientes.find(c => (c.idPessoa ?? c.idpessoa) === id);
    if (clienteLocal) {
      this.clienteSelecionado = clienteLocal;
      this.modalConsultaAberto = true;
      this.cdr.markForCheck();
      return;
    }

    this.buscandoId = true;
    this.clienteService.consultar(id).subscribe({
      next: (dados: any) => {
        this.clienteSelecionado = dados;
        this.modalConsultaAberto = true;
        this.buscandoId = false;
        this.cdr.markForCheck();
      },
      error: (erro: any) => {
        console.error('Erro ao consultar cliente:', erro);
        this.mensagemErro = 'Não foi possível carregar os detalhes do cliente.';
        this.buscandoId = false;
        this.cdr.markForCheck();
      }
    });
  }

  fecharConsulta(): void {
    this.modalConsultaAberto = false;
    this.clienteSelecionado = null;
  }

  editarCliente(id: number): void {
    this.fecharConsulta();
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.clienteService.consultar(id).subscribe({
      next: (dados: any) => {
        const endereco = dados.enderecos?.[0];

        this.cliente = {
          idPessoa: dados.idPessoa ?? dados.idpessoa,
          nome: dados.nome ?? '',
          cpf: String(dados.cpf ?? ''),
          dataNascimento: dados.dataNascimento?.substring(0, 10) ?? '',
          sexo: dados.sexo ?? '',
          email: dados.email ?? '',
          telefone: String(dados.telefone ?? ''),
          ativoPessoa: dados.ativoPessoa ?? 'S',

          enderecos: [{
            idEndereco: endereco?.idEndereco,
            cep: endereco?.cep ?? '',
            numero: String(endereco?.numero ?? ''),
            complemento: endereco?.complemento ?? ''
          }]
        };

        this.idEditando = id;
        this.modoEdicao = true;
        this.formularioAberto = true;
        this.cdr.markForCheck();
      },
      error: (erro: any) => {
        console.error('Erro ao consultar cliente:', erro);
        this.mensagemErro = 'Não foi possível carregar os dados para edição.';
        this.cdr.markForCheck();
      }
    });
  }

  salvarCliente(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (
      !this.cliente.nome.trim() ||
      !this.cliente.cpf.trim() ||
      !this.cliente.dataNascimento ||
      !this.cliente.sexo
    ) {
      this.mensagemErro = 'Preencha nome, CPF, data de nascimento e sexo.';
      return;
    }

    const cpfNumerico = this.cliente.cpf.replace(/\D/g, '');
    const telefoneNumerico = this.cliente.telefone.replace(/\D/g, '');

    if (cpfNumerico.length !== 11) {
      this.mensagemErro = 'O CPF deve conter 11 números.';
      return;
    }

    const payload: any = {
      nome: this.cliente.nome.trim(),
      cpf: Number(cpfNumerico),
      dataNascimento: this.cliente.dataNascimento,
      sexo: this.cliente.sexo,
      email: this.cliente.email.trim(),
      telefone: telefoneNumerico ? Number(telefoneNumerico) : 0,
      ativoPessoa: this.cliente.ativoPessoa,
      enderecos: this.cliente.enderecos.map(e => {
        const end: any = {
          cep: e.cep,
          numero: e.numero,
          complemento: e.complemento
        };
        if (this.modoEdicao && e.idEndereco) {
          end.idEndereco = e.idEndereco;
        }
        return end;
      })
    };

    if (this.modoEdicao && this.idEditando !== null) {
      payload.idPessoa = this.idEditando;
    }

    this.salvando = true;

    const observer = {
      next: () => {
        this.mensagemSucesso = this.modoEdicao
          ? 'Cliente atualizado com sucesso!'
          : 'Cliente cadastrado com sucesso!';

        this.salvando = false;
        this.formularioAberto = false;
        this.listarClientes();
        this.cdr.markForCheck();
      },
      error: (erro: any) => {
        console.error('Erro ao salvar cliente:', erro);
        this.mensagemErro =
          erro.error?.mensagem ??
          erro.error?.title ??
          'Não foi possível salvar o cliente. Confira os dados enviados à API.';
        this.salvando = false;
        this.cdr.markForCheck();
      }
    };

    if (this.modoEdicao && this.idEditando !== null) {
      this.clienteService.atualizar(this.idEditando, payload).subscribe(observer);
    } else {
      this.clienteService.cadastrar(payload).subscribe(observer);
    }
  }

  cancelarFormulario(): void {
    this.formularioAberto = false;
    this.mensagemErro = '';
  }

  atualizar(): void {
    this.pesquisaId = null;
    this.pesquisa = '';
    this.listarClientes();
  }
}