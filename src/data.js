export const STATUS = {
  covered: { label: 'Confident (your rating)', icon: '●', cls: 'bg-green-50 text-status-covered', badge: 'bg-green-50 text-status-covered border-emerald-200', dot: 'text-status-covered', dotDark: 'text-status-covered' },
  partial: { label: 'Okay (your rating)', icon: '◐', cls: 'bg-amber-50 text-status-partial', badge: 'bg-amber-50 text-status-partial border-amber-200', dot: 'text-status-partial', dotDark: 'text-status-partial' },
  missing: { label: 'Not rated', icon: '○', cls: 'bg-slate-100 text-status-missing', badge: 'bg-slate-100 text-status-missing border-slate-300', dot: 'text-status-missing', dotDark: 'text-status-missing' },
  review: { label: 'Shaky (your rating)', icon: '⚑', cls: 'bg-violet-50 text-status-review', badge: 'bg-violet-50 text-status-review border-violet-200', dot: 'text-status-review', dotDark: 'text-status-review' },
}

const t = (id, title, status, missing = []) => ({ id, title, status, missing })

const OS = {
  id: 'os', title: 'Operating Systems', modules: [
    { id: 'os-m2', title: 'Module 2: Process scheduling', topics: [
      t('os-sched', 'CPU scheduling', 'covered'),
    ]},
    { id: 'os-m3', title: 'Module 3: Memory management', topics: [
      t('os-paging', 'Paging', 'covered'),
      t('os-seg', 'Segmentation', 'partial', ['Segment tables', 'Protection bits']),
      t('os-vm', 'Virtual memory', 'missing', ['All subtopics']),
    ]},
    { id: 'os-m4', title: 'Module 4: File systems', topics: [
      t('os-fs', 'File allocation', 'review', ['Scan was unreadable']),
    ]},
  ],
}
const DBMS = {
  id: 'dbms', title: 'Database Management Systems', modules: [
    { id: 'db-m1', title: 'Module 1: Relational model', topics: [
      t('db-joins', 'SQL joins', 'covered'),
      t('db-norm', 'Normalization', 'partial', ['BCNF']),
    ]},
    { id: 'db-m2', title: 'Module 2: Transactions', topics: [
      t('db-acid', 'ACID and concurrency', 'missing', ['All subtopics']),
    ]},
  ],
}
const DS = {
  id: 'ds', title: 'Data Structures', modules: [
    { id: 'ds-m1', title: 'Module 1: Linear structures', topics: [
      t('ds-ll', 'Linked lists', 'covered'),
      t('ds-stack', 'Stacks and queues', 'covered'),
    ]},
    { id: 'ds-m2', title: 'Module 2: Trees', topics: [
      t('ds-bst', 'Binary search trees', 'partial', ['Deletion']),
    ]},
  ],
}

