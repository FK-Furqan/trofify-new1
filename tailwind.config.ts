import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		screens: {
			'xs': '475px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
		},
		extend: {
			// Trofify-style font families
			fontFamily: {
				'trofify': [
					'-apple-system',
					'BlinkMacSystemFont',
					'"Segoe UI"',
					'Roboto',
					'Helvetica',
					'Arial',
					'sans-serif'
				],
				'trofify-display': [
					'-apple-system',
					'BlinkMacSystemFont',
					'"SF Pro Display"',
					'"Segoe UI"',
					'Roboto',
					'Helvetica',
					'Arial',
					'sans-serif'
				],
				'trofify-text': [
					'-apple-system',
					'BlinkMacSystemFont',
					'"SF Pro Text"',
					'"Segoe UI"',
					'Roboto',
					'Helvetica',
					'Arial',
					'sans-serif'
				]
			},
			// Trofify-style font sizes
			fontSize: {
				// Profile name (bolded display name)
				'trofify-profile': ['18px', { lineHeight: '22px', letterSpacing: '0.2px', fontWeight: '600' }],
				// Username/subtitle
				'trofify-username': ['14px', { lineHeight: '18px', letterSpacing: '0.2px', fontWeight: '400' }],
				// Post caption text
				'trofify-caption': ['14px', { lineHeight: '18px', letterSpacing: '0.2px', fontWeight: '400' }],
				// Time of post
				'trofify-time': ['12px', { lineHeight: '16px', letterSpacing: '0.2px', fontWeight: '400' }],
				// Number of likes/comments
				'trofify-stats': ['14px', { lineHeight: '18px', letterSpacing: '0.2px', fontWeight: '600' }],
				// Comments
				'trofify-comment': ['14px', { lineHeight: '18px', letterSpacing: '0.2px', fontWeight: '400' }],
				// Placeholder/input fields
				'trofify-input': ['14px', { lineHeight: '18px', letterSpacing: '0.2px', fontWeight: '400' }],
				// Button texts
				'trofify-button': ['14px', { lineHeight: '18px', letterSpacing: '0.2px', fontWeight: '600' }],
				// Message sender/receiver
				'trofify-message': ['14px', { lineHeight: '18px', letterSpacing: '0.2px', fontWeight: '400' }],
				// Message timestamp
				'trofify-message-time': ['11px', { lineHeight: '14px', letterSpacing: '0.2px', fontWeight: '400' }],
				// Typing indicator
				'trofify-typing': ['14px', { lineHeight: '18px', letterSpacing: '0.2px', fontWeight: '400' }],
				// Navigation items
				'trofify-nav': ['12px', { lineHeight: '16px', letterSpacing: '0.2px', fontWeight: '400' }],
				// Section headers
				'trofify-header': ['16px', { lineHeight: '20px', letterSpacing: '0.2px', fontWeight: '600' }],
				// Large titles
				'trofify-title': ['22px', { lineHeight: '26px', letterSpacing: '0.2px', fontWeight: '600' }],
				// Small labels
				'trofify-label': ['12px', { lineHeight: '16px', letterSpacing: '0.2px', fontWeight: '400' }],
			},
			// Trofify-style font weights
			fontWeight: {
				'trofify-light': '300',
				'trofify-regular': '400',
				'trofify-medium': '500',
				'trofify-semibold': '600',
				'trofify-bold': '700',
			},
			// Trofify-style line heights
			lineHeight: {
				'trofify-tight': '1.125', // 18px for 16px font
				'trofify-normal': '1.25', // 20px for 16px font
				'trofify-relaxed': '1.375', // 22px for 16px font
			},
			// Trofify-style letter spacing
			letterSpacing: {
				'trofify-tight': '-0.2px',
				'trofify-normal': '0px',
				'trofify-wide': '0.2px',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
