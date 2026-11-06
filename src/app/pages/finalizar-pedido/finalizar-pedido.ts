import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CarrinhoService, ItemCarrinho } from '../../services/carrinho.service';

@Component({
  selector: 'app-finalizar-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finalizar-pedido.html',
  styleUrl: './finalizar-pedido.css'
})
export class FinalizarPedido implements OnInit {
  clientes: any[] = [];
  funcionarios: any[] = [];

  cpfBusca = '';
  idCliente: number | null = null;
  clienteSelecionado: any = null;

  idFuncionario: number | null = null;
  carregandoClientes = false;
  carregandoFuncionarios = false;
  enviando = false;

  dataAtendimento: string = new Date().toISOString().substring(0, 10);

  mensagemErro = '';
  mensagemSucesso = '';

  constructor(
    public carrinhoService: CarrinhoService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.itensCarrinho.length === 0) {
      this.router.navigate(['/carrinho']);
      return;
    }
    this.carregarClientes();
    this.carregarFuncionarios();
  }

  get itensCarrinho(): ItemCarrinho[] {
    return this.carrinhoService.listarItens() ?? [];
  }

  get totalPedido(): number {
    return this.carrinhoService.valorTotal ?? 0;
  }

  get clientesFiltrados(): any[] {
    if (!this.cpfBusca) return this.clientes;
    const cpfLimpo = this.cpfBusca.replace(/\D/g, '');
    return this.clientes.filter(c => {
      const cpfStr = String(c.cpf ?? '').replace(/\D/g, '');
      return cpfStr.includes(cpfLimpo);
    });
  }

  get enderecosCliente(): any[] {
    if (!this.clienteSelecionado) return [];
    return this.clienteSelecionado.enderecos ?? [];
  }

  carregarClientes(): void {
    this.carregandoClientes = true;
    this.http.get<any[]>('https://localhost:7038/api/PessoaEndereco').pipe(
      catchError(() => this.http.get<any[]>('https://localhost:7038/api/Pessoa')),
      catchError(() => of([]))
    ).subscribe({
      next: (dados: any) => {
        let lista = dados ?? [];
        if (!Array.isArray(lista)) {
          lista = lista?.$values ?? lista?.data ?? [];
        }
        this.clientes = lista;
        this.carregandoClientes = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregandoClientes = false;
        this.cdr.markForCheck();
      }
    });
  }

  carregarFuncionarios(): void {
    this.carregandoFuncionarios = true;
    this.http.get<any[]>('https://localhost:7038/api/FuncionarioEndereco').pipe(
      catchError(() => this.http.get<any[]>('https://localhost:7038/api/Funcionario')),
      catchError(() => of([]))
    ).subscribe({
      next: (dados: any) => {
        let lista = dados ?? [];
        if (!Array.isArray(lista)) {
          lista = lista?.$values ?? lista?.data ?? [];
        }
        this.funcionarios = lista;

        if (this.funcionarios.length > 0) {
          this.idFuncionario = this.obterIdFuncionario(this.funcionarios[0]);
        }
        this.carregandoFuncionarios = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregandoFuncionarios = false;
        this.cdr.markForCheck();
      }
    });
  }

  obterIdFuncionario(func: any): number {
    return Number(func?.idPessoa ?? func?.idfuncionario ?? func?.idFuncionario ?? func?.idpessoa ?? 0);
  }

  obterNomeFuncionario(func: any): string {
    const nome = func?.nome ?? func?.idPessoaNavigation?.nome;
    const cargo = func?.cargo ? ` (${func.cargo})` : '';
    return nome ? `${nome}${cargo}` : `Funcionário #${this.obterIdFuncionario(func)}`;
  }

  buscarPorCpf(): void {
    const cpfLimpo = this.cpfBusca.replace(/\D/g, '');
    if (!cpfLimpo) return;

    const encontrado = this.clientes.find(c => {
      const cpfStr = String(c.cpf ?? '').replace(/\D/g, '');
      return cpfStr === cpfLimpo;
    });

    if (encontrado) {
      this.clienteSelecionado = encontrado;
      this.idCliente = Number(encontrado.idPessoa ?? encontrado.idpessoa);
      this.mensagemErro = '';
    } else {
      this.clienteSelecionado = null;
      this.idCliente = null;
    }
    this.cdr.markForCheck();
  }

  selecionarCliente(event: any): void {
    const id = Number(event?.target?.value ?? event);
    if (!id) {
      this.clienteSelecionado = null;
      this.idCliente = null;
      return;
    }
    this.idCliente = id;
    this.clienteSelecionado = this.clientes.find(c => Number(c.idPessoa ?? c.idpessoa) === id) ?? null;
    if (this.clienteSelecionado) {
      this.cpfBusca = String(this.clienteSelecionado.cpf ?? '');
      this.mensagemErro = '';
    }
    this.cdr.markForCheck();
  }

  nomeItem(registro: ItemCarrinho): string {
    const item = registro?.item as any;
    return item?.item1 ?? item?.item ?? item?.nome ?? 'Produto/Serviço';
  }

  precoItem(registro: ItemCarrinho): number {
    const item = registro?.item as any;
    return Number(item?.preco ?? item?.precoVenda ?? 0);
  }

  subtotalItem(registro: ItemCarrinho): number {
    return this.precoItem(registro) * (registro?.quantidade ?? 1);
  }

  formatarPreco(valor: number): string {
    return Number(valor ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  confirmarPedido(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.clienteSelecionado) {
      this.mensagemErro = 'Selecione ou busque um cliente cadastrado antes de finalizar.';
      return;
    }

    if (!this.idFuncionario) {
      this.mensagemErro = 'Selecione o funcionário responsável pelo atendimento.';
      return;
    }

    if (this.itensCarrinho.length === 0) {
      this.mensagemErro = 'O carrinho está vazio.';
      return;
    }

    this.enviando = true;
    this.cdr.markForCheck();

    const idPessoaCliente = Number(this.clienteSelecionado.idPessoa ?? this.clienteSelecionado.idpessoa);
    const dataFormatada = this.dataAtendimento 
      ? this.dataAtendimento.substring(0, 10) 
      : new Date().toISOString().substring(0, 10);

    const itensMapeados = this.itensCarrinho.map(reg => {
      const item = reg.item as any;
      const idItem = Number(
        item?.iditem ??
        item?.idItem ??
        item?.iditemNavigation?.iditem ??
        item?.id ?? 0
      );

      return {
        iditem: idItem,
        quantidade: Number(reg.quantidade ?? 1),
        valorUnitario: this.precoItem(reg),
        idfuncionario: Number(this.idFuncionario),
        idpessoaFuncionario: Number(this.idFuncionario)
      };
    });

    const payload: any = {
      idPessoa: idPessoaCliente,
      idpessoaCliente: idPessoaCliente,
      dataAtendimento: dataFormatada,
      valorTotal: Number(this.totalPedido),
      statusAtendimento: 'F',
      status: 'F',
      atendimentoitems: itensMapeados,
      itens: itensMapeados
    };

    const url = 'https://localhost:7038/api/AtendimentoProdutoServico';

    this.http.post(url, payload).subscribe({
      next: () => {
        this.enviando = false;
        this.mensagemSucesso = 'Pedido registrado com sucesso!';
        this.carrinhoService.limpar();
        this.cdr.markForCheck();

        setTimeout(() => {
          this.router.navigate(['/meus-pedidos']);
        }, 1500);
      },
      error: (erro: any) => {
        console.error('Erro detalhado da API:', erro);
        this.enviando = false;

        let textoErro = 'Erro ao processar requisição no servidor.';

        if (erro.error) {
          if (typeof erro.error === 'string') {
            textoErro = erro.error;
          } else if (erro.error.errors) {
            const listaErros = Object.values(erro.error.errors).flat();
            textoErro = listaErros.join(' | ');
          } else if (erro.error.title) {
            textoErro = erro.error.title;
          } else if (erro.error.message) {
            textoErro = erro.error.message;
          } else {
            textoErro = JSON.stringify(erro.error);
          }
        } else if (erro.message) {
          textoErro = erro.message;
        }

        this.mensagemErro = `Não foi possível finalizar o pedido: ${textoErro}`;
        this.cdr.markForCheck();
      }
    });
  }
}