const ktuCourse = (id, title, modules) => ({ id, title, modules })
// KTU 2024 scheme preview. Module titles/topics are based on the CSE syllabus;
// keep the scheme and source visible because KTU may publish revisions.
const KTU_DSA = ktuCourse('ktu-dsa', 'Data Structures and Algorithms (PCCST303)', [
  { id: 'ktu-dsa-m1', title: 'Module 1: Data structure basics, stacks and queues', topics: [
    t('ktu-dsa-linear', 'Stacks, queues and expression evaluation', 'missing'),
    t('ktu-dsa-complexity', 'Time/space complexity and asymptotic notation', 'missing'),
    t('ktu-dsa-sparse', 'Arrays, polynomial representation and sparse matrices', 'missing'),
  ]},
  { id: 'ktu-dsa-m2', title: 'Module 2: Linked lists and memory management', topics: [
    t('ktu-dsa-linked', 'Linked lists', 'missing'), t('ktu-dsa-memory', 'Memory allocation, garbage collection and compaction', 'missing'),
  ]},
  { id: 'ktu-dsa-m3', title: 'Module 3: Trees and graphs', topics: [
    t('ktu-dsa-trees', 'Trees, traversals and binary search trees', 'missing'), t('ktu-dsa-heap', 'Heaps and priority queues', 'missing'), t('ktu-dsa-graphs', 'Graph representation, DFS and BFS', 'missing'),
  ]},
  { id: 'ktu-dsa-m4', title: 'Module 4: Sorting and searching', topics: [
    t('ktu-dsa-sorting', 'Sorting algorithms', 'missing'), t('ktu-dsa-search', 'Searching, hashing and collision handling', 'missing'),
  ]},
])
const KTU_MATH3 = ktuCourse('ktu-math3', 'Mathematics for Information Science-3 (GAMAT301)', [
  { id: 'ktu-math3-m1', title: 'Module 1: Discrete random variables', topics: ['Probability distributions, expectation, mean and variance', 'Binomial and Poisson distributions', 'Joint, marginal and independent discrete variables'].map((x,i)=>t(`ktu-math3-1-${i}`,x,'missing')) },
  { id: 'ktu-math3-m2', title: 'Module 2: Continuous random variables', topics: ['Probability density and cumulative distribution functions', 'Uniform, normal and exponential distributions', 'Joint and marginal densities; independence'].map((x,i)=>t(`ktu-math3-2-${i}`,x,'missing')) },
  { id: 'ktu-math3-m3', title: 'Module 3: Limit theorems and stochastic processes', topics: ['Markov and Chebyshev inequalities; law of large numbers', 'Central limit theorem', 'Poisson process and interarrival times'].map((x,i)=>t(`ktu-math3-3-${i}`,x,'missing')) },
  { id: 'ktu-math3-m4', title: 'Module 4: Markov chains', topics: ['Transition probabilities and Chapman–Kolmogorov equations', 'State classification and irreducibility', 'Transient/recurrent states and long-run proportions'].map((x,i)=>t(`ktu-math3-4-${i}`,x,'missing')) },
])
const KTU_TOC = ktuCourse('ktu-toc', 'Theory of Computation (PCCST302)', [
  { id: 'ktu-toc-m1', title: 'Module 1: Automata and finite automata', topics: ['Alphabets, strings, languages and automata', 'DFA, NFA, ε-transitions and subset construction', 'DFA minimization and finite-automata applications'].map((x,i)=>t(`ktu-toc-1-${i}`,x,'missing')) },
  { id: 'ktu-toc-m2', title: 'Module 2: Regular expressions and languages', topics: ['Regular expressions, regular grammars and conversions', 'Closure and decision properties', 'Pumping lemma and non-regular languages'].map((x,i)=>t(`ktu-toc-2-${i}`,x,'missing')) },
  { id: 'ktu-toc-m3', title: 'Module 3: CFGs and pushdown automata', topics: ['CFG derivations, parse trees and ambiguity', 'PDA and CFG equivalence', 'Grammar simplification and normal forms'].map((x,i)=>t(`ktu-toc-3-${i}`,x,'missing')) },
  { id: 'ktu-toc-m4', title: 'Module 4: Turing machines and computability', topics: ['Turing machines and language classes', 'Church–Turing thesis, universal machines and reductions', 'Decidability, halting problem and Post correspondence problem'].map((x,i)=>t(`ktu-toc-4-${i}`,x,'missing')) },
])
const KTU_OOP = ktuCourse('ktu-oop', 'Object Oriented Programming (PBCST304)', [
  { id: 'ktu-oop-m1', title: 'Module 1: Java introduction and fundamentals', topics: ['Java runtime, primitive/wrapper types and casting', 'Arrays, strings, operators and control statements', 'Classes, abstract classes, interfaces and command-line arguments'].map((x,i)=>t(`ktu-oop-1-${i}`,x,'missing')) },
  { id: 'ktu-oop-m2', title: 'Module 2: OOP, classes and inheritance', topics: ['Abstraction, encapsulation and procedural vs OOP', 'Constructors, access modifiers, static/final and inner classes', 'Inheritance, overriding and dynamic dispatch'].map((x,i)=>t(`ktu-oop-2-${i}`,x,'missing')) },
  { id: 'ktu-oop-m3', title: 'Module 3: Packages, interfaces and exceptions', topics: ['Packages, CLASSPATH and access protection', 'Interfaces and abstract classes', 'Exception handling, Singleton/Adapter patterns and SOLID'].map((x,i)=>t(`ktu-oop-3-${i}`,x,'missing')) },
  { id: 'ktu-oop-m4', title: 'Module 4: Swing, events and JDBC', topics: ['Swing components, containers and layouts', 'Delegation event model and listener interfaces', 'JDBC connections, SQL queries and CRUD operations'].map((x,i)=>t(`ktu-oop-4-${i}`,x,'missing')) },
])
const KTU_DIGITAL = ktuCourse('ktu-digital', 'Digital Electronics and Logic Design (GAEST305)', [
  { id: 'ktu-digital-m1', title: 'Module 1: Digital systems and Verilog basics', topics: ['Number systems, signed arithmetic and fixed/floating point', 'Logic gates, logic levels and electrical specifications', 'Verilog data types, modules and operators'].map((x,i)=>t(`ktu-digital-1-${i}`,x,'missing')) },
  { id: 'ktu-digital-m2', title: 'Module 2: Boolean algebra and combinational design', topics: ['Boolean algebra, canonical SOP/POS and minterms/maxterms', 'Algebraic and Karnaugh-map minimization', 'Verilog continuous assignment and conditional operators'].map((x,i)=>t(`ktu-digital-2-${i}`,x,'missing')) },
  { id: 'ktu-digital-m3', title: 'Module 3: MSI logic and digital building blocks', topics: ['Decoders, encoders, multiplexers and demultiplexers', 'Adders, subtractors and comparators', 'Verilog hierarchy and structural design'].map((x,i)=>t(`ktu-digital-3-${i}`,x,'missing')) },
  { id: 'ktu-digital-m4', title: 'Module 4: Sequential logic and finite-state machines', topics: ['Latches, flip-flops and timing', 'Registers, counters and shift registers', 'FSM synthesis and synchronous sequential circuits'].map((x,i)=>t(`ktu-digital-4-${i}`,x,'missing')) },
])
const KTU_DBMS = ktuCourse('ktu-dbms', 'Database Management Systems (PCCST402)', [
  { id: 'ktu-dbms-m1', title: 'Module 1: Database concepts and ER design', topics: ['DBMS architecture and data independence', 'ER model, entities, relationships and keys', 'Conceptual database design'].map((x,i)=>t(`ktu-dbms-1-${i}`,x,'missing')) },
  { id: 'ktu-dbms-m2', title: 'Module 2: Relational model and SQL', topics: ['Relational model and constraints', 'Relational algebra and calculus', 'SQL, views, triggers and ER mapping'].map((x,i)=>t(`ktu-dbms-2-${i}`,x,'missing')) },
  { id: 'ktu-dbms-m3', title: 'Module 3: Normalization and transactions', topics: ['Functional dependencies and normal forms', 'Serializability and concurrency control', 'Database recovery'].map((x,i)=>t(`ktu-dbms-3-${i}`,x,'missing')) },
  { id: 'ktu-dbms-m4', title: 'Module 4: NoSQL databases', topics: ['CAP theorem and BASE properties', 'Key-value, document, graph and column-family stores', 'NoSQL applications and limitations'].map((x,i)=>t(`ktu-dbms-4-${i}`,x,'missing')) },
])
const KTU_OS = ktuCourse('ktu-os', 'Operating Systems (PCCST403)', [
  { id: 'ktu-os-m1', title: 'Module 1: Processes, threads and scheduling', topics: [
    t('ktu-os-sched', 'Process concepts and CPU scheduling', 'missing'), t('ktu-os-threads', 'Threads and concurrency models', 'missing'),
  ]},
  { id: 'ktu-os-m2', title: 'Module 2: Synchronization and deadlocks', topics: [
    t('ktu-os-locks', 'Locks, semaphores and synchronization', 'missing'), t('ktu-os-deadlock', 'Deadlock and starvation', 'missing'),
  ]},
  { id: 'ktu-os-m3', title: 'Module 3: Memory and virtual memory', topics: [
    t('ktu-os-seg', 'Segmentation and address translation', 'missing'), t('ktu-os-paging', 'Paging, page tables and TLBs', 'missing'), t('ktu-os-vm', 'Page faults, replacement and thrashing', 'missing'),
  ]},
  { id: 'ktu-os-m4', title: 'Module 4: I/O, files and storage', topics: [
    t('ktu-os-io', 'Interrupts, DMA and device drivers', 'missing'), t('ktu-os-files', 'File systems, directories and disk scheduling', 'missing'),
  ]},
])
const KTU_COA = ktuCourse('ktu-coa', 'Computer Organization and Architecture (PBCST404)', [
  { id: 'ktu-coa-m1', title: 'Module 1: Computer structure and RISC', topics: ['Functional units, memory map and endianness', 'RISC instruction set and assembly programming', 'Instruction execution cycle'].map((x,i)=>t(`ktu-coa-1-${i}`,x,'missing')) },
  { id: 'ktu-coa-m2', title: 'Module 2: Microarchitecture and pipelining', topics: ['Single-cycle datapath and control', 'Pipelined processors', 'Pipeline hazards and performance'].map((x,i)=>t(`ktu-coa-2-${i}`,x,'missing')) },
  { id: 'ktu-coa-m3', title: 'Module 3: Memory systems', topics: ['Cache mapping and replacement', 'Multi-level caches', 'Virtual memory, page tables and TLB'].map((x,i)=>t(`ktu-coa-3-${i}`,x,'missing')) },
  { id: 'ktu-coa-m4', title: 'Module 4: Input and output', topics: ['Programmed and interrupt-driven I/O', 'Direct memory access', 'Embedded and serial I/O'].map((x,i)=>t(`ktu-coa-4-${i}`,x,'missing')) },
])
const KTU_MATH4 = ktuCourse('ktu-math4', 'Mathematics for Information Science-4 (GAMAT401)', [
  { id: 'ktu-math4-m1', title: 'Module 1: Graphs and connectivity', topics: ['Graph definitions, incidence, degree and isomorphism', 'Subgraphs, walks, paths, circuits and components'].map((x,i)=>t(`ktu-math4-1-${i}`,x,'missing')) },
  { id: 'ktu-math4-m2', title: 'Module 2: Euler, Hamiltonian and directed graphs', topics: ['Euler graphs and graph operations', 'Hamiltonian paths, circuits and travelling-salesman problem', 'Directed graphs and connectivity'].map((x,i)=>t(`ktu-math4-2-${i}`,x,'missing')) },
  { id: 'ktu-math4-m3', title: 'Module 3: Trees and graph algorithms', topics: ['Rooted, binary and spanning trees', 'Prim and Kruskal minimum-spanning-tree algorithms', 'Dijkstra and Floyd–Warshall shortest paths'].map((x,i)=>t(`ktu-math4-3-${i}`,x,'missing')) },
  { id: 'ktu-math4-m4', title: 'Module 4: Graph matrices and coloring', topics: ['Adjacency, incidence, circuit and path matrices', 'Graph coloring and chromatic number', 'Chromatic polynomial and greedy coloring'].map((x,i)=>t(`ktu-math4-4-${i}`,x,'missing')) },
])

