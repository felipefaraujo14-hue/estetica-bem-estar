import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Servico, ServicosService } from '../../services/servicos.service';

@Component({
  selector: 'app-servicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servicos.html',
  styleUrl: '../produtos/produtos.css'
})
export class Servicos implements OnInit {

  servicos: Servico[] = [];
  pesquisa = '';
  pesquisaId: number | null = null;

  carregando = false;
  buscandoId = false;
  salvando = false;
  mostrarFormulario = false;

  // Consulta e visualização por ID
  servicoSelecionado: Servico | null = null;
  modalConsultaAberto = false;

  idEdicao: number | null = null;
  mensagemErro = '';
  mensagemSucesso = '';

  formulario: Servico = this.novoFormulario();

  constructor(
    private servicosService: ServicosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarServicos();
  }

  // Cria o formulário vazio.
  private novoFormulario(): Servico {
    return {
      iditem: 0,
      idcategoria: 0,
      item1: '',
      descricaoItem: '',
      preco: 0,
      tipoItem: 'S',
      ativoProdutoServico: 'S'
    };
  }

  // Busca na API somente os registros que são serviços.
  carregarServicos(): void {
    this.carregando = true;
    this.mensagemErro = '';

    this.servicosService.listar().subscribe({
      next: (dados) => {
        this.servicos = (dados ?? []).filter(
          item => item.tipoItem?.toUpperCase() === 'S'
        );

        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao carregar serviços:', erro);

        this.mensagemErro =
          'Não foi possível carregar os serviços. Verifique se a API está funcionando.';

        this.carregando = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Busca por ID com resposta imediata na memória local (0ms) e fallback para a API sem travar a lista
  buscarPorId(): void {
    if (!this.pesquisaId) {
      this.mensagemErro = 'Informe um código/ID válido para buscar.';
      return;
    }

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    // 1. Busca instantânea na memória local
    const servicoLocal = this.servicos.find(s => Number(s.iditem) === Number(this.pesquisaId));
    if (servicoLocal) {
      this.consultarServico(servicoLocal);
      this.mensagemSucesso = `Serviço #${this.pesquisaId} encontrado!`;
      return;
    }

    // 2. Fallback: busca na API sem travar a interface
    this.buscandoId = true;

    const requisicao$ = (this.servicosService as any).obterPorId
      ? (this.servicosService as any).obterPorId(this.pesquisaId)
      : (this.servicosService as any).consultar
      ? (this.servicosService as any).consultar(this.pesquisaId)
      : null;

    if (requisicao$) {
      requisicao$.subscribe({
        next: (dados: any) => {
          this.buscandoId = false;
          if (dados && dados.iditem) {
            this.servicoSelecionado = dados;
            this.modalConsultaAberto = true;
            this.mensagemSucesso = `Serviço #${this.pesquisaId} encontrado!`;
          } else {
            this.mensagemErro = `Serviço com ID #${this.pesquisaId} não foi encontrado.`;
          }
          this.cdr.markForCheck();
        },
        error: (erro: any) => {
          console.error('Erro ao consultar serviço por ID:', erro);
          this.buscandoId = false;
          this.mensagemErro = `Serviço com ID #${this.pesquisaId} não foi encontrado.`;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.buscandoId = false;
      this.mensagemErro = `Serviço com ID #${this.pesquisaId} não foi encontrado localmente.`;
      this.cdr.markForCheck();
    }
  }

  // Abre o painel de detalhes (modo leitura)
  consultarServico(servico: Servico): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.mostrarFormulario = false;
    this.servicoSelecionado = servico;
    this.modalConsultaAberto = true;
    this.cdr.markForCheck();
  }

  fecharConsulta(): void {
    this.modalConsultaAberto = false;
    this.servicoSelecionado = null;
  }

  // Filtra os serviços por ID, nome ou descrição.
  get servicosFiltrados(): Servico[] {
    const termo = this.pesquisa.trim().toLowerCase();
    const idFiltro = this.pesquisaId !== null && this.pesquisaId !== undefined && String(this.pesquisaId).trim() !== ''
      ? String(this.pesquisaId).trim()
      : '';

    return this.servicos.filter(servico => {
      const idStr = String(servico.iditem);
      const nome = (servico.item1 ?? '').toLowerCase();
      const descricao = (servico.descricaoItem ?? '').toLowerCase();

      const bateId = idFiltro ? idStr === idFiltro : true;
      const bateTermo = !termo ||
        idStr.includes(termo) ||
        nome.includes(termo) ||
        descricao.includes(termo);

      return bateId && bateTermo;
    });
  }

  // Abre um formulário novo.
  novoServico(): void {
    this.fecharConsulta();
    this.idEdicao = null;
    this.formulario = this.novoFormulario();
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.mostrarFormulario = true;
    this.cdr.markForCheck();
  }

  // Abre o formulário preenchido para edição.
  editarServico(servico: Servico): void {
    this.fecharConsulta();
    this.idEdicao = servico.iditem;

    this.formulario = {
      iditem: servico.iditem,
      idcategoria: servico.idcategoria,
      item1: servico.item1 ?? '',
      descricaoItem: servico.descricaoItem ?? '',
      preco: Number(servico.preco ?? 0),
      tipoItem: 'S',
      ativoProdutoServico: servico.ativoProdutoServico ?? 'S'
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

  // Desativa ou reativa o serviço alterando sua situação (ativoProdutoServico = 'N' / 'S')
  desativarServico(servico: Servico): void {
    const estaInativo = servico.ativoProdutoServico === 'N';
    const acao = estaInativo ? 'ativar' : 'desativar';
    const novoStatus = estaInativo ? 'S' : 'N';

    const confirmar = window.confirm(
      `Deseja realmente ${acao} o serviço "${servico.item1}"?`
    );

    if (!confirmar) {
      return;
    }

    const dadosAtualizados: Servico = {
      ...servico,
      tipoItem: 'S',
      ativoProdutoServico: novoStatus
    };

    this.servicosService.atualizar(servico.iditem, dadosAtualizados).subscribe({
      next: () => {
        this.mensagemSucesso = `Serviço ${estaInativo ? 'ativado' : 'desativado'} com sucesso!`;
        this.mensagemErro = '';
        this.carregarServicos();
        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error(`Erro ao ${acao} serviço:`, erro);
        this.mensagemErro =
          erro?.error?.message ??
          erro?.error?.title ??
          `Não foi possível ${acao} o serviço.`;
        this.cdr.markForCheck();
      }
    });
  }

  // Fecha e limpa o formulário.
  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.idEdicao = null;
    this.formulario = this.novoFormulario();
    this.cdr.markForCheck();
  }

  // Cadastra ou atualiza um serviço.
  salvarServico(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (this.salvando) {
      return;
    }

    if (
      !this.formulario.item1.trim() ||
      this.formulario.idcategoria <= 0 ||
      !Number.isFinite(Number(this.formulario.preco)) ||
      Number(this.formulario.preco) < 0
    ) {
      this.mensagemErro =
        'Informe o nome, uma categoria válida e um preço não negativo.';
      this.cdr.markForCheck();
      return;
    }

    // Garante que este registro seja enviado como serviço.
    const dados: Servico = {
      ...this.formulario,
      tipoItem: 'S',
      preco: Number(this.formulario.preco)
    };
    this.salvando = true;
    this.cdr.markForCheck();

    const requisicao = this.idEdicao !== null
      ? this.servicosService.atualizar(this.idEdicao, dados)
      : this.servicosService.cadastrar(dados);

    requisicao.subscribe({
      next: () => {
        const estavaEditando = this.idEdicao !== null;

        this.salvando = false;
        this.mostrarFormulario = false;
        this.idEdicao = null;
        this.formulario = this.novoFormulario();

        this.mensagemSucesso = estavaEditando
          ? 'Serviço atualizado com sucesso!'
          : 'Serviço cadastrado com sucesso!';

        this.carregarServicos();
        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao salvar serviço:', erro);

        this.mensagemErro =
          erro?.error?.message ??
          erro?.error?.title ??
          'Não foi possível salvar o serviço. Verifique a API e os dados enviados.';

        this.salvando = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Exclui um serviço após confirmação.
  excluirServico(servico: Servico): void {
    const confirmar = window.confirm(
      `Deseja realmente excluir "${servico.item1}"?`
    );

    if (!confirmar) {
      return;
    }

    this.servicosService.excluir(servico.iditem).subscribe({
      next: () => {
        this.mensagemSucesso = 'Serviço excluído com sucesso!';
        this.carregarServicos();
        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao excluir serviço:', erro);

        this.mensagemErro =
          erro?.error?.message ??
          erro?.error?.title ??
          'Não foi possível excluir o serviço. Verifique se ele está vinculado a algum atendimento.';

        this.cdr.markForCheck();
      }
    });
  }

  atualizar(): void {
    this.pesquisaId = null;
    this.pesquisa = '';
    this.carregarServicos();
  }

  // Exibe o preço no formato brasileiro.
  formatarPreco(valor: number): string {
    return Number(valor ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}