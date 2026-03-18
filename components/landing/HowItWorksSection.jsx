'use client'

import { motion } from 'framer-motion'
import { PenLine, Wand2, Send, BarChart3 } from 'lucide-react'

import { useTranslation } from '@/utils/i18n/Context'

export default function HowItWorksSection() {
  const { t } = useTranslation()

  const steps = [
    {
      icon: PenLine,
      step: '01',
      title: t('landing.how_it_works.steps.1.title'),
      description: t('landing.how_it_works.steps.1.desc')
    },
    {
      icon: Wand2,
      step: '02',
      title: t('landing.how_it_works.steps.2.title'),
      description: t('landing.how_it_works.steps.2.desc')
    },
    {
      icon: Send,
      step: '03',
      title: t('landing.how_it_works.steps.3.title'),
      description: t('landing.how_it_works.steps.3.desc')
    },
    {
      icon: BarChart3,
      step: '04',
      title: t('landing.how_it_works.steps.4.title'),
      description: t('landing.how_it_works.steps.4.desc')
    }
  ]

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('landing.how_it_works.title')}<span className="text-gradient">{t('landing.how_it_works.title_highlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.how_it_works.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(100%_-_1rem)] w-[calc(100%_-_2rem)] h-[2px] bg-gradient-to-r from-primary/50 to-primary/10" />
              )}
              
              <div className="text-center">
                <div className="relative inline-flex mb-6">
                  <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
