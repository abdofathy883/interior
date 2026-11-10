import {
  AppUser,
  Category,
  Client,
  Expense,
  Payment,
  ProjectStage,
  StageStatus,
  SubCategory,
} from '../models/models';
import { addDays } from '../util/dates';

export interface SeedData {
  clients: Client[];
  payments: Payment[];
  expenses: Expense[];
  categories: Category[];
  subCategories: SubCategory[];
  stages: ProjectStage[];
  users: AppUser[];
}

export const DEMO_CLIENT_ID = 'c-1';
export const CAT_LABOR = 'cat-labor';
export const CAT_MATERIALS = 'cat-materials';

/** Deterministic PRNG so the seed is identical on every load. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SubDef {
  id: string;
  cat: string;
  name: string;
  /** typical lump-sum size, used only as a relative weight when generating amounts */
  base: number;
  notes: string[];
}

const SUBS: SubDef[] = [
  // مصنعية
  { id: 'sub-l-elec', cat: CAT_LABOR, name: 'كهربا', base: 4500, notes: ['مصنعية تأسيس كهرباء', 'تمديد دوائر الإضاءة والبرايز', 'تركيب لوحة التوزيع', 'دفعة مقاول الكهرباء'] },
  { id: 'sub-l-plumb', cat: CAT_LABOR, name: 'سباكة', base: 4000, notes: ['مصنعية تأسيس سباكة', 'تركيب نقط المياه والصرف', 'دفعة السباك'] },
  { id: 'sub-l-paint', cat: CAT_LABOR, name: 'نقاشة', base: 6000, notes: ['مصنعية معجون ووجهين دهان', 'دفعة مقاول النقاشة', 'مصنعية دهانات الواجهات'] },
  { id: 'sub-l-carp', cat: CAT_LABOR, name: 'نجارة', base: 7000, notes: ['مصنعية أبواب وشبابيك', 'تنفيذ دواليب غرف النوم', 'دفعة النجار'] },
  { id: 'sub-l-tile', cat: CAT_LABOR, name: 'بلاط وسيراميك', base: 9000, notes: ['مصنعية تركيب سيراميك', 'دفعة مقاول البلاط', 'تركيب بورسلين الصالة'] },
  { id: 'sub-l-gyp', cat: CAT_LABOR, name: 'جبس بورد', base: 8000, notes: ['مصنعية أسقف جبس بورد', 'تنفيذ بنوار وإضاءة مخفية', 'دفعة مقاول الجبس'] },
  { id: 'sub-l-inst', cat: CAT_LABOR, name: 'تركيبات', base: 2500, notes: ['تركيب تجهيزات الحمامات', 'تركيب أطقم الإضاءة', 'تركيب الإكسسوارات والمقابض'] },
  // مواد خام
  { id: 'sub-m-wood', cat: CAT_MATERIALS, name: 'أخشاب', base: 15000, notes: ['خشب موسكي للأبواب', 'ألواح MDF للدواليب', 'أخشاب المطبخ'] },
  { id: 'sub-m-paint', cat: CAT_MATERIALS, name: 'دهانات', base: 12000, notes: ['دهانات جوتن', 'معجون وسيلر', 'دهانات سكاي'] },
  { id: 'sub-m-tile', cat: CAT_MATERIALS, name: 'سيراميك وبورسلين', base: 30000, notes: ['سيراميك أرضيات - كليوباترا', 'بورسلين الصالة', 'سيراميك الحمامات والمطبخ'] },
  { id: 'sub-m-elec', cat: CAT_MATERIALS, name: 'كابلات وأدوات كهربائية', base: 9000, notes: ['كابلات وأسلاك كهرباء', 'مفاتيح وبرايز', 'لوحة كهرباء وقواطع'] },
  { id: 'sub-m-plumb', cat: CAT_MATERIALS, name: 'مواسير وأدوات سباكة', base: 8000, notes: ['مواسير بولي بروبلين', 'خلاطات وأدوات صحية', 'سخان وتوصيلات'] },
  { id: 'sub-m-gyp', cat: CAT_MATERIALS, name: 'جبس ومواد بناء', base: 7000, notes: ['ألواح جبس بورد وحدادة', 'أسمنت ورمل', 'مواد عزل'] },
  { id: 'sub-m-light', cat: CAT_MATERIALS, name: 'إضاءة', base: 10000, notes: ['سبوتات ولمبات LED', 'نجف الصالة', 'إضاءة LED مخفية'] },
];

type Extra = [daysAgo: number, subId: string, amount: number, note: string];
type Installment = [daysAgo: number, amount: number, note: string];

interface ClientSpec {
  id: string;
  name: string;
  phone: string;
  projectType: 'apartment' | 'villa';
  location: string;
  budget: number;
  startAgo: number;
  endAgo: number;
  status: 'active' | 'completed';
  /** total spent target (cash out) */
  spent: number;
  /** number of generated expenses (on top of `extras`) */
  n: number;
  weights: Record<string, number>;
  extras: Extra[];
  payments: Installment[];
  stages: StageStatus[];
}

