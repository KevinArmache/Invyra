'use client'

import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Wand2, 
  Users, 
  BarChart3, 
  Mail, 
  Palette,
  Zap,
  Lock
} from 'lucide-react'

import { useTranslation } from '@/utils/i18n/Context'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
}

export default function FeaturesSection() {
  const { t } = useTranslation()

  const features = [
    {
      icon: Wand2,
      title: t('landing.features.items.ai.title'),
      description: t('landing.features.items.ai.desc')
    },
    {
      icon: Palette,
      title: t('landing.features.items.themes.title'),
      description: t('landing.features.items.themes.desc')
    },
    {
      icon: Users,
      title: t('landing.features.items.guests.title'),
      description: t('landing.features.items.guests.desc')
    },
    {
      icon: Mail,
      title: t('landing.features.items.emails.title'),
      description: t('landing.features.items.emails.desc')
    },
    {
      icon: BarChart3,
      title: t('landing.features.items.analytics.title'),
      description: t('landing.features.items.analytics.desc')
    },
    {
      icon: Zap,
      title: t('landing.features.items.preview.title'),
      description: t('landing.features.items.preview.desc')
    },
    {
      icon: Sparkles,
      title: t('landing.features.items.effects.title'),
      description: t('landing.features.items.effects.desc')
    },
    {
      icon: Lock,
      title: t('landing.features.items.security.title'),
      description: t('landing.features.items.security.desc')
    }
  ]

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('landing.features.title')}
            <span className="text-gradient">{t('landing.features.title_highlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
