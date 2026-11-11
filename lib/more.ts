// Built-in content for games, glossary, syllabus and fun extras. No AI needed, so it works offline.

export const QUOTES: [string, string][] = [
  ['It always seems impossible until it is done.', 'Nelson Mandela'],
  ['The expert in anything was once a beginner.', 'Helen Hayes'],
  ['Small steps every day beat big plans never started.', 'Wise Owl'],
  ['You do not have to be perfect. You have to be consistent.', 'Wise Owl'],
  ['Education is the passport to the future.', 'Malcolm X'],
  ['Push yourself, because no one else is going to do it for you.', 'Unknown'],
  ['Mistakes are proof that you are trying.', 'Unknown'],
  ['Dream big. Study hard. Stay kind.', 'Wise Owl'],
  ['Success is the sum of small efforts repeated daily.', 'R. Collier'],
  ['The best time to revise was yesterday. The next best time is now.', 'Wise Owl'],
  ['Believe you can and you are halfway there.', 'T. Roosevelt'],
  ['Hard work beats talent when talent does not work hard.', 'Tim Notke'],
]

export const FACTS = [
  'Honey never spoils. Edible honey has been found in ancient Egyptian tombs.',
  'A day on Venus is longer than a year on Venus.',
  'Your brain uses about 20% of your body’s energy.',
  'Octopuses have three hearts and blue blood.',
  'Light from the Sun takes about 8 minutes to reach Earth.',
  'Zimbabwe’s Victoria Falls is called “The Smoke That Thunders”.',
  'There are more possible chess games than atoms in the observable universe.',
  'Bananas are slightly radioactive because of potassium-40.',
  'The first computer programmer was Ada Lovelace, in the 1840s.',
  'A teaspoon of a neutron star would weigh about a billion tonnes.',
  'Sleep helps your brain store what you studied today.',
  'Great Zimbabwe was a major trading city over 800 years ago.',
]

