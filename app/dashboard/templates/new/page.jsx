'use client'

import { saveUserTemplate } from '@/app/actions/template'
import { toast } from 'sonner'
import TemplateEditorForm from '@/components/dashboard/TemplateEditorForm'

export default function NewTemplatePage() {
  async function handleSave(name, config, status) {
    try {
      await saveUserTemplate(name, config, status)
      toast.success('Modèle créé avec succès !')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return <TemplateEditorForm onSave={handleSave} />
}
