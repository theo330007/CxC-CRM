'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, business_name: businessName },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setConfirmed(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-semibold text-sage-700 tracking-tight mb-1">CxC</div>
          <p className="text-stone-500 text-sm">Créer votre compte</p>
        </div>

        {confirmed && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm text-center space-y-4 mb-4">
            <div className="w-12 h-12 bg-sage-50 rounded-full flex items-center justify-center mx-auto">
              <Mail size={24} className="text-sage-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-800 mb-1">Vérifiez votre boîte mail</p>
              <p className="text-sm text-stone-500">
                Un email de confirmation a été envoyé à <span className="font-medium text-stone-700">{email}</span>.<br />
                Cliquez sur le lien pour activer votre compte.
              </p>
            </div>
            <Link href="/login" className="inline-block text-sm text-sage-700 font-medium hover:underline">
              Retour à la connexion
            </Link>
          </div>
        )}

        {!confirmed && <form onSubmit={handleSignup} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Prénom et nom</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Camille Dupont"
              className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sage-500 text-stone-800 placeholder-stone-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Nom de l&apos;entreprise</label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              required
              placeholder="CamilleXCamille"
              className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sage-500 text-stone-800 placeholder-stone-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.com"
              className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sage-500 text-stone-800 placeholder-stone-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sage-500 text-stone-800 placeholder-stone-300"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sage-500 text-white text-sm font-medium rounded-lg hover:bg-sage-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>}

        {!confirmed && (
          <p className="text-center text-xs text-stone-400 mt-4">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-sage-700 hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
