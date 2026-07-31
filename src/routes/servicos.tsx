import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { storageSupabase } from '../services/storage.supabase.service'
import { RequireAuth } from '../components/RequireAuth'

export const Route = createFileRoute('/servicos')({
  component: () => (
    <RequireAuth>
      <Servicos />
    </RequireAuth>
  ),
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

function Servicos() {
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

      <h1 className="text-2xl font-bold text-stone-700 flex items-center gap-2">
        <img src="/vite.svg" alt="" className="w-6 h-6" />
        Serviços da Clínica
      </h1>
      <p className="text-stone-500 text-sm mb-6">Lista de serviços cadastrados. Para alterações, entre em contato com o suporte.</p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicos.map(servico => (
          <div key={servico.id} className="bg-white p-4 rounded-xl shadow-md border border-stone-200">
            {servico.imagem && (
              <img
                src={servico.imagem}
                alt={servico.nome}
                className="w-full h-40 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = IMAGEM_INDISPONIVEL
                }}
              />
            )}
            <h3 className="font-bold text-lg mt-2">{servico.nome}</h3>
            <p className="text-sm text-stone-600">{servico.descricao}</p>
            <p className="text-stone-700 font-bold">R$ {servico.preco}</p>
            <p className="text-sm">Duração: {servico.duracao} min</p>
            <p className="text-sm text-stone-500">Dias: {servico.diasSemana?.join(', ') || 'Não definido'}</p>
            <p className="text-sm text-stone-500">Horários: {servico.horarios?.join(', ') || 'Não definido'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}