export type MCQ = { q: string; o: string[]; a: number; s: string }
// s = subject key ('*' = any subject)
export const BANK: MCQ[] = [
  { s: 'Mathematics', q: 'What is the gradient of y = 3x + 5?', o: ['5', '3', '8', '1/3'], a: 1 },
  { s: 'Mathematics', q: 'Solve: 2x − 7 = 11', o: ['x = 2', 'x = 9', 'x = 4', 'x = 18'], a: 1 },
  { s: 'Mathematics', q: 'What is 15% of 240?', o: ['24', '30', '36', '40'], a: 2 },
  { s: 'Mathematics', q: 'The sum of angles in a triangle is…', o: ['90°', '180°', '270°', '360°'], a: 1 },
  { s: 'Mathematics', q: 'What is the value of 2³ × 2²?', o: ['2⁵', '2⁶', '4⁵', '2¹'], a: 0 },
  { s: 'Mathematics', q: 'The area of a circle with radius r is…', o: ['2πr', 'πr²', 'πd²', '2πr²'], a: 1 },
  { s: 'Biology', q: 'Which organelle releases energy in respiration?', o: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Vacuole'], a: 2 },
  { s: 'Biology', q: 'Osmosis is the movement of…', o: ['Solute down a gradient', 'Water across a partially permeable membrane', 'Gas by diffusion', 'Enzymes into cells'], a: 1 },
  { s: 'Biology', q: 'Which gas do plants take in for photosynthesis?', o: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], a: 2 },
  { s: 'Biology', q: 'What do enzymes do?', o: ['Store energy', 'Speed up reactions', 'Carry oxygen', 'Fight disease'], a: 1 },
  { s: 'Biology', q: 'Which blood cells fight infection?', o: ['Red cells', 'Platelets', 'White cells', 'Plasma'], a: 2 },
  { s: 'Biology', q: 'DNA is found mainly in the…', o: ['Cell wall', 'Nucleus', 'Cytoplasm', 'Membrane'], a: 1 },
  { s: 'Chemistry', q: 'What is the pH of a neutral solution?', o: ['0', '7', '10', '14'], a: 1 },
  { s: 'Chemistry', q: 'The chemical formula of water is…', o: ['CO₂', 'H₂O', 'O₂', 'NaCl'], a: 1 },
  { s: 'Chemistry', q: 'Group 1 metals are called…', o: ['Halogens', 'Noble gases', 'Alkali metals', 'Transition metals'], a: 2 },
  { s: 'Chemistry', q: 'Which particle has a negative charge?', o: ['Proton', 'Neutron', 'Electron', 'Nucleus'], a: 2 },
  { s: 'Chemistry', q: 'A catalyst…', o: ['Is used up in the reaction', 'Speeds up a reaction without being used up', 'Slows a reaction', 'Changes the products'], a: 1 },
  { s: 'Chemistry', q: 'Which is a noble gas?', o: ['Oxygen', 'Chlorine', 'Argon', 'Nitrogen'], a: 2 },
  { s: 'Physics', q: 'The unit of force is the…', o: ['Joule', 'Newton', 'Watt', 'Pascal'], a: 1 },
  { s: 'Physics', q: 'Speed = ?', o: ['distance × time', 'distance ÷ time', 'time ÷ distance', 'mass × g'], a: 1 },
  { s: 'Physics', q: 'Which wave type needs a medium?', o: ['Light', 'Radio', 'Sound', 'X-rays'], a: 2 },
  { s: 'Physics', q: 'Voltage is measured in…', o: ['Amps', 'Ohms', 'Volts', 'Watts'], a: 2 },
  { s: 'Physics', q: 'Which energy store does a stretched spring have?', o: ['Thermal', 'Elastic', 'Nuclear', 'Chemical'], a: 1 },
  { s: 'Physics', q: 'The speed of light is about…', o: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '340 m/s', '3000 km/s'], a: 0 },
  { s: 'Computer Science', q: 'Binary 101 equals…', o: ['3', '4', '5', '6'], a: 2 },
  { s: 'Computer Science', q: 'Which is a loop structure?', o: ['IF', 'WHILE', 'CASE', 'INPUT'], a: 1 },
  { s: 'Computer Science', q: 'RAM is…', o: ['Permanent storage', 'Volatile memory', 'A processor', 'An input device'], a: 1 },
  { s: 'Computer Science', q: 'HTTP is a…', o: ['Language', 'Protocol', 'Browser', 'Compiler'], a: 1 },
  { s: 'Computer Science', q: 'An algorithm is…', o: ['A virus', 'A set of steps to solve a problem', 'A device', 'A file type'], a: 1 },
  { s: 'Computer Science', q: 'Which is an example of an output device?', o: ['Mouse', 'Keyboard', 'Monitor', 'Scanner'], a: 2 },
  { s: 'Business Studies', q: 'Profit = ?', o: ['Revenue − costs', 'Revenue + costs', 'Costs − revenue', 'Revenue ÷ costs'], a: 0 },
  { s: 'Business Studies', q: 'A sole trader has…', o: ['Limited liability', 'Unlimited liability', 'Many shareholders', 'No owner'], a: 1 },
  { s: 'Business Studies', q: 'Which is a fixed cost?', o: ['Raw materials', 'Rent', 'Sales commission', 'Packaging'], a: 1 },
  { s: 'Business Studies', q: 'Market research helps a firm to…', o: ['Reduce tax', 'Understand customers', 'Print money', 'Hire staff'], a: 1 },
  { s: 'Economics', q: 'Scarcity means…', o: ['Unlimited wants and limited resources', 'Too many goods', 'Low prices', 'High wages'], a: 0 },
  { s: 'Economics', q: 'If demand rises and supply is fixed, price will…', o: ['Fall', 'Rise', 'Stay the same', 'Reach zero'], a: 1 },
  { s: 'Economics', q: 'Inflation is a rise in the…', o: ['General price level', 'Unemployment rate', 'Exchange rate only', 'Tax rate'], a: 0 },
  { s: 'Geography', q: 'Which layer of Earth is liquid?', o: ['Crust', 'Outer core', 'Inner core', 'Lithosphere'], a: 1 },
  { s: 'Geography', q: 'A river’s mouth is where it…', o: ['Begins', 'Meets the sea', 'Is widest in the mountains', 'Dries up'], a: 1 },
  { s: 'Geography', q: 'Which is a renewable resource?', o: ['Coal', 'Oil', 'Solar', 'Natural gas'], a: 2 },
  { s: 'History', q: 'The Berlin Wall fell in…', o: ['1961', '1975', '1989', '2001'], a: 2 },
  { s: 'History', q: 'World War I began in…', o: ['1904', '1914', '1929', '1939'], a: 1 },
  { s: 'History', q: 'A primary source is…', o: ['A textbook summary', 'Evidence from the time', 'A modern opinion', 'A film about it'], a: 1 },
  { s: 'English Language', q: 'A simile compares using…', o: ['Is', 'Like or as', 'Never', 'Because'], a: 1 },
  { s: 'English Language', q: '“Her smile was sunshine” is a…', o: ['Simile', 'Metaphor', 'Alliteration', 'Idiom'], a: 1 },
  { s: 'English Language', q: 'Which is a noun?', o: ['Quickly', 'Beautiful', 'Courage', 'Run'], a: 2 },
  { s: 'Accounting', q: 'Assets = ?', o: ['Liabilities + equity', 'Income − expenses', 'Cash only', 'Liabilities − equity'], a: 0 },
  { s: 'Accounting', q: 'Which is a current asset?', o: ['Building', 'Inventory', 'Loan', 'Capital'], a: 1 },
  { s: 'Accounting', q: 'A debit entry in the cash account means…', o: ['Money out', 'Money in', 'A loan', 'Tax'], a: 1 },
  { s: '*', q: 'Which study method is proven to work best?', o: ['Rereading only', 'Testing yourself', 'Highlighting', 'Cramming'], a: 1 },
  { s: '*', q: 'How long is a classic focus sprint?', o: ['5 minutes', '25 minutes', '3 hours', '10 seconds'], a: 1 },
  { s: '*', q: 'Spaced repetition means…', o: ['Reviewing at growing gaps', 'Studying once', 'Studying all night', 'Skipping topics'], a: 0 },
  { s: '*', q: 'A command word like “Explain” asks you to…', o: ['List only', 'Give reasons', 'Draw', 'Calculate'], a: 1 },
  { s: '*', q: 'Best time to review new notes?', o: ['Within 24 hours', 'After a month', 'Never', 'Only before exams'], a: 0 },
  { s: '*', q: 'Which helps memory most?', o: ['Sleep', 'Energy drinks', 'Skipping meals', 'Noise'], a: 0 },
].map(x => ({ ...x, s: x.s }))

