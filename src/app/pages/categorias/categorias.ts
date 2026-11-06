import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Categoria, CategoriaService } from '../../services/categoria.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.html',
  styleUrl: '../produtos/produtos.css'
})
export class Categorias implements OnInit {
  categorias: Categoria[] = [];
  pesquisa = '';
  pesquisaId: number | null = null;

  carregando = false;
  buscandoId = false;
  salvando = false;
  mostrarFormulario = false;

  // Consulta por ID
  categoriaSelecionada: Categoria | null = null;
  modalConsultaAberto = false;

  idEdicao: number | null = null;
  mensagemErro = '';
  mensagemSucesso = '';

  formulario: Categoria = this.novoFormulario();

  constructor(
    private categoriaService: CategoriaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarCategorias();
  }

  private novoFormulario(): Categoria {
    return {
      idcategoria: 0,
      categoria: '',
      categoria1: '',
      descricao: ''
    };
  }

  // Obtém o nome da categoria cobrindo "categoria" ou "categoria1"
  obterNomeCategoria(cat: Categoria | null): string {
    if (!cat) return '';
    return cat.categoria ?? cat.categoria1 ?? '';
  }

  carregarCategorias(): void {
    this.carregando = true;
    this.mensagemErro = '';

    this.categoriaService.listar().subscribe({
      next: (dados) => {
        this.categorias = dados ?? [];
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (erro: any) => {
        console.error('Erro ao carregar categorias:', erro);
        this.mensagemErro = 'Não foi possível carregar as categorias. Verifique a conexão com a API.';
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

    const local = this.categorias.find(c => Number(c.idcategoria) === Number(this.pesquisaId));
    if (local) {
      this.consultarCategoria(local);
      this.mensagemSucesso = `Categoria #${this.pesquisaId} encontrada!`;
      return;
    }

    this.buscandoId = true;
    this.categoriaService.consultar(this.pesquisaId).subscribe({
      next: (dados) => {
        this.buscandoId = false;
        if (dados && dados.idcategoria) {
          this.categoriaSelecionada = dados;
          this.modalConsultaAberto = true;
          this.mensagemSucesso = `Categoria #${this.pesquisaId} encontrada!`;
        } else {
          this.mensagemErro = `Categoria #${this.pesquisaId} não foi encontrada.`;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.buscandoId = false;
        this.mensagemErro = `Categoria #${this.pesquisaId} não foi encontrada.`;
        this.cdr.markForCheck();
      }
    });
  }

  consultarCategoria(cat: Categoria): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.mostrarFormulario = false;
    this.categoriaSelecionada = cat;
    this.modalConsultaAberto = true;
    this.cdr.markForCheck();
  }

  fecharConsulta(): void {
    this.modalConsultaAberto = false;
    this.categoriaSelecionada = null;
  }

  get categoriasFiltradas(): Categoria[] {
    const termo = this.pesquisa.trim().toLowerCase();
    const idFiltro = this.pesquisaId !== null && String(this.pesquisaId).trim() !== ''
      ? String(this.pesquisaId).trim()
      : '';

    return this.categorias.filter(cat => {
      const idStr = String(cat.idcategoria ?? '');
      const nome = this.obterNomeCategoria(cat).toLowerCase();
      const desc = (cat.descricao ?? '').toLowerCase();

      const bateId = idFiltro ? idStr === idFiltro : true;
      const bateTermo = !termo || idStr.includes(termo) || nome.includes(termo) || desc.includes(termo);

      return bateId && bateTermo;
    });
  }

  novaCategoria(): void {
    this.fecharConsulta();
    this.idEdicao = null;
    this.formulario = this.novoFormulario();
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.mostrarFormulario = true;
    this.cdr.markForCheck();
  }

  editarCategoria(cat: Categoria): void {
    this.fecharConsulta();
    this.idEdicao = cat.idcategoria ?? null;

    const nome = this.obterNomeCategoria(cat);
    this.formulario = {
      idcategoria: cat.idcategoria,
      categoria: nome,
      categoria1: nome,
      descricao: cat.descricao ?? ''
    };

    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.mostrarFormulario = true;
    this.cdr.markForCheck();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.idEdicao = null;
    this.formulario = this.novoFormulario();
    this.cdr.markForCheck();
  }

  salvarCategoria(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    const nome = this.obterNomeCategoria(this.formulario);

    if (this.salvando) return;

    if (!nome.trim()) {
      this.mensagemErro = 'Informe o nome da categoria.';
      this.cdr.markForCheck();
      return;
    }

    this.salvando = true;
    this.cdr.markForCheck();

    const dadosEnvio: Categoria = {
      idcategoria: this.formulario.idcategoria,
      categoria: nome,
      categoria1: nome,
      descricao: this.formulario.descricao
    };

    const requisicao$: Observable<unknown> = this.idEdicao !== null
      ? this.categoriaService.atualizar(this.idEdicao, dadosEnvio)
      : this.categoriaService.cadastrar(dadosEnvio);

    requisicao$.subscribe({
      next: () => {
        const estavaEditando = this.idEdicao !== null;
        this.salvando = false;
        this.mostrarFormulario = false;
        this.idEdicao = null;
        this.formulario = this.novoFormulario();

        this.mensagemSucesso = estavaEditando
          ? 'Categoria atualizada com sucesso!'
          : 'Categoria cadastrada com sucesso!';

        this.carregarCategorias();
        this.cdr.markForCheck();
      },
      error: (erro: any) => {
        console.error('Erro ao salvar categoria:', erro);
        this.mensagemErro = erro?.error?.message ?? 'Não foi possível salvar a categoria.';
        this.salvando = false;
        this.cdr.markForCheck();
      }
    });
  }

  excluirCategoria(cat: Categoria): void {
    const id = cat.idcategoria;
    const nome = this.obterNomeCategoria(cat);
    if (!id) return;

    const confirmar = window.confirm(
      `Deseja realmente excluir a categoria "${nome}"?`
    );

    if (!confirmar) return;

    this.categoriaService.excluir(id).subscribe({
      next: () => {
        this.mensagemSucesso = 'Categoria excluída com sucesso!';
        this.carregarCategorias();
        this.cdr.markForCheck();
      },
      error: (erro: any) => {
        console.error('Erro ao excluir categoria:', erro);

        if (
          erro?.status === 409 ||
          erro?.status === 500 ||
          erro?.error?.includes?.('REFERENCE constraint') ||
          erro?.error?.message?.includes?.('constraint')
        ) {
          this.mensagemErro = `Não é possível excluir a categoria "${nome}", pois existem produtos ou serviços vinculados a ela no banco de dados.`;
        } else {
          this.mensagemErro = erro?.error?.message ?? 'Não foi possível excluir a categoria. Verifique os vínculos existentes.';
        }

        this.cdr.markForCheck();
      }
    });
  }

  atualizar(): void {
    this.pesquisaId = null;
    this.pesquisa = '';
    this.carregarCategorias();
  }
}