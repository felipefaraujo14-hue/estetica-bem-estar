import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Importa a interface com um nome diferente da classe do componente.
import {
  Estoque as EstoqueItem,
  EstoqueService
} from '../../services/estoque.service';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estoque.html',
  styleUrl: './estoque.css'
})
export class Estoque implements OnInit {

  // Lista de produtos recebidos da API.
  estoques: EstoqueItem[] = [];

  // Texto e ID digitados no campo de pesquisa.
  pesquisa = '';
  pesquisaId: number | null = null;

  // Controladores de estado da interface.
  carregando = false;
  buscandoId = false;

  // Mensagens apresentadas na tela.
  mensagemErro = '';
  mensagemSucesso = '';

  // Visualização e consulta por ID.
  estoqueSelecionado: EstoqueItem | null = null;
  modalConsultaAberto = false;

  constructor(
    private estoqueService: EstoqueService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Carrega o estoque assim que a página é aberta.
    this.carregarEstoque();
  }

  // Busca os dados no backend.
  carregarEstoque(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.cdr.markForCheck();

    this.estoqueService.listar().subscribe({
      next: (dados) => {
        this.estoques = dados ?? [];
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao carregar estoque:', erro);

        this.mensagemErro =
          'Não foi possível carregar o estoque. Verifique se a API está funcionando.';

        this.carregando = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Busca por ID com prioridade em memória local (0ms) e fallback para API sem congelar a lista.
  buscarPorId(): void {
    if (!this.pesquisaId) {
      this.mensagemErro = 'Informe um código/ID válido para buscar.';
      return;
    }

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    // 1. Busca instantânea na memória local
    const estoqueLocal = this.estoques.find(e => Number(e.iditem) === Number(this.pesquisaId));
    if (estoqueLocal) {
      this.consultarEstoque(estoqueLocal);
      this.mensagemSucesso = `Produto em estoque #${this.pesquisaId} encontrado!`;
      return;
    }

    // 2. Fallback: consulta ao servidor sem travar a lista inteira
    this.buscandoId = true;

    const requisicao$ = (this.estoqueService as any).obterPorId
      ? (this.estoqueService as any).obterPorId(this.pesquisaId)
      : (this.estoqueService as any).consultar
      ? (this.estoqueService as any).consultar(this.pesquisaId)
      : null;

    if (requisicao$) {
      requisicao$.subscribe({
        next: (dados: any) => {
          this.buscandoId = false;
          if (dados && (dados.iditem || dados.idItem)) {
            this.estoqueSelecionado = dados;
            this.modalConsultaAberto = true;
            this.mensagemSucesso = `Produto em estoque #${this.pesquisaId} encontrado!`;
          } else {
            this.mensagemErro = `Produto com ID #${this.pesquisaId} não foi encontrado no estoque.`;
          }
          this.cdr.markForCheck();
        },
        error: (erro: any) => {
          console.error('Erro ao consultar estoque por ID:', erro);
          this.buscandoId = false;
          this.mensagemErro = `Produto com ID #${this.pesquisaId} não foi encontrado no estoque.`;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.buscandoId = false;
      this.mensagemErro = `Produto com ID #${this.pesquisaId} não foi encontrado localmente.`;
      this.cdr.markForCheck();
    }
  }

  // Abre o painel de detalhes do item em estoque.
  consultarEstoque(estoque: EstoqueItem): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.estoqueSelecionado = estoque;
    this.modalConsultaAberto = true;
    this.cdr.markForCheck();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Fecha o painel de detalhes.
  fecharConsulta(): void {
    this.modalConsultaAberto = false;
    this.estoqueSelecionado = null;
  }

  // Filtra a lista pelo ID ou nome do produto.
  get estoquesFiltrados(): EstoqueItem[] {
    const termo = this.pesquisa.trim().toLowerCase();
    const idFiltro = this.pesquisaId !== null && this.pesquisaId !== undefined && String(this.pesquisaId).trim() !== ''
      ? String(this.pesquisaId).trim()
      : '';

    return this.estoques.filter(estoque => {
      const idStr = String(estoque.iditem ?? '');
      const nome = (estoque.nomeProduto ?? '').toLowerCase();

      const bateId = idFiltro ? idStr === idFiltro : true;
      const bateTermo = !termo || idStr.includes(termo) || nome.includes(termo);

      return bateId && bateTermo;
    });
  }

  // Calcula a quantidade total registrada nos produtos.
  get quantidadeTotal(): number {
    return this.estoques.reduce(
      (total, estoque) =>
        total + Number(estoque.quantidadeEstoque || 0),
      0
    );
  }

  // Conta os produtos sem unidades disponíveis.
  get produtosSemEstoque(): number {
    return this.estoques.filter(
      estoque => Number(estoque.quantidadeEstoque) <= 0
    ).length;
  }

  // Conta os produtos com estoque baixo (de 1 a 5 unidades).
  get produtosEstoqueBaixo(): number {
    return this.estoques.filter(estoque => {
      const quantidade = Number(estoque.quantidadeEstoque);
      return quantidade > 0 && quantidade <= 5;
    }).length;
  }

  // Define o texto da situação do estoque.
  situacaoEstoque(quantidade: number): string {
    if (quantidade <= 0) {
      return 'Sem estoque';
    }

    if (quantidade <= 5) {
      return 'Estoque baixo';
    }

    return 'Disponível';
  }

  // Formata o preço em reais.
  formatarPreco(valor: number): string {
    return Number(valor ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  // Atualiza a lista e limpa filtros.
  atualizar(): void {
    this.pesquisaId = null;
    this.pesquisa = '';
    this.carregarEstoque();
  }
}