// Compact branch catalog for KTU 2024 S3/S4. The course cards and topic
// outlines are maintained in-app; local outlines are planning aids, not a
// replacement for the student's college-issued syllabus.
const previewSubject = (id, title, topics, category = null) => ({ ...ktuCourse(id, title, [
  { id: `${id}-outline`, title: 'Core topics', topics: topics.map((name, index) => t(`${id}-topic-${index + 1}`, name, 'missing')) },
]), category })
// KTU 2024 B.Tech curriculum, Group A (CSE): S2 course titles/slots/codes.
// The curriculum PDF is published as an APJAKTU curriculum and hosted by NSS College:
// https://www.nssce.ac.in/pdf/KTU_B.%20Tech_%20Curriculum_%202024.pdf
const cseS2Subject = (id, title, code, topics, category, credits) => ({
  ...previewSubject(`ktu-cse-s2-${id}`, `${title} (${code})`, topics, category),
  credits,
})
const CSE_S2 = [
  cseS2Subject('math2', 'Mathematics for Information Science-2', 'GAMAT201', ['Differential equations and transforms', 'Series and applications', 'Mathematical methods in information science'], 'Slot A · common core', 3),
  cseS2Subject('physics', 'Physics for Information Science', 'GAPHT121', ['Physics syllabus outline preview', 'Laboratory-linked concepts', 'Check the module outline issued for your admitted batch'], 'Slot B · choose the assigned science option', 4),
  cseS2Subject('chemistry', 'Chemistry for Information Science', 'GXCYT122', ['Chemistry syllabus outline preview', 'Laboratory-linked concepts', 'Check the module outline issued for your admitted batch'], 'Slot B · alternative science option', 4),
  cseS2Subject('computing-foundations', 'Foundations of Computing: From Hardware Essentials to Web Design', 'GXEST203', ['Computer hardware and digital foundations', 'Operating systems, networks and internet concepts', 'Web design foundations'], 'Slot C · common core', 3),
  cseS2Subject('c-programming', 'Programming in C', 'GXEST204', ['C language basics, types and control flow', 'Functions, arrays, strings and pointers', 'Structures, files and programming practice'], 'Slot D · common core', 4),
  cseS2Subject('discrete-math', 'Discrete Mathematics', 'PCCST205', ['Logic, sets and relations', 'Combinatorics and recurrence relations', 'Graphs, trees and discrete structures'], 'Slot E · CSE programme core', 4),
  cseS2Subject('entrepreneurship', 'Engineering Entrepreneurship and IPR', 'UCEST206', ['Entrepreneurship and opportunity identification', 'Innovation, intellectual property and patents', 'Business models and technology ventures'], 'Slot F · university course', 3),
  cseS2Subject('wellness', 'Health and Wellness', 'UCHWT127', ['Wellness course outline preview', 'Activities and assessment as assigned by the college', 'Confirm whether this or the Life Skills option applies'], 'I-slot · confirm the assigned option', 1),
  cseS2Subject('life-skills', 'Life Skills and Professional Communication', 'UCHUT128', ['Communication and professional skills outline preview', 'Activities and assessment as assigned by the college', 'Confirm whether this or the Health and Wellness option applies'], 'I-slot · alternative course option', 1),
  cseS2Subject('it-workshop', 'IT Workshop', 'GXESL208', ['Computer setup and operating-system practice', 'Networking and web tool practice', 'Workshop exercises as assigned by the department'], 'Slot L · laboratory/workshop', 1),
  cseS2Subject('digital101', 'Digital 101 (NASSCOM MOOC)', 'UCSEM129', ['MOOC selected for the student’s section', 'Work through the assigned online units', 'Complete the course assessment shown in the learning portal'], 'Skill enhancement · MOOC', 1),
]
const sharedMath3 = previewSubject('ktu-shared-math3', 'Mathematics for Physical Science-3 (GYMAT301)', ['Probability distributions and random variables', 'Expectation, variance and joint distributions', 'Limit theorems and stochastic processes'])
const sharedMath4 = previewSubject('ktu-shared-math4', 'Mathematics for Physical Science-4 (GCMAT401)', ['Graph theory and connectivity', 'Trees, paths and graph algorithms', 'Graph matrices and coloring'])
const sharedAi = previewSubject('ktu-shared-ai', 'Introduction to AI and Data Science (GNEST305)', ['Data and the data science workflow', 'Data preparation, visualization and exploratory analysis', 'AI concepts and responsible use'])
const sharedHumanities = previewSubject('ktu-shared-humanities', 'Economics / Engineering Ethics (UCHUT346 / UCHUT347)', ['Engineering economy and decision making', 'Professional responsibility and ethical practice', 'Sustainable development'])
const branchCopy = (subject, prefix) => ({
  ...subject,
  id: `${prefix}-${subject.id}`,
  modules: subject.modules.map((module) => ({
    ...module,
    id: `${prefix}-${module.id}`,
    topics: module.topics.map((topic) => ({ ...topic, id: `${prefix}-${topic.id}` })),
  })),
})

