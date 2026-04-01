import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage(): React.ReactElement {
  return (
    <main className="min-h-screen bg-gradient-hubstry flex items-center justify-center">
      <div className="container max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4 text-white">
          🛡️ Hubstry Compliance
        </h1>

        <p className="text-xl text-white mb-8 opacity-90">
          Plataforma profissional para auditar sites e verificar conformidade digital com
          padrões LGPD, ANSISA, FDA e ISO.
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <Link href="/auth/login">
            <Button size="lg" className="bg-white text-primary hover:bg-opacity-90">
              Fazer Login
            </Button>
          </Link>

          <Link href="/auth/register">
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary"
            >
              Criar Conta
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 text-white">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="font-bold mb-2">Scanner Inteligente</h3>
            <p className="text-sm text-white text-opacity-80">
              Detecção de dark patterns, autoplay, rastreadores e mais
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 text-white">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold mb-2">Dashboard Completo</h3>
            <p className="text-sm text-white text-opacity-80">
              Histórico de auditorias com score de conformidade em tempo real
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 text-white">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-bold mb-2">Seguro e Confiável</h3>
            <p className="text-sm text-white text-opacity-80">
              Criptografia de dados e conformidade com padrões internacionais
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-white border-opacity-20 text-white text-opacity-70 text-sm">
          <p>© 2026 Hubstry Compliance. Todos os direitos reservados.</p>
          <p className="mt-2">
            Email: guilhermemachado@hubstry.onmicrosoft.com
          </p>
        </div>
      </div>
    </main>
  )
}
