import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Produto, ProdutoService } from '../../services/produto.service';

interface FormularioProduto {
  iditem: number;
  idcategoria: number;
  item: string;
  descricaoItem: string;
  preco: number;
  tipoItem: string;
  ativoProdutoServico: string;
  codigoPreco: string | number;
  precoVenda: number;
  unidade: string;
}

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './produtos.html',
  styleUrl: './produtos.css'
})
export class Produtos implements OnInit {

  // Lista de produtos recebidos da API.
  produtos: Produto[] = [];

  // Textos e IDs utilizados na pesquisa.
  pesquisa = '';
  pesquisaId: number | null = null;

  // Controladores de estado da interface.
  carregando = false;
  buscandoId = false;
  salvando = false;
  mostrarFormulario = false;

  // Visualização e consulta por ID.
  produtoSelecionado: any = null;
  modalConsultaAberto = false;

  // Guarda o ID do item que está sendo editado.
  idEdicao: number | null = null;

  // Mensagens exibidas na tela.
  mensagemErro = '';
  mensagemSucesso = '';

  // Modelo utilizado pelo formulário.
  formulario: FormularioProduto = this.novoFormulario();

  constructor(
    private http: HttpClient,
    private produtoService: ProdutoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();
  }

  // Cria um formulário vazio.
  private novoFormulario(): FormularioProduto {
    return {
      iditem: 0,
      idcategoria: 0,
      item: '',
      descricaoItem: '',
      preco: 0,
      tipoItem: 'P',
      ativoProdutoServico: 'S',
      codigoPreco: '',
      precoVenda: 0,
      unidade: 'UN'
    };
  }

