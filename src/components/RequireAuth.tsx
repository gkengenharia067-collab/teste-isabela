import { useState } from 'react'
import { Lock } from 'lucide-react'
import { storeConfig } from '../config/store.config'
import { auth } from '../services/auth.service'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(false)

  if (auth.estaAutenticado()) {
    return (
      <>
        {children}
        <button
          onClick={() => auth.sair()}
          className="fixed top-4 right-4 bg-stone-200 text-stone-700 px-3 py-1 rounded text-sm hover:bg-stone-300 transition z-50"
        >
          Sair
        </button>
      </>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (auth.autenticar(senha)) {
      setErro(false)
      window.location.reload()
    } else {
      setErro(true)
      setSenha('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="bg-white p-8 rounded-xl shadow-md border border-stone-200 w-full max-w-sm">
        <div className="flex items-center gap-2 text-stone-700 mb-4">
          <Lock className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Área restrita</h2>
        </div>
        <p className="text-sm text-stone-500 mb-6">Digite a senha para acessar o painel administrativo.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-stone-500"
            autoFocus
          />
          {erro && <p className="text-red-500 text-sm mt-2">Senha incorreta</p>}
          <button
            type="submit"
            className="w-full bg-stone-700 text-white py-2 rounded-lg hover:bg-stone-800 transition mt-4"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}