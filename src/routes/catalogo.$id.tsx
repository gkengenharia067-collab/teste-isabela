import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import { format, isToday, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock, User, Phone, Sparkles } from 'lucide-react'
import 'react-calendar/dist/Calendar.css'
import { storeConfig } from '../config/store.config'
import { storageSupabase } from '../services/storage.supabase.service'

export const Route = createFileRoute('/catalogo/$id')({
  component: DetalhesServico,
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

function normalizarDia(diaSemana: string) {
  return diaSemana
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace('-feira', '')
}

function DetalhesServico() {
  const { id } = Route.useParams()
  const [carregando, setCarregando] = useState(true)
  const [agendando, setAgendando] = useState(false)
  const [servico, setServico] = useState(null)
  const [agendamentos, setAgendamentos] = useState([])
  const [dataSelecionada, setDataSelecionada] = useState(new Date())
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([])

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const storedServicos = await storageSupabase.get('servicos', [])
      const found = storedServicos.find(s => s.id === id)
      setServico(found)

      const storedAgendamentos = await storageSupabase.get('agendamentos', [])
      setAgendamentos(storedAgendamentos)
      setCarregando(false)
    }
    carregar()
  }, [id])

  useEffect(() => {
    if (!servico) return
    const dataStr = format(dataSelecionada, 'yyyy-MM-dd')
    const diaSemana = format(dataSelecionada, 'EEEE', { locale: ptBR })
    const diaNormalizado = normalizarDia(diaSemana)
    const diasDisponiveis = servico.diasSemana.map(d => normalizarDia(d))

    if (!diasDisponiveis.includes(diaNormalizado)) {
      setHorariosDisponiveis([])
      return
    }

    const ocupados = agendamentos
      .filter(a => a.servicoId === id && a.data === dataStr && a.status !== 'cancelado')
      .map(a => a.horario)

    const todosHorarios = servico.horarios || []
    const agora = new Date()
    const hoje = isToday(dataSelecionada)

    const disponiveis = todosHorarios.filter(h => {
      if (ocupados.includes(h)) return false
      if (hoje) {
        const [hora, min] = h.split(':').map(Number)
        const horarioDate = new Date()
        horarioDate.setHours(hora, min, 0, 0)
        return horarioDate > agora
      }
      return true
    })

    setHorariosDisponiveis(disponiveis)
    setHorarioSelecionado('')
  }, [dataSelecionada, servico, agendamentos, id])

  const handleAgendar = async () => {
    if (!clienteNome || !clienteTelefone || !horarioSelecionado) {
      alert('Preencha todos os campos e selecione um horário.')
      return
    }

    setAgendando(true)

    const dataStr = format(dataSelecionada, 'yyyy-MM-dd')
    const novoAgendamento = {
      id: Date.now().toString(),
      servicoId: id,
      data: dataStr,
      horario: horarioSelecionado,
      clienteNome,
      clienteTelefone,
      status: 'confirmado',
    }

    const updated = [...agendamentos, novoAgendamento]
    await storageSupabase.set('agendamentos', updated)
    setAgendamentos(updated)

    const mensagem = `Olá! Gostaria de confirmar meu agendamento:\n\n*Serviço:* ${servico.nome}\n*Data:* ${format(dataSelecionada, 'dd/MM/yyyy')}\n*Horário:* ${horarioSelecionado}\n*Cliente:* ${clienteNome}\n*Telefone:* ${clienteTelefone}\n\nAguardando confirmação.`
    const url = `https://wa.me/${storeConfig.whatsappNumero}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')

    alert('Agendamento realizado com sucesso! Você será redirecionado ao WhatsApp para finalizar.')
    setClienteNome('')
    setClienteTelefone('')
    setHorarioSelecionado('')
    setAgendando(false)
  }

  if (carregando) {
    return <div className="p-6 text-stone-500">Carregando...</div>
  }

  if (!servico) return <div className="p-6">Serviço não encontrado.</div>

  const tileDisabled = ({ date }) => {
    if (isPast(date) && !isToday(date)) return true
    const diaSemana = format(date, 'EEEE', { locale: ptBR })
    const diaNormalizado = normalizarDia(diaSemana)
    const diasDisponiveis = servico.diasSemana.map(d => normalizarDia(d))
    return !diasDisponiveis.includes(diaNormalizado)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-stone-200">
        {servico.imagem && (
          <img
            src={servico.imagem}
            alt={servico.nome}
            className="w-full h-64 object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = IMAGEM_INDISPONIVEL
            }}
          />
        )}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-stone-700">{servico.nome}</h1>
          <p className="text-stone-600 mt-2">{servico.descricao}</p>
          <div className="flex gap-4 mt-3">
            <span className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-sm">R$ {servico.preco}</span>
            <span className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-sm">{servico.duracao} min</span>
          </div>
          <p className="text-sm text-stone-500 mt-2">Disponível: {servico.diasSemana.join(', ')}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5" /> Escolha o dia
          </h2>
          <Calendar
            onChange={setDataSelecionada}
            value={dataSelecionada}
            tileDisabled={tileDisabled}
            locale="pt-BR"
            className="mt-2 rounded-lg shadow border border-stone-200"
            minDate={new Date()}
          />
          <p className="text-sm text-stone-500 mt-2">
            Dias destacados estão disponíveis. Dias cinza não atendemos.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5" /> Horários disponíveis
            <span className="text-sm font-normal text-stone-500">
              ({format(dataSelecionada, 'dd/MM/yyyy')})
            </span>
          </h2>

          {horariosDisponiveis.length === 0 ? (
            <p className="text-stone-500 mt-2">Nenhum horário disponível para esta data.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {horariosDisponiveis.map(h => (
                <button
                  key={h}
                  onClick={() => setHorarioSelecionado(h)}
                  className={`py-2 px-3 rounded-lg border ${
                    horarioSelecionado === h
                      ? 'bg-stone-700 text-white border-stone-700'
                      : 'bg-white border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}

          {horarioSelecionado && (
            <div className="mt-6 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <p className="font-semibold">Horário selecionado: {horarioSelecionado}</p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-stone-600" />
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    className="flex-1 border rounded-lg p-2"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-stone-600" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Seu telefone (com DDD)"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 border rounded-lg p-2"
                  />
                </div>
                <button
                  onClick={handleAgendar}
                  disabled={agendando}
                  className="w-full bg-stone-700 text-white py-3 rounded-lg hover:bg-stone-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" />
                  {agendando ? 'Agendando...' : 'Agendar e enviar WhatsApp'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Link to="/catalogo" className="text-stone-700 hover:underline">← Voltar ao catálogo</Link>
      </div>
    </div>
  )
}