  // Busca os produtos priorizando a rota unificada /api/ItemServico.
  carregarProdutos(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.cdr.markForCheck();

    this.http.get<any[]>('https://localhost:7038/api/ItemServico').pipe(
      catchError(() => this.produtoService.listar()),
      catchError(() => of([]))
    ).subscribe({
      next: (dados: any) => {
        let lista = dados ?? [];
        if (!Array.isArray(lista)) {
          lista = lista?.$values ?? lista?.data ?? [];
        }
        this.produtos = lista;
        this.carregando = false;
        this.cdr.markForCheck();
      },

      error: (erro) => {
        console.error('Erro ao carregar produtos:', erro);
        this.mensagemErro = 'Não foi possível carregar os produtos. Verifique a API.';
        this.carregando = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Extrai o ID numérico do produto independente da estrutura da API.
  obterIdProduto(produto: Produto): number {
    const registro = produto as any;
    const item = this.dadosItem(produto);
    return Number(
      registro.iditem ??
      registro.Iditem ??
      registro.idItem ??
      item.iditem ??
      item.Iditem ??
      0
    );
  }

  // Buscador por ID com prioridade em memória (0ms) e fallback para API.
  buscarPorId(): void {
    if (!this.pesquisaId) {
      this.mensagemErro = 'Informe um código/ID válido para buscar.';
      return;
    }

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    // 1. Busca instantânea na memória local
    const produtoLocal = this.produtos.find(p => this.obterIdProduto(p) === Number(this.pesquisaId));
    if (produtoLocal) {
      this.consultarProduto(produtoLocal);
      this.mensagemSucesso = `Produto #${this.pesquisaId} encontrado!`;
      return;
    }

    // 2. Fallback: busca na API
    this.buscandoId = true;

    const requisicao$ = (this.produtoService as any).obterPorId 
      ? (this.produtoService as any).obterPorId(this.pesquisaId)
      : (this.produtoService as any).consultar 
      ? (this.produtoService as any).consultar(this.pesquisaId)
      : null;

    if (requisicao$) {
      requisicao$.subscribe({
        next: (dados: any) => {
          this.buscandoId = false;
          if (dados) {
            this.produtoSelecionado = dados;
            this.modalConsultaAberto = true;
            this.mensagemSucesso = `Produto #${this.pesquisaId} encontrado!`;
          } else {
            this.mensagemErro = `Produto com ID #${this.pesquisaId} não foi encontrado.`;
          }
          this.cdr.markForCheck();
        },
        error: (erro: any) => {
          console.error('Erro ao consultar produto por ID:', erro);
          this.buscandoId = false;
          this.mensagemErro = `Produto com ID #${this.pesquisaId} não foi encontrado.`;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.buscandoId = false;
      this.mensagemErro = `Produto com ID #${this.pesquisaId} não foi encontrado localmente.`;
      this.cdr.markForCheck();
    }
  }

  // Abre o painel de detalhes (modo leitura)
  consultarProduto(produto: Produto): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.mostrarFormulario = false;
    this.produtoSelecionado = produto;
    this.modalConsultaAberto = true;
    this.cdr.markForCheck();
  }

  fecharConsulta(): void {
    this.modalConsultaAberto = false;
    this.produtoSelecionado = null;
  }

  // Recupera os dados do item relacionado ao produto.
  private dadosItem(produto: Produto): any {
    return (produto as any).iditemNavigation ?? (produto as any).idItemNavigation ?? {};
  }

  nomeProduto(produto: Produto): string {
    const item = this.dadosItem(produto);
    const reg = produto as any;

    return (
      reg.item1 ??
      reg.item ??
      reg.Item1 ??
      reg.Item ??
      item.item1 ??
      item.item ??
      item.Item1 ??
      item.Item ??
      ''
    );
  }

  descricaoProduto(produto: Produto): string {
    const item = this.dadosItem(produto);
    const reg = produto as any;

    return (
      reg.descricaoItem ??
      reg.DescricaoItem ??
      item.descricaoItem ??
      item.DescricaoItem ??
      ''
    );
  }

  categoriaProduto(produto: Produto): number {
    const item = this.dadosItem(produto);
    const reg = produto as any;

    return Number(
      reg.idcategoria ??
      reg.Idcategoria ??
      item.idcategoria ??
      item.Idcategoria ??
      0
    );
  }

  tipoProduto(produto: Produto): string {
    const item = this.dadosItem(produto);
    const reg = produto as any;

    return (
      reg.tipoItem ??
      reg.TipoItem ??
      item.tipoItem ??
      item.TipoItem ??
      'P'
    );
  }

  situacaoProduto(produto: Produto): string {
    const item = this.dadosItem(produto);
    const reg = produto as any;

    return (
      reg.ativoProdutoServico ??
      reg.AtivoProdutoServico ??
      item.ativoProdutoServico ??
      item.AtivoProdutoServico ??
      'S'
    );
  }

  precoDoItem(produto: Produto): number {
    const item = this.dadosItem(produto);
    const reg = produto as any;

    return Number(
      reg.precoVenda ??
      reg.preco ??
      reg.PrecoVenda ??
      reg.Preco ??
      item.precoVenda ??
      item.preco ??
      0
    );
  }

  // Filtra os produtos por ID, nome ou descrição (garantindo tipo "P").
  get produtosFiltrados(): Produto[] {
    const termo = this.pesquisa.trim().toLowerCase();
    const idFiltro = this.pesquisaId !== null && this.pesquisaId !== undefined && String(this.pesquisaId).trim() !== ''
      ? String(this.pesquisaId).trim()
      : '';

    return this.produtos.filter(produto => {
      const idProdutoStr = String(this.obterIdProduto(produto));
      const nome = this.nomeProduto(produto).toLowerCase();
      const descricao = this.descricaoProduto(produto).toLowerCase();
      const tipo = String(this.tipoProduto(produto)).toUpperCase();

      const bateId = idFiltro ? idProdutoStr === idFiltro : true;
      const bateTermo = !termo ||
        idProdutoStr.includes(termo) ||
        nome.includes(termo) ||
        descricao.includes(termo);

      return tipo === 'P' && bateId && bateTermo;
    });
  }

  novoProduto(): void {
    this.fecharConsulta();
    this.idEdicao = null;
    this.formulario = this.novoFormulario();
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.mostrarFormulario = true;

    this.cdr.markForCheck();
  }

  editarProduto(produto: Produto): void {
    this.fecharConsulta();
    const item = this.dadosItem(produto);
    const registro = produto as any;

    this.idEdicao = this.obterIdProduto(produto);

    this.formulario = {
      iditem: this.idEdicao,
      idcategoria: Number(
        registro.idcategoria ??
        item.idcategoria ??
        0
      ),
      item: this.nomeProduto(produto),
      descricaoItem: this.descricaoProduto(produto),
      preco: Number(
        registro.preco ??
        item.preco ??
        0
      ),
      tipoItem: this.tipoProduto(produto),
      ativoProdutoServico: this.situacaoProduto(produto),
      codigoPreco: registro.codigoPreco ?? registro.CodigoPreco ?? '',
      precoVenda: Number(
        registro.precoVenda ??
        registro.preco ??
        item.preco ??
        0
      ),
      unidade:
        registro.unidade ??
        registro.Unidade ??
        'UN'
    };

    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.mostrarFormulario = true;

    this.cdr.markForCheck();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.idEdicao = null;
    this.formulario = this.novoFormulario();

    this.cdr.markForCheck();
  }

  salvarProduto(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (this.salvando) {
      return;
    }

    if (
      !this.formulario.item.trim() ||
      this.formulario.idcategoria <= 0 ||
      this.formulario.preco < 0 ||
      this.formulario.precoVenda < 0
    ) {
      this.mensagemErro =
        'Informe o nome, uma categoria válida e preços não negativos.';

      this.cdr.markForCheck();
      return;
    }

    this.salvando = true;
    this.cdr.markForCheck();

    const dados = { ...this.formulario };

    const requisicao = this.idEdicao !== null
      ? this.produtoService.atualizar(this.idEdicao, dados)
      : this.produtoService.cadastrar(dados);

    requisicao.subscribe({
      next: () => {
        this.salvando = false;
        this.mostrarFormulario = false;

        this.mensagemSucesso = this.idEdicao !== null
          ? 'Produto atualizado com sucesso!'
          : 'Produto cadastrado com sucesso!';

        this.idEdicao = null;
        this.formulario = this.novoFormulario();

        this.carregarProdutos();
        this.cdr.markForCheck();
      },

      error: (erro) => {
        console.error('Erro ao salvar produto:', erro);

        this.mensagemErro =
          erro?.error?.message ??
          erro?.error?.title ??
          'Não foi possível salvar o produto. Confira o DTO e a rota da API.';

        this.salvando = false;
        this.cdr.markForCheck();
      }
    });
  }

  excluirProduto(produto: Produto): void {
    const nome = this.nomeProduto(produto);

    const confirmar = window.confirm(
      `Deseja realmente excluir "${nome}"?`
    );

    if (!confirmar) {
      return;
    }

    const id = this.obterIdProduto(produto);

    if (!Number.isInteger(id) || id <= 0) {
      this.mensagemErro = 'Não foi possível identificar o produto para exclusão.';
      this.cdr.markForCheck();
      return;
    }

    this.produtoService.excluir(id).subscribe({
      next: () => {
        this.mensagemSucesso = 'Produto excluído com sucesso!';
        this.mensagemErro = '';

        this.carregarProdutos();
        this.cdr.markForCheck();
      },

      error: (erro) => {
        console.error('Erro ao excluir produto:', erro);

        this.mensagemErro =
          erro?.error?.message ??
          erro?.error?.title ??
          'Não foi possível excluir o produto. Verifique os registros vinculados.';

        this.cdr.markForCheck();
      }
    });
  }

  atualizar(): void {
    this.pesquisaId = null;
    this.pesquisa = '';
    this.carregarProdutos();
  }

  formatarPreco(valor: number): string {
    return Number(valor ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}