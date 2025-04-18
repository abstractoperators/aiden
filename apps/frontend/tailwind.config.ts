import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontSize: {
  			d1: [
  				'4.5rem',
  				'120%'
  			],
  			d2: [
  				'3.25rem',
  				'120%'
  			],
  			d3: [
  				'2.75rem',
  				'120%'
  			],
  			d4: [
  				'2.25rem',
  				'130%'
  			],
  			d5: [
  				'1.75rem',
  				'140%'
  			],
  			d6: [
  				'1.375rem',
  				'140%'
  			],
  			m1: [
  				'2.75rem',
  				'120%'
  			],
  			m2: [
  				'2.5rem',
  				'120%'
  			],
  			m3: [
  				'2rem',
  				'120%'
  			],
  			m4: [
  				'1.5rem',
  				'130%'
  			],
  			m5: [
  				'1.25rem',
  				'140%'
  			],
  			m6: [
  				'1.125rem',
  				'140%'
  			]
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-inter)'
  			],
  			serif: [
  				'var(--font-aldrich)'
  			]
  		},
  		colors: {
  			anakiwa: {
  				lightest: '#f5f8ff',
  				lighter: '#ebf1ff',
  				light: '#b9ceff',
  				DEFAULT: '#9bb9ff',
  				dark: '#7c94cc',
  				darker: '#3e4a66',
  				darkest: '#2e374c'
  			},
  			carnation: {
  				lightest: '#fef5fa',
  				lighter: '#feecf5',
  				light: '#febedc',
  				DEFAULT: '#fea3cd',
  				dark: '#cb82a4',
  				darker: '#654152',
  				darkest: '#4c303d'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
