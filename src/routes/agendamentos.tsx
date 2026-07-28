import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, CalendarDays, User, Phone, Trash2, Wand2 } from 'lucide-react'
import { storageSupabase } from '../services/storage.supabase.service'
import { RequireAuth } from '../components/RequireAuth'

export const Route = createFileRoute('/agendamentos')({
  validateSearch: (search: Record<string, unknown>) => ({
    filtro: (search.filtro as string) || 'todos',
  }),
  component: () => (
    <RequireAuth>
      <Agendamentos />
    </RequireAuth>
  ),
})

function Agendamentos() {
  const { filtro: filtroInicial } = Route.useSearch()
  const [carregando, setCarregando] = useState(true)
  const [agendamentos, setAgendamentos] = useState([])
  const [servicos, setServicos] = useState([])
  const [filtro, setFiltro] = useState(filtroInicial)

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    setCarregando(true)
    const [listaAgendamentos, listaServicos] = await Promise.all([
      storageSupabase.get('agendamentos', []),
      storageSupabase.get('servicos', []),
    ])
    setAgendamentos(listaAgendamentos)
    setServicos(listaServicos)
    setCarregando(false)
  }

  const nomeServico = (servicoId) => {
    const s = servicos.find(s => s.id === servicoId)
    return s ? s.nome : 'Serviço removido'
  }

  const handleCancelar = async (id) => {
    if (!confirm('Cancelar este agendamento?')) return
    const atualizados = agendamentos.map(a =>
      a.id === id ? { ...a, status: 'cancelado' } : a
    )
    await storageSupabase.set('agendamentos', atualizados)
    setAgendamentos(atualizados)
  }

  const handleRemover = async (id) => {
    if (!confirm('Remover este agendamento permanentemente?')) return
    const atualizados = agendamentos.filter(a => a.id !== id)
    await storageSupabase.set('agendamentos', atualizados)
    setAgendamentos(atualizados)
  }

  const handleLimparOrfaos = async () => {
    const idsServicosExistentes = servicos.map(s => s.id)
    const orfaos = agendamentos.filter(
      a => a.status !== 'cancelado' && !idsServicosExistentes.includes(a.servicoId)
    )

    if (orfaos.length === 0) {
      alert('Nenhum agendamento órfão encontrado. Tudo certo!')
      return
    }

    if (!confirm(`Encontrado(s) ${orfaos.length} agendamento(s) vinculado(s) a serviços que não existem mais. Cancelar automaticamente (sem apagar o histórico)?`)) {
      return
    }

    const atualizados = agendamentos.map(a =>
      orfaos.some(o => o.id === a.id)
        ? { ...a, status: 'cancelado', canceladoPorExclusaoDeServico: true }
        : a
    )
    await storageSupabase.set('agendamentos', atualizados)
    setAgendamentos(atualizados)
    alert(`${orfaos.length} agendamento(s) cancelado(s) com sucesso.`)
  }

  if (carregando) {
    return <div className="p-6 text-stone-500">Carregando...</div>
  }

  const hojeStr = format(new Date(), 'yyyy-MM-dd')

  const listaFiltrada = agendamentos
    .filter(a => {
      if (filtro === 'hoje') return a.data === hojeStr
      if (filtro === 'futuros') return a.data > hojeStr
      return true
    })
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-stone-700 hover:text-stone-900 mb-4 transition">
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-700 flex items-center gap-2">
          <CalendarDays className="w-6 h-6" />
          Agendamentos
        </h1>
        <button
          onClick={handleLimparOrfaos}
          className="inline-flex items-center gap-2 bg-stone-600 text-white px-4 py-2 rounded-lg hover:bg-stone-700 transition text-sm self-start md:self-auto"
        >
          <Wand2 className="w-4 h-4" />
          Limpar agendamentos órfãos
        </button>
      </div>

      <div className="flex gap-2 mt-4 mb-6">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'hoje', label: 'Hoje' },
          { key: 'futuros', label: 'Futuros' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-4 py-2 rounded-lg text-sm ${
              filtro === f.key ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {listaFiltrada.length === 0 ? (
        <p className="text-stone-500">Nenhum agendamento encontrado.</p>
      ) : (
        <div className="space-y-3">
          {listaFiltrada.map(a => (
            <div
              key={a.id}
              className={`bg-white p-4 rounded-xl shadow-md border flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                a.status === 'cancelado' ? 'border-stone-200 opacity-60' : 'border-stone-200'
              }`}
            >
              <div>
                <p className="font-bold">{nomeServico(a.servicoId)}</p>
                <p className="text-sm text-stone-600 flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" />
                  {new Date(a.data + 'T00:00:00').toLocaleDateString('pt-BR')} às {a.horario}
                </p>
                <p className="text-sm text-stone-600 flex items-center gap-1">
                  <User className="w-4 h-4" /> {a.clienteNome}
                </p>
                <p className="text-sm text-stone-600 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> {a.clienteTelefone}
                </p>
                <span
                  className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                    a.status === 'cancelado'
                      ? 'bg-stone-200 text-stone-600'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {a.status === 'cancelado' ? 'Cancelado' : 'Confirmado'}
                </span>
              </div>
              <div className="flex gap-2">
                {a.status !== 'cancelado' && (
                  <button
                    onClick={() => handleCancelar(a.id)}
                    className="bg-stone-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-stone-600 transition"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={() => handleRemover(a.id)}
                  className="bg-stone-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-stone-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}