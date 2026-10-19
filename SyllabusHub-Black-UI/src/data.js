export const STATUS = {
  covered: { label: 'Covered (estimate)', icon: '●', cls: 'bg-green-50 text-status-covered', badge: 'bg-green-50 text-status-covered border-emerald-200', dot: 'text-status-covered', dotDark: 'text-status-covered' },
  partial: { label: 'Partial', icon: '◐', cls: 'bg-amber-50 text-status-partial', badge: 'bg-amber-50 text-status-partial border-amber-200', dot: 'text-status-partial', dotDark: 'text-status-partial' },
  missing: { label: 'Not found', icon: '○', cls: 'bg-slate-100 text-status-missing', badge: 'bg-slate-100 text-status-missing border-slate-300', dot: 'text-status-missing', dotDark: 'text-status-missing' },
  review: { label: 'Needs review', icon: '⚑', cls: 'bg-violet-50 text-status-review', badge: 'bg-violet-50 text-status-review border-violet-200', dot: 'text-status-review', dotDark: 'text-status-review' },
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

// Replace this sample data with your real syllabus (or load it from your API).
export const CURRICULUM = [
  { id: 'btech-cse', name: 'B.Tech Computer Science', semesters: { 3: [DS], 4: [OS, DBMS] } },
  { id: 'bca', name: 'BCA', semesters: { 3: [DS] } },
]

export const SEED_RESOURCES = [
  { id: 1, topic: 'os-paging', type: 'notes', title: 'Paging Notes.pdf', kind: 'Uploaded file', source: 'Ravi', checked: '2 days ago', url: '' },
  { id: 2, topic: 'os-paging', type: 'notes', title: 'Paging summary (Anu)', kind: 'Uploaded file', source: 'Anu', checked: '4 days ago', url: '' },
  { id: 3, topic: 'os-paging', type: 'videos', title: 'Virtual Memory Management through Paging', kind: 'Lecture video', source: 'Computer Science Fundamentals', checked: 'sample link', url: 'https://www.youtube.com/watch?v=8ufliWkgqMo' },
  { id: 4, topic: 'os-paging', type: 'code', title: 'paging-sim', kind: 'Link', source: 'github.com', checked: '5 days ago', url: 'https://github.com' },
  { id: 5, topic: 'os-paging', type: 'textbook', title: 'Operating System Concepts, Ch. 9', kind: 'Reference', source: 'Silberschatz', checked: '1 week ago', url: '' },
  { id: 6, topic: 'os-paging', type: 'pyqs', title: '2021 Exam Q3', kind: 'Uploaded file', source: 'Class library', checked: '2 weeks ago', url: '' },
  { id: 7, topic: 'os-paging', type: 'pyqs', title: '2022 Exam Q5', kind: 'Uploaded file', source: 'Class library', checked: '2 weeks ago', url: '' },
  { id: 8, topic: 'os-seg', type: 'notes', title: 'Segmentation summary', kind: 'Uploaded file', source: 'Anu', checked: '3 days ago', url: '' },
  { id: 9, topic: 'os-sched', type: 'notes', title: 'Scheduling algorithms cheat sheet', kind: 'Uploaded file', source: 'Ravi', checked: '3 days ago', url: '' },
  { id: 10, topic: 'db-joins', type: 'notes', title: 'Joins with examples', kind: 'Uploaded file', source: 'Meera', checked: '1 week ago', url: '' },
  { id: 11, topic: 'ds-ll', type: 'code', title: 'linked-list-in-c', kind: 'Link', source: 'github.com', checked: '1 week ago', url: 'https://github.com' },
]
