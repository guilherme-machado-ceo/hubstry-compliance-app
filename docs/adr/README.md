# Registro de decisões de arquitetura (ADRs)

Formato e processo: [ADR-0001](0001-registrar-decisoes-em-adrs.md). Modelo: [0000-template.md](0000-template.md).

| ADR | Decisão | Status |
|---|---|---|
| [0001](0001-registrar-decisoes-em-adrs.md) | Registrar decisões em ADRs | Aceito |
| [0002](0002-hospedagem-na-vercel.md) | Manter a hospedagem na Vercel | Aceito |
| [0003](0003-funcoes-serverless-esm.md) | Convenções das funções serverless em ESM | Aceito |
| [0004](0004-motor-de-scan-deterministico.md) | Motor de scan determinístico | Aceito |
| [0005](0005-niveis-de-evidencia-e-linguagem.md) | Níveis de evidência e linguagem dos achados | Aceito (persistência: Proposto) |
| [0006](0006-fontes-normativas-versionadas.md) | Fontes normativas versionadas com status | Aceito |
| [0007](0007-ia-fora-do-caminho-critico.md) | IA apenas em experimento fora do produto | Aceito |
| [0008](0008-protecao-ssrf-no-scanner.md) | Proteção contra SSRF no scanner | Aceito (implementado no PR-4, PR #17; validação em runtime real pendente) |
| [0009](0009-segredos-e-variaveis-de-ambiente.md) | Gestão de segredos e variáveis de ambiente | Aceito (cron fail-closed: implementado no PR-5, em validação) |
| [0010](0010-marca-e-selo-nvidia-inception.md) | Marca Hubstry e selo NVIDIA Inception | Aceito |
| [0011](0011-dados-de-auditoria-e-html.md) | Tratamento do HTML analisado e retenção | Aceito (retenção de `completed`: implementada no PR-5, em validação; `failed`/`pending`: Proposto) |

## Decisões pendentes (ainda sem ADR)
- Remover o script de analytics herdado do template (`analytics.manus.im`) e demais sobras do template.
- Schema canônico do banco (MySQL ou libsql/Turso) e correção do `insertId`.
- Remoção definitiva do modo demo / bypass de autenticação.
- Pilar "Consentimento e Acessibilidade" mistura temas distintos no score.
- Onde mora o Radar Regulatório (Hubstry ou Lexiograph).
- Plano Vercel Hobby → Pro.
