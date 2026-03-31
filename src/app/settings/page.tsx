'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

import { DEFAULT_TEMPLATE, DEFAULT_SUBJECT, loadSettings } from '@/lib/settings'

export default function SettingsPage() {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const s = loadSettings()
    setTemplate(s.template)
    setSubject(s.subject)
  }, [])

  function save() {
    localStorage.setItem('cxc_email_template', template)
    localStorage.setItem('cxc_email_subject', subject)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function reset() {
    setTemplate(DEFAULT_TEMPLATE)
    setSubject(DEFAULT_SUBJECT)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800">Paramètres</h1>
        <p className="text-stone-500 text-sm mt-1">Configurez votre template d&apos;email et l&apos;objet par défaut.</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Objet de l&apos;email</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sage-500 text-stone-800"
          />
        </div>

        {/* Template */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Template du message</label>
          <p className="text-xs text-stone-400 mb-2">
            Utilisez <code className="bg-stone-100 px-1 py-0.5 rounded">{'{{Prénom}}'}</code> et{' '}
            <code className="bg-stone-100 px-1 py-0.5 rounded">{'{{personnalisation}}'}</code> — l&apos;IA remplira automatiquement ces champs.
          </p>
          <textarea
            value={template}
            onChange={e => setTemplate(e.target.value)}
            rows={16}
            className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sage-500 text-stone-800 leading-relaxed resize-y font-mono"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={reset}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            Réinitialiser par défaut
          </button>
          <button
            onClick={save}
            className="flex items-center gap-2 px-5 py-2.5 bg-sage-500 text-white text-sm font-medium rounded-lg hover:bg-sage-700 transition-colors"
          >
            {saved ? <><Check size={14} /> Enregistré</> : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
