import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { storageSupabase } from '../services/storage.supabase.service'

export const Route = createFileRoute('/catalogo/')({
  component: Catalogo,
})

// Placeholder mostrado quando a URL da imagem do serviço não carrega.
const IMAGEM_INDISPONIVEL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#f3f4f6"/>
      <text x="200" y="150" font-family="sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">Imagem indisponível</text>
    </svg>`
  )

function Catalogo() {
  const [carregando, setCarregando] = useState(true)
  const [servicos, setServicos] = useState([])

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const lista = await storageSupabase.get('servicos', [])
      setServicos(lista)
      setCarregando(false)
    }
    carregar()
  }, [])

  if (carregando) {
    return <div className="p-6 text-stone-500">Carregando...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-stone-700 hover:text-stone-900 mb-4 transition">
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Dashboard
      </Link>

      <div className="flex items-center gap-2 text-stone-700 mb-4">
        <img src="/vite.svg" alt="" className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Catálogo de Serviços</h1>
      </div>
      <p className="text-stone-600 mb-6">Escolha um serviço e agende o melhor horário para você.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicos.map(servico => (
          <Link key={servico.id} to={`/catalogo/${servico.id}`} className="block">
            <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition border border-stone-200">
              {servico.imagem && (
                <img
                  src={servico.imagem}
                  alt={servico.nome}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = IMAGEM_INDISPONIVEL
                  }}
                />
              )}
              <h2 className="font-bold text-xl mt-2">{servico.nome}</h2>
              <p className="text-sm text-stone-600 line-clamp-2">{servico.descricao}</p>
              <p className="text-stone-700 font-bold mt-1">R$ {servico.preco}</p>
              <p className="text-sm text-stone-500">Duração: {servico.duracao} min</p>
              <p className="text-sm text-stone-500">Disponível: {servico.diasSemana?.join(', ')}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}