const CIVIL_S3 = [
  branchCopy(sharedMath3, 'ktu-ce'),
  previewSubject('ktu-ce-fluid', 'Fluid Mechanics (PCCET302)', ['Fluid properties and hydrostatics', 'Continuity, momentum and energy equations', 'Pipe flow and dimensional analysis']),
  previewSubject('ktu-ce-struct1', 'Structural Analysis I (PCCET303)', ['Structural systems and support reactions', 'Analysis of determinate beams and frames', 'Influence lines and deflection']),
  previewSubject('ktu-ce-survey', 'Surveying and Geomatics (PBCET304)', ['Surveying principles and measurements', 'Leveling, traversing and total station', 'GPS, GIS and remote sensing']),
  branchCopy(sharedAi, 'ktu-ce'),
  branchCopy(sharedHumanities, 'ktu-ce'),
]
const CIVIL_S4 = [
  branchCopy(sharedMath4, 'ktu-ce'),
  previewSubject('ktu-ce-soil', 'Soil Mechanics (PCCET402)', ['Soil properties and classification', 'Permeability, seepage and effective stress', 'Consolidation and shear strength']),
  previewSubject('ktu-ce-struct2', 'Structural Analysis II (PCCET403)', ['Indeterminate structures', 'Slope-deflection and moment distribution', 'Approximate analysis of frames']),
  previewSubject('ktu-ce-concrete', 'Design of Concrete Structures (PBCET404)', ['Reinforced concrete design principles', 'Design of beams and slabs', 'Columns and detailing concepts']),
  branchCopy(sharedHumanities, 'ktu-ce'),
]
const MECH_S3 = [
  branchCopy(sharedMath3, 'ktu-me'),
  previewSubject('ktu-me-solids', 'Mechanics of Solids (PCMET302)', ['Stress, strain and material properties', 'Bending, shear and torsion', 'Deflection and failure theories']),
  previewSubject('ktu-me-fluid', 'Fluid Mechanics and Machinery (PCMET303)', ['Fluid statics and flow fundamentals', 'Pipe flow and dimensional analysis', 'Pumps and hydraulic machines']),
  previewSubject('ktu-me-manufacturing', 'Manufacturing Processes (PBMET304)', ['Casting and forming processes', 'Machining and machine tools', 'Joining and modern manufacturing']),
  branchCopy(sharedAi, 'ktu-me'),
  branchCopy(sharedHumanities, 'ktu-me'),
]
const MECH_S4 = [
  branchCopy(sharedMath4, 'ktu-me'),
  previewSubject('ktu-me-tools', 'Machine Tools and Metrology (PCMET402)', ['Machining principles and cutting tools', 'Lathe, drilling and milling operations', 'Measurement, limits, fits and tolerances']),
  previewSubject('ktu-me-thermo', 'Engineering Thermodynamics (PCMET403)', ['First and second laws of thermodynamics', 'Properties of pure substances and cycles', 'Entropy and refrigeration fundamentals']),
  previewSubject('ktu-me-machinery', 'Mechanics of Machinery (PBMET404)', ['Kinematics of mechanisms', 'Cams, gears and gear trains', 'Balancing and vibration fundamentals']),
  branchCopy(sharedHumanities, 'ktu-me'),
]
const CIVIL_S5 = [
  previewSubject('ktu-ce-hydro-s5', 'Hydrology and Water Resources Engineering (PCCET501)', ['Hydrologic cycle, precipitation and rainfall measurement', 'Infiltration, evaporation, runoff and hydrographs', 'Flood estimation, irrigation and groundwater hydrology'], 'Core subject'),
  previewSubject('ktu-ce-transport-s5', 'Transportation Engineering (PCCET502)', ['Highway alignment, geometric design and road materials', 'Traffic studies, capacity and intersection design', 'Pavement design, railway, airport and harbour engineering'], 'Core subject'),
  previewSubject('ktu-ce-environment-s5', 'Environmental Engineering (PCCET503)', ['Water quality and water demand', 'Water treatment processes and distribution', 'Wastewater treatment, disposal and solid waste basics'], 'Core subject'),
  previewSubject('ktu-ce-foundation-s5', 'Foundation Engineering (PBCET504)', ['Earth pressure and slope stability', 'Site investigation and bearing capacity', 'Shallow, raft and pile foundation design'], 'Core subject · project based'),
  previewSubject('ktu-ce-pe521', 'Advanced Structural Analysis (PECET521)', ['Matrix methods and structural modelling', 'Analysis of frames and trusses', 'Approximate and computational methods'], 'Programme elective option'),
  previewSubject('ktu-ce-pe522', 'Modern Construction Technology (PECET522)', ['Modern construction materials and methods', 'Prefabrication and construction systems', 'Construction equipment and site practice'], 'Programme elective option'),
  previewSubject('ktu-ce-pe523', 'Open Channel Hydraulics (PECET523)', ['Uniform and gradually varied flow', 'Specific energy and critical flow', 'Hydraulic jumps and channel design'], 'Programme elective option'),
  previewSubject('ktu-ce-pe524', 'Disaster Management (PECET524)', ['Hazards, vulnerability and risk assessment', 'Preparedness, mitigation and response', 'Recovery planning and disaster governance'], 'Programme elective option'),
  previewSubject('ktu-ce-pe525', 'Design of Prestressed Concrete (PECET525)', ['Prestressing systems and materials', 'Stress analysis and losses', 'Flexural and shear design of prestressed members'], 'Programme elective option'),
  previewSubject('ktu-ce-pe526', 'Applied Hydrology and Climatology (PECET526)', ['Climate systems and hydrometeorology', 'Catchment processes and water balance', 'Climate variability and hydrological applications'], 'Programme elective option'),
  previewSubject('ktu-ce-pe527', 'Town Planning (PECET527)', ['Urban planning principles and plans', 'Land use, zoning and development control', 'Planning regulations and sustainable settlements'], 'Programme elective option'),
  previewSubject('ktu-ce-pe528', 'Optimization Techniques and Operations Research for Civil Engineers (PECET528)', ['Linear programming and optimization models', 'Network, transportation and assignment problems', 'Decision methods for civil engineering systems'], 'Programme elective option'),
  previewSubject('ktu-ce-constitution-s5', 'Constitution of India (UCHUM506)', ['Constitutional foundations and fundamental rights', 'Government structure and democratic institutions', 'Civic responsibilities and constitutional values'], 'Common course'),
  previewSubject('ktu-ce-geolab-s5', 'Geotechnical Engineering Lab (PCCEL507)', ['Soil classification and index property tests', 'Compaction, permeability and consolidation tests', 'Shear strength and field density tests'], 'Laboratory'),
  previewSubject('ktu-ce-concretelab-s5', 'Concrete Lab (MT-2) (PCCEL508)', ['Fresh concrete workability tests', 'Concrete mix and material testing', 'Hardened concrete strength tests'], 'Laboratory'),
]

