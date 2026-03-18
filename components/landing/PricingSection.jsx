'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

import { useTranslation } from '@/utils/i18n/Context'

export default function PricingSection() {
  const { t } = useTranslation()

  const safeFeatures = (arr) => Array.isArray(arr) ? arr : []

  const plans = [
    {
      name: t('landing.pricing.plans.free.name'),
      price: t('landing.pricing.plans.free.price'),
      period: t('landing.pricing.plans.free.period'),
      description: t('landing.pricing.plans.free.desc'),
      features: safeFeatures(t('landing.pricing.plans.free.features')),
      cta: t('landing.pricing.plans.free.cta'),
      href: '/register',
      popular: false
    },
    {
      name: t('landing.pricing.plans.pro.name'),
      price: t('landing.pricing.plans.pro.price'),
      period: t('landing.pricing.plans.pro.period'),
      description: t('landing.pricing.plans.pro.desc'),
      features: safeFeatures(t('landing.pricing.plans.pro.features')),
      cta: t('landing.pricing.plans.pro.cta'),
      href: '/register',
      popular: true
    },
    {
      name: t('landing.pricing.plans.enterprise.name'),
      price: t('landing.pricing.plans.enterprise.price'),
      period: t('landing.pricing.plans.enterprise.period'),
      description: t('landing.pricing.plans.enterprise.desc'),
      features: safeFeatures(t('landing.pricing.plans.enterprise.features')),
      cta: t('landing.pricing.plans.enterprise.cta'),
      href: '/contact',
      popular: false
    }
  ]

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('landing.pricing.title')}<span className="text-gradient">{t('landing.pricing.title_highlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.pricing.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.popular 
                  ? 'bg-primary/5 border-2 border-primary' 
                  : 'bg-card border border-border/50'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">/ {plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                asChild 
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
