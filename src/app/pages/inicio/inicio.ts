import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AtendimentoService } from '../../services/atendimento.service';
import { Estoque, EstoqueService } from '../../services/estoque.service';
import { ProdutoService } from '../../services/produto.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {
  carregando = false;
  mensagemErro = '';

  totalClientes = 0;
  totalProdutos = 0;
  totalServicos = 0;
  totalPedidos = 0;
  faturamentoTotal = 0;
  quantidadeTotalEstoque = 0;
  produtosEstoqueBaixoCount = 0;
  produtosSemEstoqueCount = 0;

  ultimosPedidos: any[] = [];
  itensEstoqueCritico: Estoque[] = [];

  constructor(
    private http: HttpClient,
    private produtoService: ProdutoService,
    private atendimentoService: AtendimentoService,
    private estoqueService: EstoqueService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarDadosDashboard();
  }

  carregarDadosDashboard(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.cdr.markForCheck();

    forkJoin({
      clientes: this.http.get<any[]>('https://localhost:7038/api/PessoaEndereco').pipe(
        catchError(() => this.http.get<any[]>('https://localhost:7038/api/Pessoa')),
        catchError(() => of([]))
      ),
      itens: this.http.get<any[]>('https://localhost:7038/api/ItemServico').pipe(
        catchError(() => this.produtoService.listar()),
        catchError(() => of([]))
      ),
      pedidos: this.atendimentoService.listarPedidos().pipe(catchError(() => of([]))),
      estoques: this.estoqueService.listar().pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        // 1. Processamento de Clientes
        let listaClientes: any = res.clientes ?? [];
        if (!Array.isArray(listaClientes)) {
          listaClientes = listaClientes?.$values ?? listaClientes?.data ?? [];
        }
        this.totalClientes = Array.isArray(listaClientes) ? listaClientes.length : 0;

        // 2. Processamento de Pedidos e Atendimentos
        const listaPedidos = res.pedidos ?? [];
        this.totalPedidos = listaPedidos.length;
        this.faturamentoTotal = listaPedidos.reduce(
          (acc: number, p: any) => acc + Number(p.valorTotal ?? 0),
          0
        );

        this.ultimosPedidos = [...listaPedidos]
          .sort((a, b) => new Date(b.dataAtendimento).getTime() - new Date(a.dataAtendimento).getTime())
          .slice(0, 5);

        // 3. Processamento de Produtos (P) e Serviços (S) via /api/ItemServico
        let listaItens: any[] = res.itens ?? [];
        if (!Array.isArray(listaItens)) {
          listaItens = (listaItens as any)?.$values ?? (listaItens as any)?.data ?? [];
        }

        // Contabiliza apenas itens com tipoItem "P"
        this.totalProdutos = listaItens.filter((i: any) => {
          const tipo = String(i.tipoItem ?? i.tipo ?? 'P').toUpperCase();
          return tipo === 'P';
        }).length;

        // Contabiliza apenas itens com tipoItem "S" (Ex: Corte de Cabelo)
        this.totalServicos = listaItens.filter((i: any) => {
          const tipo = String(i.tipoItem ?? i.tipo ?? '').toUpperCase();
          return tipo === 'S';
        }).length;

        // 4. Processamento de Estoque
        const listaEstoques: Estoque[] = res.estoques ?? [];
        this.quantidadeTotalEstoque = listaEstoques.reduce(
          (acc, e) => acc + Number(e.quantidadeEstoque || 0),
          0
        );

        this.produtosSemEstoqueCount = listaEstoques.filter(
          e => Number(e.quantidadeEstoque) <= 0
        ).length;

        this.produtosEstoqueBaixoCount = listaEstoques.filter(e => {
          const q = Number(e.quantidadeEstoque);
          return q > 0 && q <= 5;
        }).length;

        this.itensEstoqueCritico = listaEstoques
          .filter(e => Number(e.quantidadeEstoque) <= 5)
          .slice(0, 5);

        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar dashboard:', err);
        this.mensagemErro = 'Não foi possível carregar os dados resumidos do painel.';
        this.carregando = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatarPreco(valor: number): string {
    return Number(valor ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  nomeStatus(status: string): string {
    switch (String(status).toUpperCase()) {
      case 'A': return 'Aberto';
      case 'F': return 'Finalizado';
      case 'C': return 'Cancelado';
      case 'P': return 'Pendente';
      default: return status || 'Indefinido';
    }
  }

  classeStatus(status: string): string {
    switch (String(status).toUpperCase()) {
      case 'A': return 'status-aberto';
      case 'F': return 'status-finalizado';
      case 'C': return 'status-cancelado';
      case 'P': return 'status-pendente';
      default: return 'status-padrao';
    }
  }
}