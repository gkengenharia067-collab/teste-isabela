import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Sparkles, ArrowLeft, Upload, Link2, X } from 'lucide-react'
import { storageSupabase } from '../services/storage.supabase.service'
import { RequireAuth } from '../components/RequireAuth'

export const Route = createFileRoute('/servicos')({
  component: () => (
    <RequireAuth>
      <Servicos />
    </RequireAuth>
  ),
})

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
const HORARIOS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']

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
  const [salvando, setSalvando] = useState(false)
  const [servicos, setServicos] = useState([])
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    preco: '',
    duracao: '60',
    imagem: '',
    categoria: '',
    diasSemana: [],
    horarios: [],
  })
  const [previewImagem, setPreviewImagem] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    carregarServicos()
  }, [])

  const carregarServicos = async () => {
    setCarregando(true)
    const lista = await storageSupabase.get('servicos', [])
    setServicos(lista)
    setCarregando(false)
  }

  const salvarServicos = async (novos) => {
    setSalvando(true)
    await storageSupabase.set('servicos', novos)
    setServicos(novos)
    setSalvando(false)
  }

  const cancelarAgendamentosDoServico = async (servicoId: string) => {
    const agendamentos = await storageSupabase.get('agendamentos', [])
    const atualizados = agendamentos.map(a =>
      a.servicoId === servicoId && a.status !== 'cancelado'
        ? { ...a, status: 'cancelado', canceladoPorExclusaoDeServico: true }
        : a
    )
    await storageSupabase.set('agendamentos', atualizados)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const novo = {
      id: editando ? editando.id : Date.now().toString(),
      ...form,
      preco: parseFloat(form.preco),
      duracao: parseInt(form.duracao),
    }
    let lista = [...servicos]
    if (editando) {
      lista = lista.map(s => s.id === editando.id ? novo : s)
    } else {
      lista.push(novo)
    }
    await salvarServicos(lista)
    setForm({ nome: '', descricao: '', preco: '', duracao: '60', imagem: '', categoria: '', diasSemana: [], horarios: [] })
    setPreviewImagem('')
    setEditando(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Remover serviço? Os agendamentos já feitos para ele serão cancelados automaticamente.')) return
    await cancelarAgendamentosDoServico(id)
    const lista = servicos.filter(s => s.id !== id)
    await salvarServicos(lista)
  }

  const handleEdit = (servico) => {
    setEditando(servico)
    setForm(servico)
    setPreviewImagem(servico.imagem || '')
  }

  const toggleDia = (dia) => {
    const current = form.diasSemana
    if (current.includes(dia)) {
      setForm({ ...form, diasSemana: current.filter(d => d !== dia) })
    } else {
      setForm({ ...form, diasSemana: [...current, dia] })
    }
  }

  const toggleHorario = (hora) => {
    const current = form.horarios
    if (current.includes(hora)) {
      setForm({ ...form, horarios: current.filter(h => h !== hora) })
    } else {
      const atualizados = [...current, hora].sort()
      setForm({ ...form, horarios: atualizados })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setForm({ ...form, imagem: base64 })
        setPreviewImagem(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const removerImagem = () => {
    setForm({ ...form, imagem: '' })
    setPreviewImagem('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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
        Gerenciar Serviços
      </h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md mt-6 border border-stone-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Nome do serviço</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Categoria</label>
            <input
              type="text"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="w-full border rounded-lg p-2"
              placeholder="Ex: Estética, Massagem..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: e.target.value })}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Duração (minutos)</label>
            <input
              type="number"
              value={form.duracao}
              onChange={(e) => setForm({ ...form, duracao: e.target.value })}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Imagem do serviço</label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Link2 className="size-4 text-stone-500" />
                <input
                  type="text"
                  value={form.imagem?.startsWith('data:') ? '' : form.imagem || ''}
                  onChange={(e) => {
                    setForm({ ...form, imagem: e.target.value })
                    setPreviewImagem(e.target.value)
                  }}
                  className="flex-1 border rounded-lg p-2"
                  placeholder="URL da imagem (ex: https://...)"
                />
              </div>
              <div className="flex items-center gap-2">
                <Upload className="size-4 text-stone-500" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 transition text-sm"
                >
                  Escolher arquivo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {previewImagem && (
                  <button
                    type="button"
                    onClick={removerImagem}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              {previewImagem && (
                <div className="mt-2">
                  <img
                    src={previewImagem}
                    alt="Preview"
                    className="h-24 w-auto object-contain rounded border"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = IMAGEM_INDISPONIVEL
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full border rounded-lg p-2"
              rows="2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Dias disponíveis</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {DIAS_SEMANA.map(dia => (
                <button
                  key={dia}
                  type="button"
                  onClick={() => toggleDia(dia)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    form.diasSemana.includes(dia) ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {dia}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Horários disponíveis</label>
            <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto">
              {HORARIOS.map(hora => (
                <button
                  key={hora}
                  type="button"
                  onClick={() => toggleHorario(hora)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    form.horarios.includes(hora) ? 'bg-stone-600 text-white' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {hora}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={salvando}
            className="bg-stone-700 text-white px-6 py-2 rounded-lg hover:bg-stone-800 transition disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editando && (
            <button type="button" onClick={() => { setEditando(null); setForm({ nome: '', descricao: '', preco: '', duracao: '60', imagem: '', categoria: '', diasSemana: [], horarios: [] }); setPreviewImagem('') }} className="bg-stone-300 px-6 py-2 rounded-lg">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleEdit(servico)} className="bg-stone-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-stone-700 transition">Editar</button>
              <button onClick={() => handleDelete(servico.id)} className="bg-stone-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-stone-600 transition">Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}