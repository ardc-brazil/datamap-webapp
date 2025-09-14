/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		fontFamily: {
			sans: [
				'Inter',
				'system-ui',
				'sans-serif'
			],
			display: [
				'Inter',
				'system-ui',
				'sans-serif'
			],
			body: [
				'Inter',
				'system-ui',
				'sans-serif'
			]
		},
		colors: {
			// See the primary pallet colors: https://coolors.co/gradient-palette/f9fafb-111827?number=10
			transparent: 'transparent',
			primary: {
				'0': "#ffffff",
				'50': '#f9fafb',
				'100': '#f3f4f6',
				'200': '#e5e7eb',
				'300': '#d1d5db',
				'400': '#9ca3af',
				'500': '#6b7280',
				'600': '#4b5563',
				'700': '#374151',
				'800': '#1f2937',
				'900': '#111827'
			},
			secondary: {
				'50': '#FBFCFC',
				'100': '#FBFCFC',
				'200': '#F6F9F9',
				'300': '#F2F6F6',
				'400': '#EDF3F3',
				'500': '#E9F0EF',
				'600': '#E4EDEC',
				'700': '#E0EAE9',
				'800': '#DBE7E6',
				'900': '#D7E4E3'
			},
			error: {
				'50': '#FFADADff',
				'100': '#FF9A9Aff',
				'200': '#FF8787ff',
				'300': '#FF7373ff',
				'400': '#FF6060ff',
				'500': '#FF4D4Dff',
				'600': '#FF3A3Aff',
				'700': '#FF2626ff',
				'800': '#FF1313ff',
				'900': '#FF0000ff'
			},
			success: {
				'50': '#228b5a',
				'100': '#228b5a',
				'200': '#228b5a',
				'300': '#228b5a',
				'400': '#228b5a',
				'500': '#228b5a',
				'600': '#228b5a',
				'700': '#228b5a',
				'800': '#228b5a',
				'900': '#228b5a'
			}
		},
		extend: {
			typography: (theme) => ({
				DEFAULT: {
					css: {
						color: theme("colors.gray.800"),
						h1: {
							color: theme("colors.primary.600"),
							fontWeight: "500",
							fontSize: 10
						},
						h2: {
							color: theme("colors.primary.600"),
						},
						h3: {
							color: theme("colors.primary.600"),
						},
						a: {
							color: theme("colors.primary.500"),
							fontWeight: "600",
							textDecoration: "underline",
						},
					},
				},
			}),
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			colors: {
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
				}
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
	plugins: [
		require("@tailwindcss/forms")({
			strategy: "class", // only generate classes
		}),
		require("@tailwindcss/typography"),
		require("tailwindcss-animate")
	],
};
