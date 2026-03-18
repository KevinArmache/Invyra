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

const features = [
  {
    icon: Wand2,
    title: 'AI-Generated Animations',
    description: 'Describe your vision, and our AI creates stunning 3D animations tailored to your event theme.'
  },
  {
    icon: Palette,
    title: 'Cinematic Themes',
    description: 'Choose from elegant, romantic, modern, or festive themes with beautiful particle effects and lighting.'
  },
  {
    icon: Users,
    title: 'Guest Management',
    description: 'Easily manage your guest list, track RSVPs, and handle plus-ones with our intuitive dashboard.'
  },
  {
    icon: Mail,
    title: 'Personalized Emails',
    description: 'Each guest receives a unique invitation link with their personalized animated experience.'
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Track invitation views, RSVP responses, and engagement metrics in real-time.'
  },
  {
    icon: Zap,
    title: 'Instant Preview',
    description: 'See your invitation come to life instantly as you customize colors, text, and animations.'
  },
  {
    icon: Sparkles,
    title: '3D Particle Effects',
    description: 'Mesmerizing particle systems that dance and flow, creating an immersive visual experience.'
  },
  {
    icon: Lock,
    title: 'Private & Secure',
    description: 'Your event details are encrypted and each invitation uses unique, secure access tokens.'
  }
]

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
            Everything You Need for{' '}
            <span className="text-gradient">Perfect Invitations</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From AI-powered design to smart analytics, Invyra provides all the tools 
            to create memorable event experiences.
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
