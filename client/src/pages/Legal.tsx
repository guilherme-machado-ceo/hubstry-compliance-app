import { useEffect, type ReactNode } from "react";
import { HB, SiteFooter, SiteHeader } from "@/components/SiteChrome";

/**
 * Termos de Uso e Política de Privacidade do Hubstry Compliance.
 *
 * RASCUNHO para revisão jurídica (ADR-0012). Trechos entre colchetes
 * ([PREENCHER], [CONFIRMAR]) dependem de informação ou decisão do Guilherme
 * e não podem ir ao ar sem revisão. Enquanto LEGAL_RASCUNHO for true, as
 * páginas exibem um aviso de rascunho.
 */
const LEGAL_RASCUNHO = true;
const VERSAO = "19 de outubro de 2026";
const CONTATO = "guilhermemachado@hubstry.onmicrosoft.com";

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} — Hubstry Compliance`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <div className="hb-sans min-h-screen" style={{ background: HB.ink, color: HB.text }}>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 pt-16">
        <h1 className="hb-display font-bold leading-[1.05] text-4xl sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm" style={{ color: HB.muted }}>
          Versão de {VERSAO}.
        </p>
        {LEGAL_RASCUNHO && (
          <p className="mt-6 rounded-md border px-4 py-3 text-sm" style={{ borderColor: "#E8B931" }}>
            Rascunho em revisão jurídica. Este texto ainda pode mudar antes da versão definitiva.
          </p>
        )}
        <div className="mt-10 space-y-10 leading-relaxed [overflow-wrap:anywhere] [&_h2]:hb-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1.5">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function Termos() {
  return (
    <LegalPage title="Termos de Uso">
      <section>
        <h2>1. Quem somos</h2>
        <p>
          O Hubstry Compliance é um serviço da Hubstry Deep Tech, operado por GUILHERME GONCALVES MACHADO,
          microempreendedor individual (MEI), CNPJ 55.252.460/0001-07, com sede no Rio de Janeiro (RJ). Contato: <a className="underline underline-offset-4" href={`mailto:${CONTATO}`}>{CONTATO}</a>.
        </p>
      </section>

      <section>
        <h2>2. O que o serviço faz</h2>
        <p>
          O Hubstry Compliance faz uma triagem automática do HTML inicial de páginas públicas e aponta sinais
          relacionados a temas da LGPD e do ECA Digital (Lei 15.211/2025) que merecem revisão humana.
        </p>
        <ul>
          <li>A análise é heurística: lê apenas o HTML inicial, não executa JavaScript e não verifica outras páginas.</li>
          <li>Os resultados podem conter falsos positivos e falsos negativos.</li>
          <li>
            Os achados não comprovam violação legal e <strong>não constituem parecer ou consultoria jurídica</strong>.
            Decisões de conformidade devem contar com análise profissional.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Serviço gratuito</h2>
        <ul>
          <li>O serviço é gratuito, com um limite mensal de análises por conta, informado no painel.</li>
          <li>Funcionalidades, limites e disponibilidade podem mudar. Não há garantia de nível de serviço.</li>
          <li>
            Não há planos pagos nem cobrança, e não pedimos cartão de crédito. Se isso mudar, avisaremos com
            antecedência, e nada será cobrado sem contratação expressa.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Conta</h2>
        <p>
          O acesso é feito com sua conta do GitHub. Você é responsável pelo uso da sua conta e pode excluí-la a
          qualquer momento na página <a className="underline underline-offset-4" href="/conta">Conta</a>.
        </p>
      </section>

      <section>
        <h2>5. Uso permitido</h2>
        <p>Ao usar o serviço, você se compromete a:</p>
        <ul>
          <li>analisar apenas páginas públicas, acessíveis sem login;</li>
          <li>não usar o serviço para sobrecarregar, atacar ou testar a segurança de sites de terceiros;</li>
          <li>não contornar limites de uso nem automatizar o acesso de forma abusiva;</li>
          <li>não apresentar os resultados a terceiros como parecer jurídico ou certificação de conformidade.</li>
        </ul>
        <p>Podemos suspender contas que descumpram estes termos.</p>
      </section>

      <section>
        <h2>6. Limitação de responsabilidade</h2>
        <p>
          O serviço é fornecido como está, gratuitamente. Na medida permitida pela lei, a Hubstry não responde por
          decisões tomadas com base exclusiva nos resultados da triagem. [CONFIRMAR: redação desta cláusula na
          revisão jurídica.]
        </p>
      </section>

      <section>
        <h2>7. Privacidade</h2>
        <p>
          O tratamento de dados pessoais está descrito na{" "}
          <a className="underline underline-offset-4" href="/privacidade">Política de Privacidade</a>.
        </p>
      </section>

      <section>
        <h2>8. Alterações e lei aplicável</h2>
        <p>
          Podemos atualizar estes termos; a versão vigente fica sempre nesta página, com a data no topo. Mudanças
          relevantes serão comunicadas no serviço. Aplica-se a lei brasileira. [CONFIRMAR: foro.]
        </p>
      </section>
    </LegalPage>
  );
}

export function Privacidade() {
  return (
    <LegalPage title="Política de Privacidade">
      <section>
        <h2>1. Controlador e contato</h2>
        <p>
          Controlador: GUILHERME GONCALVES MACHADO, microempreendedor individual (MEI), CNPJ 55.252.460/0001-07,
          responsável pela Hubstry Deep Tech, Rio de Janeiro (RJ).
        </p>
        <p>
          Encarregado: como agente de tratamento de pequeno porte, não indicamos encarregado pelo tratamento de dados
          pessoais, conforme o art. 11 da Resolução CD/ANPD nº 2/2022. Pedidos e comunicações dos titulares são
          atendidos pelo canal de comunicação{" "}
          <a className="underline underline-offset-4" href={`mailto:${CONTATO}`}>{CONTATO}</a>. [CONFIRMAR:
          enquadramento como pequeno porte (receita bruta dentro do limite legal e ausência de grupo econômico que
          o ultrapasse).]
        </p>
      </section>

      <section>
        <h2>2. Dados que tratamos</h2>
        <ul>
          <li>
            <strong>Cadastro:</strong> nome, e-mail e identificador da sua conta do GitHub (recebidos no login com
            permissão de leitura do e-mail), datas de criação e do último acesso.
          </li>
          <li>
            <strong>Auditorias:</strong> os endereços (URLs) que você pede para analisar, o domínio, o score e os
            achados de cada análise.
          </li>
          <li>
            <strong>Plano e uso:</strong> plano da conta e número de análises no mês.
          </li>
          <li>
            <strong>Sessão:</strong> um cookie de sessão necessário para manter você conectado (ver item 6).
          </li>
          <li>
            <strong>Registros técnicos:</strong> a infraestrutura de hospedagem registra dados de acesso, como
            endereço IP e horário das requisições, para operação e segurança.
          </li>
        </ul>
        <p>
          <strong>HTML das páginas analisadas:</strong> é baixado, analisado em memória e descartado; não é
          armazenado. Se a página analisada contiver dados pessoais de terceiros, eles não são guardados.
        </p>
        <p>
          <strong>Analytics:</strong> o site não usa ferramentas de analytics nem carrega scripts de terceiros.
        </p>
      </section>

      <section>
        <h2>3. Finalidades e bases legais</h2>
        <p>[CONFIRMAR na revisão jurídica as bases legais abaixo.]</p>
        <ul>
          <li>Criar e manter sua conta, executar as análises e mostrar os resultados: execução de contrato (art. 7º, V, da LGPD).</li>
          <li>Aplicar limites de uso, prevenir abuso e manter a segurança do serviço: legítimo interesse (art. 7º, IX).</li>
          <li>Cumprir obrigações legais e regulatórias, quando houver: art. 7º, II.</li>
        </ul>
        <p>Não vendemos dados pessoais nem os usamos para publicidade.</p>
      </section>

      <section>
        <h2>4. Com quem compartilhamos</h2>
        <p>Usamos fornecedores que tratam dados em nosso nome (operadores):</p>
        <ul>
          <li><strong>Vercel</strong>: hospedagem do site e das funções do serviço.</li>
          <li><strong>Turso</strong>: banco de dados. [CONFIRMAR: região de armazenamento.]</li>
          <li><strong>GitHub</strong>: autenticação no login.</li>
        </ul>
        <p>O serviço é gratuito e não processa pagamentos; nenhum dado é enviado a processadores de pagamento.</p>
        <p>
          Alguns desses fornecedores processam dados fora do Brasil. [CONFIRMAR: mecanismo de transferência
          internacional aplicável (art. 33 da LGPD).]
        </p>
      </section>

      <section>
        <h2>5. Por quanto tempo guardamos</h2>
        <ul>
          <li>Cadastro e dados de plano: enquanto a conta existir.</li>
          <li>
            Auditorias concluídas: excluídas automaticamente após 90 dias. [CONFIRMAR: a rotina de exclusão está
            implementada; confirmar a execução em produção antes de publicar este item.]
          </li>
          <li>Auditorias com falha: mantidas até a exclusão da conta. [Retenção ainda em decisão.]</li>
          <li>Ao excluir a conta, apagamos imediatamente o cadastro, as auditorias e os dados de plano e uso.</li>
          <li>Registros técnicos da hospedagem: pelo prazo de retenção do fornecedor.</li>
        </ul>
      </section>

      <section>
        <h2>6. Cookies</h2>
        <p>
          Usamos um cookie de sessão estritamente necessário, protegido contra acesso por scripts (HttpOnly), com
          validade de até um ano ou até você sair da conta. Não usamos cookies de publicidade.
        </p>
      </section>

      <section>
        <h2>7. Seus direitos</h2>
        <p>
          Você pode pedir confirmação do tratamento, acesso, correção, anonimização, bloqueio ou eliminação,
          portabilidade e informações sobre compartilhamento, entre outros direitos do art. 18 da LGPD.
        </p>
        <ul>
          <li>
            <strong>Excluir a conta:</strong> diretamente na página{" "}
            <a className="underline underline-offset-4" href="/conta">Conta</a>, com efeito imediato.
          </li>
          <li>
            <strong>Demais pedidos:</strong> pelo e-mail{" "}
            <a className="underline underline-offset-4" href={`mailto:${CONTATO}`}>{CONTATO}</a>.
          </li>
        </ul>
        <p>Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).</p>
      </section>

      <section>
        <h2>8. Segurança</h2>
        <p>
          Adotamos medidas técnicas para proteger os dados, como conexões criptografadas, cookie de sessão protegido
          e proteção contra o uso do scanner para acessar endereços internos de rede.
        </p>
      </section>

      <section>
        <h2>9. Crianças e adolescentes</h2>
        <p>O serviço é destinado a profissionais e organizações e não é direcionado a crianças e adolescentes.</p>
      </section>

      <section>
        <h2>10. Alterações</h2>
        <p>
          Podemos atualizar esta política; a versão vigente fica sempre nesta página, com a data no topo. Mudanças
          relevantes serão comunicadas no serviço.
        </p>
      </section>
    </LegalPage>
  );
}
