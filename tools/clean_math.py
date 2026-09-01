with open('js/portfolioData.js', 'r', encoding='utf-8') as f:
    text = f.read()

replacements = [
    (r'\nabla \times \mathbf{u}', '∇ × u'),
    (r'\\nabla \\times \\mathbf{u}', '∇ × u'),
    ('$C_L, C_D, L/D$', 'C_L, C_D, L/D'),
    ('($C_L, C_D, L/D$)', '(C_L, C_D, L/D)'),
    ('($C_L$)', '(C_L)'),
    ('($C_D$)', '(C_D)'),
    ('($L/D$)', '(L/D)'),
    (r'$f_0 \dots f_8$', 'f₀ … f₈'),
    (r'$f_i^{eq}$', 'f_i^eq'),
    (r'$\tau$', 'τ'),
    (r'$(1/\tau)$', '(1/τ)'),
    (r'($1/\tau$)', '(1/τ)'),
    (r'($1/\\tau$)', '(1/τ)'),
    (r'$d^3x/dt^3$', 'd³x/dt³'),
    (r'($d^3x/dt^3$)', '(d³x/dt³)'),
    (r'$(x, y, \theta)$', '(x, y, θ)'),
    (r'$(x, y, \\theta)$', '(x, y, θ)'),
    (r'\\alpha', 'α'),
    (r'\alpha', 'α'),
    (r'$\alpha$', 'α'),
    (r'$\rho$', 'ρ'),
    (r'$q$', 'q'),
    ('RGB ->', 'RGB →')
]

for old, new in replacements:
    text = text.replace(old, new)

with open('js/portfolioData.js', 'w', encoding='utf-8') as f:
    f.write(text)

with open('src/core/portfolioData.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('Cleaned mathematical notation across portfolioData.js')
