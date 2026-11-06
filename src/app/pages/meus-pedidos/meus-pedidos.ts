import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtendimentoService } from '../../services/atendimento.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-meus-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meus-pedidos.html',
  styleUrl: './meus-pedidos.css'
})
export class MeusPedidos implements OnInit {
  pedidos: any[] = [];
  carregando = false;
  buscandoId = false;
  mensagemErro = '';
  mensagemSucesso = '';

  pesquisaId: number | null = null;
  pesquisa = '';

  modalConsultaAberto = false;
  pedidoSelecionado: any = null;

  constructor(
    private atendimentoService: AtendimentoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarPedidos();
  }

  carregarPedidos(): void {
    this.carregando = true;
    this.mensagemErro = '';

    this.atendimentoService.listarPedidos().subscribe({
      next: (dados: any) => {
        let lista = dados ?? [];
        if (!Array.isArray(lista)) {
          lista = lista?.$values ?? lista?.data ?? [];
        }
        this.pedidos = lista;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (erro: any) => {
        console.error('Erro ao carregar pedidos:', erro);
        this.mensagemErro = 'Não foi possível carregar os pedidos.';
        this.carregando = false;
        this.cdr.markForCheck();
      }
    });
  }

  buscarPorId(): void {
    if (!this.pesquisaId) {
      this.mensagemErro = 'Informe um número de pedido válido para buscar.';
      return;
    }

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    const pedidoLocal = this.pedidos.find(p => {
      const id = p.idAtendimento ?? p.idpedido ?? p.id;
      return Number(id) === Number(this.pesquisaId);
    });

    if (pedidoLocal) {
      this.consultarPedido(pedidoLocal);
      this.mensagemSucesso = `Pedido #${this.pesquisaId} encontrado!`;
      return;
    }

    this.buscandoId = true;
    this.atendimentoService.listarPedidos().pipe(
      catchError(() => of([]))
    ).subscribe({
      next: (dados: any) => {
        this.buscandoId = false;
        let lista = dados ?? [];
        if (!Array.isArray(lista)) {
          lista = lista?.$values ?? lista?.data ?? [];
        }
        const encontrado = lista.find((p: any) => Number(p.idAtendimento ?? p.idpedido ?? p.id) === Number(this.pesquisaId));

        if (encontrado) {
          this.consultarPedido(encontrado);
          this.mensagemSucesso = `Pedido #${this.pesquisaId} encontrado!`;
        } else {
          this.mensagemErro = `Pedido com ID #${this.pesquisaId} não foi encontrado.`;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.buscandoId = false;
        this.mensagemErro = `Pedido com ID #${this.pesquisaId} não foi encontrado.`;
        this.cdr.markForCheck();
      }
    });
  }

  get pedidosFiltrados(): any[] {
    const termo = this.pesquisa.trim().toLowerCase();
    const idFiltro = this.pesquisaId;

    return this.pedidos.filter(p => {
      const id = p.idAtendimento ?? p.idpedido ?? p.id;
      const nomeCliente = (p.nomeCliente ?? p.idPessoaNavigation?.nome ?? '').toLowerCase();

      const bateId = idFiltro !== null && idFiltro !== undefined && String(idFiltro).trim() !== ''
        ? String(id) === String(idFiltro).trim()
        : true;

      const bateTexto = !termo ||
        String(id).includes(termo) ||
        nomeCliente.includes(termo);

      return bateId && bateTexto;
    });
  }

  consultarPedido(pedido: any): void {
    this.pedidoSelecionado = pedido;
    this.modalConsultaAberto = true;
    this.cdr.markForCheck();
  }

  fecharConsulta(): void {
    this.modalConsultaAberto = false;
    this.pedidoSelecionado = null;
    this.cdr.markForCheck();
  }

  quantidadeItens(pedido: any): number {
    const itens = pedido?.atendimentoitems ?? pedido?.itens ?? [];
    if (!Array.isArray(itens)) return 0;
    return itens.reduce((acc: number, item: any) => acc + Number(item.quantidade ?? 1), 0);
  }

  totalPedido(pedido: any): number {
    if (pedido?.valorTotal !== undefined && pedido?.valorTotal !== null) {
      return Number(pedido.valorTotal);
    }
    const itens = pedido?.atendimentoitems ?? pedido?.itens ?? [];
    if (!Array.isArray(itens)) return 0;
    return itens.reduce((acc: number, item: any) => {
      const qtd = Number(item.quantidade ?? 1);
      const preco = Number(item.valorUnitario ?? item.preco ?? 0);
      return acc + (qtd * preco);
    }, 0);
  }

  nomeStatus(status: any): string {
    const s = String(status ?? '').toUpperCase();
    switch (s) {
      case 'A': return 'Aberto';
      case 'F': return 'Finalizado';
      case 'C': return 'Cancelado';
      case 'P': return 'Pendente';
      default: return status || 'Finalizado';
    }
  }

  classeStatus(status: any): string {
    const s = String(status ?? '').toUpperCase();
    switch (s) {
      case 'A': return 'status-aberto';
      case 'F': return 'status-finalizado';
      case 'C': return 'status-cancelado';
      case 'P': return 'status-pendente';
      default: return 'status-finalizado';
    }
  }

  formatarPreco(valor: number): string {
    return Number(valor ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  atualizar(): void {
    this.pesquisaId = null;
    this.pesquisa = '';
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.carregarPedidos();
  }
}