export const TF: [string, boolean][] = [
  ['A triangle can have two right angles.', false], ['Water boils at 100°C at sea level.', true], ['Plants release oxygen in photosynthesis.', true],
  ['Sound travels faster than light.', false], ['The Sun is a star.', true], ['Humans have 3 lungs.', false], ['Zero is an even number.', true],
  ['Metals are generally poor conductors of electricity.', false], ['The heart pumps blood around the body.', true], ['Binary uses digits 0 to 9.', false],
  ['A prime number has exactly two factors.', true], ['Mitochondria carry out photosynthesis.', false], ['Africa is the second largest continent.', true],
  ['Supply and demand set prices in a free market.', true], ['An atom’s nucleus contains electrons.', false], ['The Earth orbits the Sun.', true],
  ['2 + 2 × 3 equals 12.', false], ['Alkalis have a pH above 7.', true], ['Evaporation needs the liquid to reach 100°C.', false], ['A square is a type of rectangle.', true],
]

export const TERMS: Record<string, [string, string][]> = {
  'Mathematics': [['ALGEBRA', 'Using letters to stand for numbers'], ['GRADIENT', 'How steep a line is'], ['PERIMETER', 'Distance around a shape'], ['HYPOTENUSE', 'Longest side of a right triangle'], ['FACTOR', 'A number that divides exactly into another'], ['MEDIAN', 'The middle value in ordered data'], ['EQUATION', 'A statement that two things are equal']],
  'Biology': [['PHOTOSYNTHESIS', 'Plants make glucose using light'], ['MITOCHONDRIA', 'Release energy in respiration'], ['ENZYME', 'A biological catalyst'], ['OSMOSIS', 'Water moving through a membrane'], ['CHLOROPHYLL', 'Green pigment that absorbs light'], ['HABITAT', 'Where an organism lives'], ['ECOSYSTEM', 'Living things and their environment']],
  'Chemistry': [['ELEMENT', 'One type of atom only'], ['COMPOUND', 'Two or more elements bonded'], ['CATALYST', 'Speeds up a reaction'], ['ELECTRON', 'Negative particle in an atom'], ['ISOTOPE', 'Same protons, different neutrons'], ['OXIDATION', 'Loss of electrons'], ['MOLECULE', 'Atoms joined by covalent bonds']],
  'Physics': [['VELOCITY', 'Speed in a given direction'], ['MOMENTUM', 'Mass times velocity'], ['CURRENT', 'Flow of electric charge'], ['FREQUENCY', 'Waves per second'], ['GRAVITY', 'Force pulling masses together'], ['RESISTANCE', 'Opposition to current'], ['REFRACTION', 'Bending of light at a boundary']],
  'English Language': [['METAPHOR', 'Saying one thing is another'], ['SIMILE', 'Comparison using like or as'], ['TONE', 'The writer’s attitude'], ['INFERENCE', 'A conclusion from clues'], ['IMAGERY', 'Words that paint a picture'], ['ALLITERATION', 'Repeated starting sounds'], ['PERSUASION', 'Writing to convince']],
  'Computer Science': [['ALGORITHM', 'Steps to solve a problem'], ['VARIABLE', 'A named store for data'], ['LOOP', 'Repeats instructions'], ['BINARY', 'Base 2 number system'], ['COMPILER', 'Translates all code at once'], ['DATABASE', 'Organised collection of data'], ['PROTOCOL', 'Rules for communication']],
  'Business Studies': [['PROFIT', 'Revenue minus costs'], ['REVENUE', 'Money from sales'], ['ENTERPRISE', 'A business venture'], ['STAKEHOLDER', 'Anyone affected by a business'], ['COMPETITOR', 'A rival business'], ['MARKETING', 'Promoting and selling products'], ['CAPITAL', 'Money invested in a business']],
  'Geography': [['EROSION', 'Wearing away of land'], ['MIGRATION', 'Movement of people'], ['TECTONIC', 'Relating to Earth’s plates'], ['CLIMATE', 'Average weather over time'], ['URBAN', 'Relating to towns and cities'], ['DELTA', 'Landform at a river mouth'], ['POPULATION', 'People living in an area']],
  'History': [['EMPIRE', 'Many lands under one ruler'], ['TREATY', 'A formal peace agreement'], ['REVOLUTION', 'A big sudden change'], ['COLONY', 'Land ruled by another country'], ['PROPAGANDA', 'Biased persuasive information'], ['ALLIANCE', 'Agreement between countries'], ['DEMOCRACY', 'Rule by the people']],
  'Economics': [['SCARCITY', 'Limited resources, unlimited wants'], ['INFLATION', 'Rising price levels'], ['DEMAND', 'Willingness to buy'], ['SUPPLY', 'Amount producers offer'], ['TRADE', 'Exchange of goods and services'], ['BUDGET', 'A plan for income and spending'], ['PRODUCTIVITY', 'Output per worker']],
  'Accounting': [['ASSET', 'Something the business owns'], ['LIABILITY', 'Something the business owes'], ['LEDGER', 'Book of accounts'], ['DEBIT', 'Left side entry'], ['CREDIT', 'Right side entry'], ['INVENTORY', 'Stock held for sale'], ['EQUITY', 'Owner’s stake']],
}

