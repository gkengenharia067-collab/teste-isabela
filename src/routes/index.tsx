import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarDays, Sparkles, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { storageSupabase } from '../services/storage.supabase.service'
import { RequireAuth } from '../components/RequireAuth'

export const Route = createFileRoute('/')({
  component: () => (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  ),
})

function Dashboard() {
  const [servicos, setServicos] = useState([])
  const [agendamentos, setAgendamentos] = useState([])

  useEffect(() => {
    async function carregar() {
      const storedServicos = await storageSupabase.get('servicos', [])
      const storedAgendamentos = await storageSupabase.get('agendamentos', [])
      setServicos(storedServicos)
      setAgendamentos(storedAgendamentos)
    }
    carregar()
  }, [])

  const totalServicos = servicos.length
  const totalAgendamentos = agendamentos.filter(a => a.status !== 'cancelado').length
  const agendamentosHoje = agendamentos.filter(a => {
    if (a.status === 'cancelado') return false
    return a.data === new Date().toISOString().slice(0, 10)
  }).length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-stone-700 flex items-center gap-2">
        <Sparkles className="w-8 h-8 text-stone-700" />
        Isabela Bertolli Estética
      </h1>
      <p className="text-stone-600 mb-6">Dashboard – visão geral da sua clínica</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/servicos" className="bg-white p-6 rounded-xl shadow-md border border-stone-200 hover:shadow-lg transition block">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-stone-700" />
            <div>
              <p className="text-sm text-stone-500">Serviços cadastrados</p>
              <p className="text-2xl font-bold">{totalServicos}</p>
            </div>
          </div>
        </Link>
        <Link to="/agendamentos?filtro=todos" className="bg-white p-6 rounded-xl shadow-md border border-stone-200 hover:shadow-lg transition block">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-stone-700" />
            <div>
              <p className="text-sm text-stone-500">Agendamentos confirmados</p>
              <p className="text-2xl font-bold">{totalAgendamentos}</p>
            </div>
          </div>
        </Link>
        <Link to="/agendamentos?filtro=hoje" className="bg-white p-6 rounded-xl shadow-md border border-stone-200 hover:shadow-lg transition block">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-stone-700" />
            <div>
              <p className="text-sm text-stone-500">Agendamentos hoje</p>
              <p className="text-2xl font-bold">{agendamentosHoje}</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8 flex gap-4">
        <Link to="/servicos" className="bg-stone-700 text-white px-6 py-3 rounded-lg hover:bg-stone-800 transition">
          Gerenciar Serviços
        </Link>
        <Link to="/catalogo" className="bg-stone-600 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition">
          Ver Catálogo Público
        </Link>
      </div>
    </div>
  )
}