const D: StageStatus = 'done';
const P: StageStatus = 'in-progress';
const U: StageStatus = 'upcoming';

const STAGE_NAMES = [
  'تصميم وتجهيز المخططات',
  'تشطيب كهرباء وسباكة',
  'جبس بورد وأسقف',
  'بلاط وسيراميك',
  'نقاشة',
  'تركيبات وتسليم',
];

/**
 * The story the numbers tell:
 *  c-1  portal demo client, healthy profit, rich data
 *  c-2  big villa, strongest profit
 *  c-3  completed, fully paid, profitable
 *  c-4  close to overspending its budget (95% used) and under-collected -> negative cash profit
 *  c-5  big new villa, a LOT still to collect
 *  c-6  steady apartment, healthy
 */
const SPECS: ClientSpec[] = [
  {
    id: 'c-1',
    name: 'أحمد سمير الشناوي',
    phone: '01012345678',
    projectType: 'apartment',
    location: 'التجمع الخامس',
    budget: 650_000,
    startAgo: 170,
    endAgo: 4,
    status: 'active',
    spent: 430_000,
    n: 14,
    weights: { 'sub-m-tile': 2.5, 'sub-l-tile': 2, 'sub-l-gyp': 2, 'sub-m-light': 1.5, 'sub-l-install': 0.6 },
    extras: [
      [120, 'sub-l-elec', 800, 'عامل كهربا - يومية'],
      [92, 'sub-l-plumb', 700, 'سباك - يومية'],
    ],
    payments: [
      [170, 150_000, 'دفعة أولى - عند التعاقد'],
      [110, 200_000, 'دفعة ثانية - بعد التأسيس'],
      [45, 170_000, 'دفعة ثالثة - بعد البلاط'],
    ],
    stages: [D, D, D, D, P, U],
  },
  {
    id: 'c-2',
    name: 'منى عادل حسين',
    phone: '01123456789',
    projectType: 'villa',
    location: 'الشيخ زايد',
    budget: 2_400_000,
    startAgo: 150,
    endAgo: 2,
    status: 'active',
    spent: 1_350_000,
    n: 16,
    weights: { 'sub-m-tile': 3, 'sub-m-wood': 3, 'sub-l-carp': 2.5, 'sub-m-light': 2, 'sub-l-gyp': 2, 'sub-m-gyp': 1.5 },
    extras: [
      [130, 'sub-l-elec', 900, 'عامل كهربا - يومية'],
      [75, 'sub-l-paint', 1200, 'نقاش - يومية'],
    ],
    payments: [
      [150, 600_000, 'دفعة أولى - عند التعاقد'],
      [110, 500_000, 'دفعة ثانية'],
      [65, 400_000, 'دفعة ثالثة'],
      [20, 300_000, 'دفعة رابعة'],
    ],
    stages: [D, D, D, P, U, U],
  },
  {
    id: 'c-3',
    name: 'خالد مصطفى إبراهيم',
    phone: '01234567890',
    projectType: 'apartment',
    location: '6 أكتوبر',
    budget: 280_000,
    startAgo: 175,
    endAgo: 75,
    status: 'completed',
    spent: 205_000,
    n: 6,
    weights: {},
    extras: [
      [150, 'sub-l-plumb', 650, 'سباك - يومية'],
      [110, 'sub-l-inst', 1100, 'تركيب إكسسوارات الحمام'],
    ],
    payments: [
      [175, 140_000, 'دفعة أولى'],
      [100, 140_000, 'الدفعة الأخيرة - بعد التسليم'],
    ],
    stages: [D, D, D, D, D, D],
  },
  {
    id: 'c-4',
    name: 'هبة محمود الجندي',
    phone: '01556789012',
    projectType: 'apartment',
    location: 'المعادي',
    budget: 450_000,
    startAgo: 130,
    endAgo: 6,
    status: 'active',
    spent: 428_000,
    n: 8,
    weights: { 'sub-m-tile': 2, 'sub-m-wood': 2, 'sub-l-carp': 1.5 },
    extras: [
      [100, 'sub-l-elec', 850, 'عامل كهربا - يومية'],
      [40, 'sub-l-paint', 1000, 'نقاش - يومية (تعديلات)'],
    ],
    payments: [
      [130, 200_000, 'دفعة أولى'],
      [80, 120_000, 'دفعة ثانية'],
      [30, 80_000, 'دفعة ثالثة'],
    ],
    stages: [D, D, D, D, D, P],
  },
  {
    id: 'c-5',
    name: 'طارق يوسف النجار',
    phone: '01098765432',
    projectType: 'villa',
    location: 'الساحل الشمالي',
    budget: 2_500_000,
    startAgo: 60,
    endAgo: 1,
    status: 'active',
    spent: 520_000,
    n: 7,
    weights: { 'sub-m-gyp': 2, 'sub-l-gyp': 2, 'sub-m-elec': 2, 'sub-l-elec': 2 },
    extras: [
      [50, 'sub-l-elec', 900, 'عامل كهربا - يومية'],
      [28, 'sub-l-plumb', 750, 'سباك - يومية'],
    ],
    payments: [
      [60, 400_000, 'دفعة أولى - حجز'],
      [25, 200_000, 'دفعة ثانية'],
    ],
    stages: [D, P, U, U, U, U],
  },
  {
    id: 'c-6',
    name: 'نادين شريف الألفي',
    phone: '01187654321',
    projectType: 'apartment',
    location: 'الشيخ زايد',
    budget: 900_000,
    startAgo: 120,
    endAgo: 3,
    status: 'active',
    spent: 520_000,
    n: 7,
    weights: { 'sub-m-light': 2, 'sub-m-paint': 1.5, 'sub-l-gyp': 2 },
    extras: [
      [90, 'sub-l-elec', 800, 'عامل كهربا - يومية'],
      [55, 'sub-l-tile', 1500, 'مصنعية ترميم بلاط'],
    ],
    payments: [
      [120, 300_000, 'دفعة أولى'],
      [70, 250_000, 'دفعة ثانية'],
      [25, 150_000, 'دفعة ثالثة'],
    ],
    stages: [D, D, P, U, U, U],
  },
];

