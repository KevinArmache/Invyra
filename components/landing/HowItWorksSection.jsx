'use client'

import { motion } from 'framer-motion'
import { PenLine, Wand2, Send, BarChart3 } from 'lucide-react'

const steps = [
  {
    icon: PenLine,
    step: '01',
    title: 'Create Your Event',
    description: 'Enter your event details - date, location, and a description of the vibe you want to create.'
  },
  {
    icon: Wand2,
    step: '02',
    title: 'AI Generates Magic',
    description: 'Our AI analyzes your theme and generates a custom 3D animation with particles, lighting, and effects.'
  },
  {
    icon: Send,
    step: '03',
    title: 'Invite Your Guests',
    description: 'Add your guest list and send personalized invitations with unique animated experiences.'
  },
  {
    icon: BarChart3,
    step: '04',
    title: 'Track Responses',
    description: 'Monitor RSVPs in real-time, see who viewed their invitation, and manage your guest list.'
  }
]

export default function HowItWorksSection() {
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
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create stunning invitations in just four simple steps
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
