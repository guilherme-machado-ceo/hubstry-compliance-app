import { useEffect } from "react";
import { HB, SiteFooter, SiteHeader } from "@/components/SiteChrome";

// Textos institucionais da Hubstry (autoria: Guilherme Gonçalves Machado).
// Manter fiéis ao original; alterações passam pelo autor.
const POSICIONAMENTO = [
  "A Hubstry é um operating deep tech venture builder focado em pesquisa, desenvolvimento e criação de ativos tecnológicos proprietários.",
  "Atuamos como um ecossistema de PD&I que combina eficiência de capital com soberania tecnológica, reduzindo o custo, o tempo e o risco associados ao desenvolvimento de inovação avançada.",
  "Nosso modelo permite que empresas acessem e co-desenvolvam soluções de ponta sem a necessidade de internalizar estruturas complexas de pesquisa.",
  "Ao estruturar e escalar ativos proprietários, criamos barreiras de entrada relevantes e capturamos valor antecipado em ciclos tecnológicos emergentes, oferecendo aos parceiros vantagem competitiva e acesso privilegiado a tecnologias antes da maturação de mercado.",
  "Paralelamente, operamos na antecipação de rotas tecnológicas com horizonte de 3 a 5 anos, permitindo que organizações reduzam exposição a disrupções e aumentem sua previsibilidade estratégica.",
  "Em síntese, a Hubstry transforma incerteza tecnológica em vantagem competitiva estruturada e de longo prazo.",
];

const MANIFESTO = [
  "Transição civilizatória é uma outra presença humana no planeta, e além dele: tecnológica, energética, econômica, jurídica. Esse além terrestre significa hoje o espaço exterior como ambiente civilizatório e astropolítico (geopolítico refere-se ao espaço terrestre).",
  "As semioses fazem a mediação entre o real e o imaginário. A Hubstry, como uma operating deep tech venture builder, cria e promove a interoperabilidade entre as semioses. A música é tão precisa quanto a matemática.",
  "O princípio metodológico da Hubstry Deep Tech: inflexão do pensamento humano incidindo sobre o conjunto universo dos fenômenos, instanciando-se em paralelo ou em série em múltiplas áreas do conhecimento — ciência, arte, filosofia, tradições espirituais —, cada qual com seu estatuto epistemológico próprio, em comparação e contraste sistemáticos operados pela analogia (seja heurística, funcional ou homológica), em um fluxo contínuo de pesquisa, estudo, criação, ensino e produção econômica.",
  "Nossa vocação e ofício, no horizonte civilizatório do real, do imaginário, do simbólico e do possível:",
  "Oferecer a oportunidade do desenvolvimento do potencial divino na humanidade — espaço infinito do possível —, em toda a sua plenitude, através de empreendimentos de força e matriz civilizatórias.",
  "O Divino, em nossa formulação pública e prospectiva, é instância não normativa e não confessional — suas dimensões normativa e confessional permanecem na esfera do foro íntimo, individual ou congregacional. Fundamenta-se na assunção do esplendor religioso em perspectiva pancrônica e universal, e em sua contribuição estrutural à história das civilizações: filosofia, Direito, artes, arquitetura. Acessível ao humano e não à máquina, que dele produz apenas mimese, constitui a zona de soberania exclusiva do humano, pois não cabe autoridade sobre o fenômeno a quem não é capaz de acessá-lo. Fronteira que nenhuma máquina pode legitimamente atravessar, é, por isso, camada originária de governança: não como prescrição de fé, mas como demarcação de jurisdição.",
  "Os empreendimentos nascidos deste horizonte podem servir à defesa da soberania do Estado Democrático de Direito, nos limites do direito internacional público e humanitário, dos tratados internacionais e das garantias de direitos fundamentais: o possível que buscamos é o da expansão do humano, nunca o de sua redução.",
  "Este manifesto é obra aberta: o signo é versionável como o código; a tese é refutável como o dogma. O manifesto permanece submetido ao escrutínio dos pares e à prova do real.",
];

export default function Sobre() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Sobre a Hubstry — Hubstry Compliance";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="hb-sans min-h-screen" style={{ background: HB.ink, color: HB.text }}>
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 pt-20">
        <h1 className="hb-display font-bold leading-[1.02] text-[2.6rem] sm:text-6xl lg:text-7xl">
          Sobre a Hubstry
        </h1>

        <section className="mt-20 grid gap-8 lg:grid-cols-[14rem_1fr]" aria-labelledby="posicionamento">
          <h2 id="posicionamento" className="hb-display text-xl font-semibold lg:sticky lg:top-8 self-start">
            Posicionamento
          </h2>
          <div className="space-y-5 text-lg leading-relaxed max-w-[64ch]">
            {POSICIONAMENTO.map((p) => (
              <p key={p.slice(0, 24)} style={{ color: p.startsWith("Em síntese") ? HB.text : HB.muted }}>
                {p}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-24 grid gap-8 lg:grid-cols-[14rem_1fr]" aria-labelledby="manifesto">
          <h2 id="manifesto" className="hb-display text-xl font-semibold lg:sticky lg:top-8 self-start">
            Manifesto
          </h2>
          <article className="hb-serif max-w-[62ch]">
            <div className="space-y-6 text-[1.2rem] leading-[1.75]">
              {MANIFESTO.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <footer className="mt-12 pt-6 border-t hb-sans" style={{ borderColor: HB.line }}>
              <p className="font-semibold">Guilherme Gonçalves Machado</p>
              <p className="text-sm mt-1" style={{ color: HB.muted }}>Founder da Hubstry Deep Tech</p>
              <p className="text-sm" style={{ color: HB.muted }}>Rio de Janeiro, primavera austral de 2026.</p>
            </footer>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