export function buildSeed(today: Date = new Date()): SeedData {
  const ago = (n: number) => addDays(today, -n);

  const categories: Category[] = [
    { id: CAT_LABOR, name: 'مصنعية' },
    { id: CAT_MATERIALS, name: 'مواد خام' },
  ];
  const subCategories: SubCategory[] = SUBS.map((s) => ({ id: s.id, categoryId: s.cat, name: s.name }));

  const clients: Client[] = [];
  const payments: Payment[] = [];
  const expenses: Expense[] = [];
  const stages: ProjectStage[] = [];

  SPECS.forEach((spec, idx) => {
    const rand = mulberry32(idx * 7919 + 13);

    clients.push({
      id: spec.id,
      name: spec.name,
      phone: spec.phone,
      projectType: spec.projectType,
      location: spec.location,
      budget: spec.budget,
      startDate: ago(spec.startAgo),
      status: spec.status,
      portalUserId: spec.id === DEMO_CLIENT_ID ? 'u-client' : undefined,
    });

    spec.payments.forEach(([d, amount, note], i) => {
      payments.push({ id: `p-${idx + 1}-${i + 1}`, clientId: spec.id, date: ago(d), amount, note });
    });

    spec.stages.forEach((status, i) => {
      stages.push({ id: `s-${idx + 1}-${i + 1}`, clientId: spec.id, name: STAGE_NAMES[i], status, order: i + 1 });
    });

    // ---- expenses: hand-written extras + generated lump sums scaled to hit `spent` exactly
    const pool = SUBS.flatMap((s) => Array.from({ length: Math.round((spec.weights[s.id] ?? 1) * 10) }, () => s));
    const picks = Array.from({ length: spec.n }, () => pool[Math.floor(rand() * pool.length)]);
    const raw = picks.map((s) => s.base * (0.6 + rand() * 0.9));
    const extrasTotal = spec.extras.reduce((a, e) => a + e[2], 0);
    const target = spec.spent - extrasTotal;
    const scale = target / raw.reduce((a, b) => a + b, 0);
    const amounts = raw.map((r) => Math.max(500, Math.round((r * scale) / 50) * 50));
    amounts[amounts.length - 1] += target - amounts.reduce((a, b) => a + b, 0);

    const span = spec.startAgo - spec.endAgo;
    const gen = picks.map((s, i) => {
      const dAgo = Math.min(
        spec.startAgo - 2,
        Math.max(spec.endAgo, spec.startAgo - 2 - Math.round(((i + rand() * 0.8) / spec.n) * (span - 2))),
      );
      return { dAgo, sub: s, amount: amounts[i], note: s.notes[Math.floor(rand() * s.notes.length)] };
    });
    const extra = spec.extras.map(([dAgo, subId, amount, note]) => ({
      dAgo,
      sub: SUBS.find((s) => s.id === subId)!,
      amount,
      note,
    }));

    [...gen, ...extra]
      .sort((a, b) => b.dAgo - a.dAgo)
      .forEach((e, i) => {
        expenses.push({
          id: `e-${idx + 1}-${String(i + 1).padStart(2, '0')}`,
          clientId: spec.id,
          date: ago(e.dAgo),
          amount: e.amount,
          categoryId: e.sub.cat,
          subCategoryId: e.sub.id,
          note: e.note,
        });
      });
  });

  const users: AppUser[] = [
    { id: 'u-admin', email: 'admin@demo.com', password: 'demo123', name: 'مدير النظام', role: 'admin' },
    { id: 'u-client', email: 'client@demo.com', password: 'demo123', name: SPECS[0].name, role: 'client', clientId: DEMO_CLIENT_ID },
  ];

  expenses.sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)));

  return { clients, payments, expenses, categories, subCategories, stages, users };
}