export const SYLLABUS: Record<string, string[]> = {
  'Mathematics': ['Number & fractions', 'Algebra & equations', 'Sequences', 'Graphs', 'Geometry & shapes', 'Trigonometry', 'Statistics', 'Probability'],
  'Biology': ['Cells', 'Enzymes', 'Nutrition', 'Transport', 'Respiration', 'Coordination', 'Reproduction', 'Ecology'],
  'Chemistry': ['Atoms & bonding', 'Periodic table', 'Reactions & rates', 'Acids & bases', 'Electrochemistry', 'Organic chemistry', 'Metals', 'The mole'],
  'Physics': ['Motion', 'Forces', 'Energy', 'Thermal physics', 'Waves & light', 'Electricity', 'Magnetism', 'Atomic physics'],
  'English Language': ['Reading comprehension', 'Summary writing', 'Descriptive writing', 'Narrative writing', 'Argument writing', 'Vocabulary', 'Grammar', 'Speaking'],
  'Computer Science': ['Data representation', 'Hardware', 'Software', 'Networks', 'Security', 'Algorithms', 'Programming', 'Databases'],
  'Business Studies': ['Business activity', 'Types of business', 'Marketing', 'Operations', 'Finance', 'People in business', 'External influences', 'Growth'],
  'Geography': ['Rivers', 'Coasts', 'Plate tectonics', 'Weather & climate', 'Population', 'Settlement', 'Economic activity', 'Environment'],
  'History': ['Causes of WWI', 'Peace treaties', 'Rise of dictators', 'WWII', 'Cold War', 'Independence movements', 'Source skills', 'Essay writing'],
  'Economics': ['Basic problem', 'Demand & supply', 'Money & banking', 'Government', 'Labour', 'Trade', 'Development', 'Inflation'],
  'Literature (English)': ['Poetry: language and imagery', 'Poetry: structure and form', 'Prose: character', 'Prose: theme and setting', 'Drama: character and conflict', 'Drama: staging and audience', 'Using quotations', 'Writer’s purpose and effect', 'Unseen text analysis', 'Essay planning'],
  'Design and Technology': ['Design briefs and specifications', 'Research and user needs', 'Sketching and modelling', 'Materials and their properties', 'Tools, equipment and processes', 'Manufacturing methods', 'Mechanisms and systems', 'Sustainability and the environment', 'Testing and evaluating', 'Health and safety'],
  'Fashion and Textiles': ['Fibres and fabrics', 'Fabric properties and care', 'Pattern making and body measurements', 'Garment construction', 'Seams, hems and finishes', 'Colour, print and decoration', 'Fashion design and trends', 'Sustainable fashion', 'Sewing machine and equipment', 'Evaluating a finished garment'],
  'CAD (Computer-Aided Design)': ['What CAD is and why it is used', '2D drawing tools', '3D modelling: extrude and revolve', 'Fillets, chamfers and holes', 'Dimensions and constraints', 'Orthographic and isometric views', 'Assemblies and exploded views', 'Rendering and materials', 'CAD and CAM (laser cutting and 3D printing)', 'File formats and sharing'],
  'Technical Graphics': ['Line types and lettering', 'Orthographic projection', 'Isometric drawing', 'Sectional views', 'Dimensioning', 'Development of surfaces', 'Perspective', 'Assembly drawings'],
  'Art and Design': ['Research and artists', 'Drawing and observation', 'Colour and tone', 'Composition', 'Experimenting with media', 'Developing ideas', 'Annotation', 'Final piece and evaluation'],
  'Food and Nutrition': ['Nutrients and their functions', 'Healthy eating guidelines', 'Dietary needs through life', 'Food science', 'Food safety and hygiene', 'Cooking methods', 'Planning meals', 'Food provenance and sustainability'],
  'Information and Communication Technology': ['Hardware and software', 'Networks and the internet', 'Spreadsheets', 'Databases', 'Document production', 'Presentations and websites', 'Safety and security', 'Effects of ICT'],
  'Accounting': ['Double entry', 'Ledgers', 'Trial balance', 'Income statement', 'Balance sheet', 'Bank reconciliation', 'Depreciation', 'Ratios'],
}

