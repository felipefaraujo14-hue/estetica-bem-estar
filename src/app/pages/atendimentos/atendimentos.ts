
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// Representa um item dentro de um atendimento.
interface ItemAtendimento {
  iditem: number;
  nomeItem: string;
  nomeFuncionario: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

// Representa um atendimento retornado pela API.
interface Atendimento {
  idAtendimento: number;
  idpessoaCliente: number;
  nomeCliente: string;
  dataAtendimento: string;
  status: string;
  valorTotal: number;
  itens: ItemAtendimento[];
}

@Component({
  selector: 'app-atendimentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './atendimentos.html',
  styleUrl: './atendimentos.css'
})
export class Atendimentos implements OnInit {

  // Endereço base da API de atendimentos.
  private readonly apiUrl =
    'https://localhost:7038/api/AtendimentoProdutoServico';

  // Lista de atendimentos recebidos da API.
  atendimentos: Atendimento[] = [];

  // Texto digitado no campo de pesquisa.
  pesquisa = '';

  // Status selecionado no filtro da tabela.
  statusSelecionado = 'Todos';

  // Controla a exibição do carregamento.
  carregando = false;

  // Mensagem apresentada caso ocorra um erro.
  mensagemErro = '';

  // Atendimento selecionado para consultar os detalhes.
  atendimentoSelecionado: Atendimento | null = null;

  // Status escolhido para cada atendimento antes de salvar.
  statusEdicao: Record<number, string> = {};

  // Indica quais atendimentos estão sendo atualizados.
  atualizandoStatus: Record<number, boolean> = {};

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  // Executa a consulta quando a tela é iniciada.
  ngOnInit(): void {
    this.carregarAtendimentos();
  }