// The original courses are retained as editable sample curricula.
export const CURRICULUM = [
  { id: 'ktu-btech-cse-2024', name: 'B.Tech · Computer Science & Engineering', scheme: 'KTU 2024', sourceNote: 'KTU 2024 Group A catalog preview · S2 subject titles and codes are listed, including science and I-slot alternatives. Confirm your exact option combination and admitted-batch syllabus with your college; topic outlines are planning previews.', semesters: { 2: CSE_S2, 3: [KTU_MATH3, KTU_TOC, KTU_DSA, KTU_OOP, KTU_DIGITAL], 4: [KTU_MATH4, KTU_DBMS, KTU_OS, KTU_COA] } },
  { id: 'ktu-btech-civil-2024', name: 'B.Tech · Civil Engineering', scheme: 'KTU 2024', sourceNote: 'KTU 2024 scheme preview · subject lists for S3–S5. S5 shows core subjects, Programme Elective-2 options, a common course and labs. Students take the elective allocated by their college, not every option.', semesters: { 3: CIVIL_S3, 4: CIVIL_S4, 5: CIVIL_S5 } },
  { id: 'ktu-btech-mech-2024', name: 'B.Tech · Mechanical Engineering', scheme: 'KTU 2024', sourceNote: 'KTU 2024 scheme preview · core subjects for S3/S4. Labs, common courses and electives may vary by college.', semesters: { 3: MECH_S3, 4: MECH_S4 } },
  { id: 'btech-cse', name: 'B.Tech Computer Science (sample)', semesters: { 3: [DS], 4: [OS, DBMS] } },
  { id: 'bca', name: 'BCA', semesters: { 3: [DS] } },
]