export const ELEMENTS: [number, string, string, number, string][] = [
  [1, 'H', 'Hydrogen', 1, 'Lightest element. Fuels stars.'], [2, 'He', 'Helium', 4, 'Noble gas. Fills balloons.'],
  [3, 'Li', 'Lithium', 7, 'Alkali metal used in batteries.'], [4, 'Be', 'Beryllium', 9, 'Light, strong metal.'],
  [5, 'B', 'Boron', 11, 'Used in glass and detergents.'], [6, 'C', 'Carbon', 12, 'Basis of all organic life.'],
  [7, 'N', 'Nitrogen', 14, '78% of the air.'], [8, 'O', 'Oxygen', 16, 'Needed for respiration and burning.'],
  [9, 'F', 'Fluorine', 19, 'Most reactive halogen.'], [10, 'Ne', 'Neon', 20, 'Noble gas in bright signs.'],
  [11, 'Na', 'Sodium', 23, 'Reactive alkali metal. Salt contains it.'], [12, 'Mg', 'Magnesium', 24, 'Burns with a bright white flame.'],
  [13, 'Al', 'Aluminium', 27, 'Light metal used in cans and planes.'], [14, 'Si', 'Silicon', 28, 'Used in computer chips.'],
  [15, 'P', 'Phosphorus', 31, 'Used in fertilisers and matches.'], [16, 'S', 'Sulfur', 32, 'Yellow solid used to make acid.'],
  [17, 'Cl', 'Chlorine', 35.5, 'Halogen used to clean water.'], [18, 'Ar', 'Argon', 40, 'Noble gas in light bulbs.'],
  [19, 'K', 'Potassium', 39, 'Reactive alkali metal.'], [20, 'Ca', 'Calcium', 40, 'Builds bones and teeth.'],
  [21, 'Sc', 'Scandium', 45, 'Transition metal in sports gear.'], [22, 'Ti', 'Titanium', 48, 'Strong, light, corrosion resistant.'],
  [23, 'V', 'Vanadium', 51, 'Used in strong steel.'], [24, 'Cr', 'Chromium', 52, 'Shiny plating for metal.'],
  [25, 'Mn', 'Manganese', 55, 'Used in steel and batteries.'], [26, 'Fe', 'Iron', 56, 'Used to make steel. Rusts.'],
  [27, 'Co', 'Cobalt', 59, 'Gives blue colour to glass.'], [28, 'Ni', 'Nickel', 59, 'Used in coins and alloys.'],
  [29, 'Cu', 'Copper', 63.5, 'Conducts electricity well.'], [30, 'Zn', 'Zinc', 65, 'Used to galvanise iron.'],
  [31, 'Ga', 'Gallium', 70, 'Melts in your hand.'], [32, 'Ge', 'Germanium', 73, 'A semiconductor.'],
  [33, 'As', 'Arsenic', 75, 'A poisonous metalloid.'], [34, 'Se', 'Selenium', 79, 'Used in solar cells.'],
  [35, 'Br', 'Bromine', 80, 'A liquid halogen.'], [36, 'Kr', 'Krypton', 84, 'Noble gas.'],
]

