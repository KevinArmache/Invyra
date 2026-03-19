'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserTemplateById, updateUserTemplate } from '@/app/actions/template'
import { toast } from 'sonner'
import TemplateEditorForm from '@/components/dashboard/TemplateEditorForm'

export default function EditTemplatePage({ params }) {
  const router = useRouter()
  const { id } = use(params)
  const [template, setTemplate] = useState(null)

  useEffect(() => {
    getUserTemplateById(id)
      .then(tmpl => setTemplate(tmpl))
      .catch(e => {
        toast.error(e.message)
        router.push('/dashboard/templates')
      })
  }, [id, router])

  if (!template) return null

  const initialConfig = {
    type: 'code',
    html: template.config?.html || '',
    css: template.config?.css || '',
    js: template.config?.js || '',
  }

  async function handleSave(name, config) {
    try {
      await updateUserTemplate(id, name, config)
      toast.success('Modèle mis à jour !')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <TemplateEditorForm
      initialName={template.name}
      initialConfig={initialConfig}
      isEditing={true}
      onSave={handleSave}
    />
  )
}