export const SEED_RESOURCES = [
  { id: 'seed-nptel-os', topic: 'os-paging', type: 'videos', title: 'Operating System Fundamentals · NPTEL / IIT Kharagpur', kind: 'Free course', source: 'NPTEL · IIT Kharagpur', checked: 'official course page checked 19 Oct 2026', addedBy: 'Syllabus Hub curator', addedAt: '2026-10-19', verification: 'Official NPTEL course page; course outline includes virtual memory.', url: 'https://nptel.ac.in/courses/106105214' },
  { id: 'seed-nptel-dsa', topic: 'ds-ll', type: 'videos', title: 'Data Structures and Algorithms · NPTEL / IIT Delhi', kind: 'Free course', source: 'NPTEL · IIT Delhi', checked: 'official course page checked 19 Oct 2026', addedBy: 'Syllabus Hub curator', addedAt: '2026-10-19', verification: 'Official NPTEL course page; course outline includes lists, linked lists, trees, sorting and graphs.', url: 'https://nptel.ac.in/courses/106102064' },
  { id: 'seed-nptel-dbms', topic: 'db-joins', type: 'videos', title: 'Introduction to Database Systems · NPTEL / IIT Madras', kind: 'Free course', source: 'NPTEL · IIT Madras', checked: 'official course page checked 19 Oct 2026', addedBy: 'Syllabus Hub curator', addedAt: '2026-10-19', verification: 'Official NPTEL course page; course outline includes relational query evaluation and join processing.', url: 'https://nptel.ac.in/courses/106106220' },
]

// KTU topic IDs used by the current catalog. Keep seed items tied to these
// IDs so the KTU course pages have relevant starter material on first use.
export const KTU_SEED_RESOURCES = [
  { ...SEED_RESOURCES.find((resource) => resource.id === 'seed-nptel-os'), id: 'ktu-seed-nptel-os', topic: 'ktu-os-paging' },
  { ...SEED_RESOURCES.find((resource) => resource.id === 'seed-nptel-dbms'), id: 'ktu-seed-nptel-dbms', topic: 'ktu-dbms-2-2' },
  { ...SEED_RESOURCES.find((resource) => resource.id === 'seed-nptel-dsa'), id: 'ktu-seed-nptel-dsa', topic: 'ktu-dsa-linked' },
]