// Unit conversions: factor to the base unit of each group.
export const UNITS: Record<string, Record<string, number>> = {
  Length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254, foot: 0.3048, mile: 1609.344 },
  Mass: { mg: 0.000001, g: 0.001, kg: 1, tonne: 1000, ounce: 0.0283495, pound: 0.453592 },
  Time: { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800 },
  Volume: { ml: 0.001, litre: 1, 'cm³': 0.001, 'm³': 1000 },
}

export const GRADES: [string, number][] = [['A*', 90], ['A', 80], ['B', 70], ['C', 60], ['D', 50], ['E', 40], ['F', 30], ['G', 20]]

export const SLOT_ICONS = ['📚', '🧪', '🔭', '🧮', '🌍', '💻', '🏛️', '✍️']
export const MOODS: [string, string][] = [['😄', 'Great'], ['🙂', 'Good'], ['😐', 'Okay'], ['😟', 'Stressed'], ['😴', 'Tired']]
export const SHOP: { id: string; e: string; name: string; desc: string; cost: number }[] = [
  { id: 'trail-gold', e: '✨', name: 'Gold trail', desc: 'Golden sparkles follow your cursor', cost: 15 },
  { id: 'trail-rainbow', e: '🌈', name: 'Rainbow trail', desc: 'A colourful cursor trail', cost: 30 },
  { id: 'trail-hearts', e: '💖', name: 'Heart trail', desc: 'Little hearts float behind you', cost: 40 },
  { id: 'party', e: '🎉', name: 'Party mode', desc: 'Confetti when you switch tabs', cost: 60 },
  { id: 'crown', e: '👑', name: 'Gold name', desc: 'Your name shines gold in the header', cost: 80 },
]
