// Offline formula sheets (no AI needed). Names and formulas follow the standard IGCSE syllabuses.
export const FORMULAS: Record<string, { n: string; f: string }[]> = {
  'Mathematics': [
    { n: 'Area of a circle', f: 'A = πr²' }, { n: 'Circumference of a circle', f: 'C = 2πr' }, { n: 'Pythagoras’ theorem', f: 'a² + b² = c²' },
    { n: 'Quadratic formula', f: 'x = (−b ± √(b² − 4ac)) / 2a' }, { n: 'Gradient of a line', f: 'm = (y₂ − y₁) / (x₂ − x₁)' }, { n: 'Area of a trapezium', f: 'A = ½(a + b)h' },
    { n: 'Volume of a sphere', f: 'V = 4/3 πr³' }, { n: 'Volume of a cylinder', f: 'V = πr²h' }, { n: 'Sine rule', f: 'a / sin A = b / sin B' },
    { n: 'Cosine rule', f: 'a² = b² + c² − 2bc cos A' }, { n: 'Area of a triangle (sine)', f: 'A = ½ab sin C' }, { n: 'nth term of an arithmetic sequence', f: 'a + (n − 1)d' },
    { n: 'Speed', f: 'distance ÷ time' },
  ],
  'Physics': [
    { n: 'Final velocity', f: 'v = u + at' }, { n: 'Displacement', f: 's = ut + ½at²' }, { n: 'Velocity squared', f: 'v² = u² + 2as' }, { n: 'Force', f: 'F = ma' },
    { n: 'Work done', f: 'W = Fd' }, { n: 'Power', f: 'P = W / t' }, { n: 'Kinetic energy', f: 'Ek = ½mv²' }, { n: 'Gravitational potential energy', f: 'Ep = mgh' },
    { n: 'Density', f: 'ρ = m / V' }, { n: 'Pressure', f: 'p = F / A' }, { n: 'Ohm’s law', f: 'V = IR' }, { n: 'Electrical power', f: 'P = IV' },
    { n: 'Wave speed', f: 'v = fλ' }, { n: 'Momentum', f: 'p = mv' }, { n: 'Thermal energy change', f: 'Q = mcΔθ' }, { n: 'Moment of a force', f: 'moment = F × d' },
  ],
  'Chemistry': [
    { n: 'Moles from mass', f: 'moles = mass / Mr' }, { n: 'Concentration', f: 'concentration = moles / volume (dm³)' }, { n: 'Gas volume at r.t.p.', f: 'volume = moles × 24 dm³' },
    { n: 'Percentage yield', f: '(actual yield / theoretical yield) × 100' }, { n: 'Atom economy', f: '(Mr of desired product / Mr of all reactants) × 100' },
    { n: 'Relative formula mass', f: 'Mr = sum of Ar values' }, { n: 'Mass concentration', f: 'g/dm³ = mol/dm³ × Mr' },
  ],
}
