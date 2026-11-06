
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FuncionarioService, Funcionario, FuncionarioDados } from '../../services/funcionario.service';

@Component({
  selector: 'app-funcionarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './funcionarios.html',
  styleUrl: './funcionarios.css'
})
export class Funcionarios implements OnInit {

  // Lista exibida na tabela.
  funcionarios: Funcionario[] = [];

  // Texto utilizado na pesquisa.
  pesquisa = '';

  // Controla o carregamento da lista.
  carregando = false;

  // Controla o envio do formulário.
  salvando = false;

  // Controla a visibilidade do formulário.
  mostrarFormulario = false;

  // Guarda o ID do funcionário que está sendo editado.
  idEdicao: number | null = null;

  mensagemErro = '';
  mensagemSucesso = '';

  // Modelo utilizado pelo formulário.
  formulario: FuncionarioDados = this.novoFormulario();

  constructor(
    private funcionarioService: FuncionarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarFuncionarios();
  }

  // Cria um formulário vazio.
  private novoFormulario(): FuncionarioDados {
    return {
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
      cargo: '',
      dataNascimento: '',
      sexo: '',
      ativoPessoa: 'S',
      data_admissao: this.dataAtual()
    };
  }

  // Retorna a data atual no formato esperado pelo input date.
  private dataAtual(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  // Consulta os funcionários na API.
  carregarFuncionarios(): void {
    this.carregando = true;
    this.mensagemErro = '';

    this.cdr.markForCheck();

    this.funcionarioService.listar().subscribe({
      next: (dados) => {
        this.funcionarios = dados ?? [];
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao carregar funcionários:', erro);

        this.mensagemErro =
          'Não foi possível carregar os funcionários. Verifique a API.';

        this.carregando = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Filtra pelo nome ou CPF.
  get funcionariosFiltrados(): Funcionario[] {
    const termo = this.pesquisa.trim().toLowerCase();

    if (!termo) {
      return this.funcionarios;
    }

    return this.funcionarios.filter(funcionario =>
      (funcionario.nome ?? '').toLowerCase().includes(termo) ||
      String(funcionario.cpf ?? '').includes(termo)
    );
  }

  // Abre o formulário para um novo cadastro.
  novoFuncionario(): void {
    this.idEdicao = null;
    this.formulario = this.novoFormulario();
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.mostrarFormulario = true;
    this.cdr.markForCheck();
  }

  // Abre o formulário preenchido para edição.
  editarFuncionario(funcionario: Funcionario): void {
    this.idEdicao = funcionario.idPessoa;

    this.formulario = {
      nome: funcionario.nome ?? '',
      cpf: String(funcionario.cpf ?? ''),
      email: funcionario.email ?? '',
      telefone: String(funcionario.telefone ?? ''),
      cargo: funcionario.cargo ?? '',
      dataNascimento: funcionario.dataNascimento?.substring(0, 10) ?? '',
      sexo: funcionario.sexo ?? '',
      ativoPessoa: funcionario.ativoPessoa ?? 'S',
      data_admissao: funcionario.data_admissao?.substring(0, 10)
        ?? this.dataAtual()
    };

    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.mostrarFormulario = true;
    this.cdr.markForCheck();
  }

  // Fecha o formulário sem salvar.
  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.idEdicao = null;
    this.formulario = this.novoFormulario();
    this.cdr.markForCheck();
  }

  // Valida e envia o formulário.
  salvarFuncionario(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (this.salvando) {
      return;
    }

    if (
      !this.formulario.nome.trim() ||
      !this.formulario.cpf.trim() ||
      !this.formulario.cargo.trim()
    ) {
      this.mensagemErro =
        'Preencha pelo menos o nome, o CPF e o cargo.';
      this.cdr.markForCheck();
      return;
    }

    // Remove pontuação do CPF.
    const cpfLimpo = this.formulario.cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
      this.mensagemErro = 'O CPF deve conter 11 números.';
      this.cdr.markForCheck();
      return;
    }

    // Cria uma cópia dos dados a serem enviados.
    const dados: FuncionarioDados = {
      ...this.formulario,
      nome: this.formulario.nome.trim(),
      cpf: cpfLimpo,
      email: this.formulario.email.trim(),
      telefone: this.formulario.telefone.replace(/\D/g, ''),
      cargo: this.formulario.cargo.trim()
    };

    this.salvando = true;
    this.cdr.markForCheck();

    // Se houver ID, atualiza; caso contrário, cadastra.
    const requisicao = this.idEdicao !== null
      ? this.funcionarioService.atualizar(this.idEdicao, dados)
      : this.funcionarioService.cadastrar(dados);

    requisicao.subscribe({
      next: () => {
        this.salvando = false;
        this.mostrarFormulario = false;

        this.mensagemSucesso = this.idEdicao !== null
          ? 'Funcionário atualizado com sucesso!'
          : 'Funcionário cadastrado com sucesso!';

        this.idEdicao = null;
        this.formulario = this.novoFormulario();

        this.carregarFuncionarios();
        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao salvar funcionário:', erro);
        console.error('Resposta da API:', erro?.error);

        this.mensagemErro =
          erro?.error?.message ??
          erro?.error?.title ??
          'Não foi possível salvar o funcionário. Verifique o DTO e o endpoint da API.';

        this.salvando = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Solicita confirmação antes de excluir.
  excluirFuncionario(funcionario: Funcionario): void {
    const confirmar = window.confirm(
      `Deseja realmente excluir o funcionário "${funcionario.nome}"?`
    );

    if (!confirmar) {
      return;
    }

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.funcionarioService.excluir(funcionario.idPessoa).subscribe({
      next: () => {
        this.mensagemSucesso = 'Funcionário excluído com sucesso!';
        this.carregarFuncionarios();
        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao excluir funcionário:', erro);

        this.mensagemErro =
          erro?.error?.message ??
          erro?.error?.title ??
          'Não foi possível excluir o funcionário. Verifique se existem registros vinculados.';

        this.cdr.markForCheck();
      }
    });
  }
}
