import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AtendimentoService } from '../../services/atendimento.service';

@Component({
  selector: 'app-consultar-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultar-pedidos.html',
  styleUrl: './consultar-pedidos.css'
})
export class ConsultarPedidos {
  cpfBusca = '';
  buscando = false;
  pedidosCliente: any[] = [];
  buscaRealizada = false;
  mensagemErro = '';
  clienteNome = '';

  constructor(
    private http: HttpClient,
    private atendimentoService: AtendimentoService,
    private cdr: ChangeDetectorRef
  ) {}

  buscarPorCpf(): void {
    const cpfLimpo = this.cpfBusca.replace(/\D/g, '').padStart(11, '0');

    if (!cpfLimpo || cpfLimpo === '00000000000' || this.cpfBusca.replace(/\D/g, '').length !== 11) {
      this.mensagemErro = 'Por favor, informe um CPF válido com 11 dígitos.';
      return;
    }

    this.buscando = true;
    this.mensagemErro = '';
    this.pedidosCliente = [];
    this.buscaRealizada = false;
    this.clienteNome = '';
    this.cdr.markForCheck();

    forkJoin({
      pedidos: this.atendimentoService.listarPedidos().pipe(catchError(() => of([]))),
      pessoas: this.http.get<any[]>('https://localhost:7038/api/PessoaEndereco').pipe(
        catchError(() => this.http.get<any[]>('https://localhost:7038/api/Pessoa')),
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ pedidos, pessoas }) => {
        let listaPedidos = Array.isArray(pedidos) ? pedidos : (pedidos as any)?.$values ?? [];
        let listaPessoas = Array.isArray(pessoas) ? pessoas : (pessoas as any)?.$values ?? [];

        // 1. Localiza o cliente na lista pelo CPF padronizado com 11 dígitos
        const pessoaEncontrada = listaPessoas.find((p: any) => {
          const cpfP = String(p.cpf ?? '').replace(/\D/g, '').padStart(11, '0');
          return cpfP === cpfLimpo;
        });

        const idPessoa = pessoaEncontrada ? Number(pessoaEncontrada.idPessoa ?? pessoaEncontrada.idpessoa) : null;
        if (pessoaEncontrada) {
          this.clienteNome = pessoaEncontrada.nome;
        }

        // 2. Filtra os pedidos associados cruzando idpessoaCliente, idPessoa ou CPF direto
        this.pedidosCliente = listaPedidos.filter((p: any) => {
          const idClienteNoPedido = Number(
            p.idpessoaCliente ?? p.idPessoa ?? p.idcliente ?? p.idPessoaNavigation?.idPessoa
          );

          if (idPessoa !== null && idClienteNoPedido === idPessoa) {
            return true;
          }

          const cpfPedido = String(p.cpf ?? p.cpfCliente ?? p.idPessoaNavigation?.cpf ?? '')
            .replace(/\D/g, '')
            .padStart(11, '0');

          return cpfPedido.length === 11 && cpfPedido === cpfLimpo;
        });

        if (!this.clienteNome && this.pedidosCliente.length > 0) {
          const primeiro = this.pedidosCliente[0];
          this.clienteNome = primeiro.nomeCliente ?? primeiro.idPessoaNavigation?.nome ?? 'Cliente';
        }

        this.finalizarBusca();
      },
      error: (err) => {
        console.error('Erro ao consultar pedidos:', err);
        this.mensagemErro = 'Não foi possível realizar a consulta no momento.';
        this.buscando = false;
        this.cdr.markForCheck();
      }
    });
  }

  private finalizarBusca(): void {
    this.buscando = false;
    this.buscaRealizada = true;
    this.cdr.markForCheck();
  }

  formatarCpfInput(): void {
    let v = this.cpfBusca.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 9) {
      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (v.length > 6) {
      v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (v.length > 3) {
      v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    this.cpfBusca = v;
  }

  formatarPreco(valor: number): string {
    return Number(valor ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  formatarData(data: any): string {
    if (!data) return 'Data não informada';
    if (typeof data === 'string') {
      const d = new Date(data);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('pt-BR');
      }
      return data.substring(0, 10);
    }
    if (typeof data === 'object' && data.year && data.month && data.day) {
      const dia = String(data.day).padStart(2, '0');
      const mes = String(data.month).padStart(2, '0');
      return `${dia}/${mes}/${data.year}`;
    }
    return String(data);
  }

  obterItens(pedido: any): any[] {
    const lista = pedido.itens ?? pedido.atendimentoitems ?? [];
    return Array.isArray(lista) ? lista : (lista as any)?.$values ?? [];
  }

  nomeStatus(status: string): string {
    switch (String(status ?? '').toUpperCase()) {
      case 'A': return 'Aberto';
      case 'F': return 'Finalizado';
      case 'C': return 'Cancelado';
      case 'P': return 'Pendente';
      default: return status || 'Finalizado';
    }
  }

  classeStatus(status: string): string {
    switch (String(status ?? '').toUpperCase()) {
      case 'A': return 'status-aberto';
      case 'F': return 'status-finalizado';
      case 'C': return 'status-cancelado';
      case 'P': return 'status-pendente';
      default: return 'status-finalizado';
    }
  }
}