  // Consulta os atendimentos cadastrados na API.
  carregarAtendimentos(): void {
    console.log('1. Iniciando consulta de atendimentos');

    this.carregando = true;
    this.mensagemErro = '';
    this.cdr.detectChanges();

    this.http.get<Atendimento[]>(this.apiUrl).subscribe({
      next: (dados) => {
        console.log('2. Dados recebidos da API:', dados);

        this.atendimentos = dados ?? [];

        // Inicializa o campo de edição com o status atual.
        for (const atendimento of this.atendimentos) {
          this.statusEdicao[atendimento.idAtendimento] =
            (atendimento.status ?? 'A').trim().toUpperCase();
        }

        console.log(
          '3. Quantidade de atendimentos:',
          this.atendimentos.length
        );

        this.carregando = false;
        this.cdr.detectChanges();

        console.log('4. Atualização da tela solicitada');
      },

      error: (erro) => {
        console.error('Erro ao consultar atendimentos:', erro);

        this.mensagemErro =
          'Não foi possível carregar os atendimentos. Verifique se a API está funcionando.';

        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Filtra pelo número, nome do cliente e status.
  get atendimentosFiltrados(): Atendimento[] {
    const texto = this.pesquisa.trim().toLowerCase();

    return this.atendimentos.filter((atendimento) => {
      const correspondePesquisa =
        !texto ||
        String(atendimento.idAtendimento).includes(texto) ||
        (atendimento.nomeCliente ?? '').toLowerCase().includes(texto);

      const correspondeStatus =
        this.statusSelecionado === 'Todos' ||
        this.normalizarStatus(atendimento.status) ===
          this.normalizarStatus(this.statusSelecionado);

      return correspondePesquisa && correspondeStatus;
    });
  }

  // Padroniza os códigos e nomes dos status para comparação.
  normalizarStatus(
    status: string | null | undefined
  ): string {
    const valor = (status ?? '').trim().toLowerCase();

    if (valor === 'a' || valor === 'ativo') {
      return 'ativo';
    }

    if (valor === 'p' || valor === 'pendente') {
      return 'pendente';
    }

    if (valor === 'f' || valor === 'finalizado') {
      return 'finalizado';
    }

    if (valor === 'c' || valor === 'cancelado') {
      return 'cancelado';
    }

    return valor;
  }

  // Converte o código do banco para um nome amigável.
  nomeStatus(
    status: string | null | undefined
  ): string {
    const valor = (status ?? '').trim().toUpperCase();

    const nomes: Record<string, string> = {
      A: 'Ativo',
      P: 'Pendente',
      F: 'Finalizado',
      C: 'Cancelado'
    };

    return nomes[valor] ?? (status || 'Não informado');
  }

  // Atualiza somente o status do atendimento.
  salvarStatus(atendimento: Atendimento): void {
    const id = atendimento.idAtendimento;

    const statusAtual =
      (atendimento.status ?? 'A').trim().toUpperCase();

    const novoStatus =
      (this.statusEdicao[id] ?? '').trim().toUpperCase();

    // Não envia a requisição se nada foi alterado.
    if (!novoStatus || novoStatus === statusAtual) {
      return;
    }

    // Confirma a alteração antes de enviá-la ao backend.
    const confirmar = window.confirm(
      `Deseja alterar o status do atendimento #${id} para "${this.nomeStatus(novoStatus)}"?`
    );

    if (!confirmar) {
      this.statusEdicao[id] = statusAtual;
      this.cdr.detectChanges();
      return;
    }

    // Indica que a requisição está em andamento.
    this.atualizandoStatus[id] = true;
    this.cdr.detectChanges();

    // PATCH altera apenas o status, sem reenviar os itens.
    this.http.patch<void>(
      `${this.apiUrl}/${id}/status`,
      {
        status: novoStatus
      }
    ).subscribe({
      next: () => {
        // Atualiza os dados da tela após o sucesso da API.
        atendimento.status = novoStatus;
        this.statusEdicao[id] = novoStatus;
        this.atualizandoStatus[id] = false;

        this.cdr.detectChanges();

        window.alert(
          'Status do atendimento atualizado com sucesso!'
        );
      },

      error: (erro) => {
        console.error(
          'Erro ao atualizar status:',
          erro
        );

        // Restaura o status anterior na tela.
        this.statusEdicao[id] = statusAtual;
        this.atualizandoStatus[id] = false;

        this.cdr.detectChanges();

        let mensagem =
          'Não foi possível atualizar o status.';

        if (erro.status === 0) {
          mensagem +=
            '\nNão foi possível conectar à API. Verifique se o backend está em execução.';
        } else if (erro.status === 404) {
          mensagem +=
            '\nEndpoint não encontrado. Confira se o método PATCH foi adicionado ao controller e reinicie o backend.';
        } else if (erro.status === 400) {
          mensagem +=
            '\nO backend rejeitou os dados enviados. Confira a resposta da requisição no navegador.';
        } else if (erro.status >= 500) {
          mensagem +=
            '\nOcorreu um erro no servidor ou no banco de dados.';
        }

        window.alert(mensagem);
      }
    });
  }

  // Abre os detalhes do atendimento selecionado.
  verDetalhes(atendimento: Atendimento): void {
    this.atendimentoSelecionado = atendimento;
  }

  // Fecha os detalhes do atendimento.
  fecharDetalhes(): void {
    this.atendimentoSelecionado = null;
  }

  // Formata valores para a moeda brasileira.
  formatarMoeda(
    valor: number | null | undefined
  ): string {
    return (valor ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  // Formata a data sem deslocamento de fuso horário.
  formatarData(
    data: string | null | undefined
  ): string {
    if (!data) {
      return '—';
    }

    const somenteData = data.substring(0, 10);
    const partes = somenteData.split('-');

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  // Exclui um atendimento após confirmação.
  excluirAtendimento(atendimento: Atendimento): void {
    const confirmar = window.confirm(
      `Deseja excluir o atendimento #${atendimento.idAtendimento} de ${atendimento.nomeCliente}?`
    );

    if (!confirmar) {
      return;
    }

    this.http
      .delete(`${this.apiUrl}/${atendimento.idAtendimento}`)
      .subscribe({
        next: () => {
          // Remove o atendimento excluído da lista.
          this.atendimentos = this.atendimentos.filter(
            (item) =>
              item.idAtendimento !== atendimento.idAtendimento
          );

          // Remove o status de edição do atendimento excluído.
          delete this.statusEdicao[atendimento.idAtendimento];
          delete this.atualizandoStatus[atendimento.idAtendimento];

          // Fecha os detalhes, caso estejam abertos.
          if (
            this.atendimentoSelecionado?.idAtendimento ===
            atendimento.idAtendimento
          ) {
            this.fecharDetalhes();
          }

          this.cdr.detectChanges();
        },

        error: (erro) => {
          console.error(
            'Erro ao excluir atendimento:',
            erro
          );

          let mensagem =
            'Não foi possível excluir o atendimento.';

          if (erro.status === 0) {
            mensagem +=
              '\nVerifique se a API está funcionando.';
          } else if (erro.status === 500) {
            mensagem +=
              '\nO banco de dados pode ter impedido a exclusão por causa de registros vinculados.';
          }

          window.alert(mensagem);
        }
      });
  }
}
