import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Apple,
  BarChart3,
  CalendarDays,
  Check,
  ChevronsLeft,
  ChevronsRight,
  Dumbbell,
  Flame,
  GlassWater,
  Pencil,
  Plus,
  Scale,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Auth from "./Auth";
import { supabase } from "./lib/supabase";
import { loadUserData } from "./lib/loadUserData";
import { saveUserData } from "./lib/saveUserData";
import { seedInitialData } from "./lib/seed";

const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const TARGET_WEIGHT = 65;
const PROTEIN_PER_KG = 2.2;
const FAT_PER_KG = 0.8;
const ASSUMED_AGE = 22;
const SEX_OFFSET = 5;

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const parseDateKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (key, amount) => {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const compareDateKeys = (a, b) => parseDateKey(a).getTime() - parseDateKey(b).getTime();

const daysBetween = (a, b) => Math.round((parseDateKey(b).getTime() - parseDateKey(a).getTime()) / 86400000);

const dateLabel = (key) => {
  const date = parseDateKey(key);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const longDateLabel = (key) => {
  const date = parseDateKey(key);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const round = (n, p = 0) => {
  const m = 10 ** p;
  return Math.round((Number(n) || 0) * m) / m;
};

const id = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

const buildDateWindow = (centerKey, radius = 10) =>
  Array.from({ length: radius * 2 + 1 }, (_, index) => addDays(centerKey, index - radius));

const presetTemplates = [
  {
    id: id(),
    name: "DAY 1 – PUSH",
    label: "Ngực – Vai – Tay sau",
    burn: 320,
    note: "Form là ưu tiên số 1. Tempo chậm, tập trung cảm nhận.",
    exercises: [
      { id: id(), name: "DB Bench Press", sets: "4", reps: "8-10", tempo: "2-1-2", rest: "90s" },
      { id: id(), name: "Incline DB Press", sets: "3", reps: "10-12", tempo: "3-0-2", rest: "60s" },
      { id: id(), name: "DB Shoulder Press", sets: "4", reps: "8-10", tempo: "2-0-2", rest: "90s" },
      { id: id(), name: "Lateral Raise", sets: "3", reps: "12-15", tempo: "2-1-2", rest: "60s" },
      { id: id(), name: "Cable Tricep Pushdown", sets: "4", reps: "10-12", tempo: "2-2-4", rest: "60s" },
      { id: id(), name: "Overhead Tricep Extension", sets: "3", reps: "12-15", tempo: "2-2-4", rest: "60s" },
    ],
  },
  {
    id: id(),
    name: "DAY 2 – PULL",
    label: "Lưng – Tay trước",
    burn: 330,
    note: "Kéo bằng lưng, không giật người.",
    exercises: [
      { id: id(), name: "Pull-Up / Assisted Pull-Up", sets: "4", reps: "Max", tempo: "2-1-2", rest: "90s" },
      { id: id(), name: "Seated Cable Row", sets: "4", reps: "10-12", tempo: "2-0-2", rest: "75s" },
      { id: id(), name: "DB Row (1 tay)", sets: "3", reps: "10-12 mỗi bên", tempo: "3-1-2", rest: "60s" },
      { id: id(), name: "Face Pull", sets: "3", reps: "15", tempo: "2-1-2", rest: "60s" },
      { id: id(), name: "Barbell Curl", sets: "4", reps: "10-12", tempo: "2-0-2", rest: "60s" },
      { id: id(), name: "Incline DB Curl", sets: "3", reps: "12-15", tempo: "3-1-2", rest: "60s" },
    ],
  },
  {
    id: id(),
    name: "DAY 3 – LEG",
    label: "Chân – Mông – Core",
    burn: 380,
    note: "Ưu tiên kỹ thuật, biên độ chuẩn, core siết chặt.",
    exercises: [
      { id: id(), name: "Goblet Squat", sets: "4", reps: "10-12", tempo: "3-1-2", rest: "90s" },
      { id: id(), name: "DB RDL", sets: "4", reps: "10", tempo: "3-1-2", rest: "90s" },
      { id: id(), name: "DB Walking Lunge", sets: "3", reps: "12/chân", tempo: "2-0-2", rest: "60s" },
      { id: id(), name: "Glute Bridge / Hip Thrust", sets: "3", reps: "15", tempo: "2-1-2", rest: "75s" },
      { id: id(), name: "Standing Calf Raise", sets: "4", reps: "20", tempo: "2-1-2", rest: "45s" },
      { id: id(), name: "Plank + Side Plank", sets: "3 vòng", reps: "30s mỗi bên", tempo: "hold", rest: "30s" },
      { id: id(), name: "Hanging Leg Raise", sets: "3", reps: "15", tempo: "2-0-2", rest: "30s" },
    ],
  },
  {
    id: id(),
    name: "DAY 4 – PUSH 2",
    label: "Đổi góc đẩy – cô lập nhiều hơn",
    burn: 310,
    note: "Tập vừa đủ volume, không cần quá nhiều bài nặng liên tiếp.",
    exercises: [
      { id: id(), name: "Machine Chest Press", sets: "4", reps: "10-12", tempo: "2-0-2", rest: "75s" },
      { id: id(), name: "Incline Cable Fly", sets: "3", reps: "12-15", tempo: "2-1-2", rest: "60s" },
      { id: id(), name: "Arnold Press", sets: "4", reps: "8-10", tempo: "2-0-2", rest: "90s" },
      { id: id(), name: "Cable Lateral Raise", sets: "3", reps: "15", tempo: "2-1-2", rest: "45s" },
      { id: id(), name: "Overhead Rope Triceps", sets: "4", reps: "12", tempo: "2-0-2", rest: "60s" },
      { id: id(), name: "Bench Dip", sets: "3", reps: "15", tempo: "2-1-2", rest: "45s" },
    ],
  },
  {
    id: id(),
    name: "DAY 5 – PULL 2",
    label: "Đổi góc kéo – tăng volume",
    burn: 340,
    note: "Đổi góc kéo để dày lưng và thêm volume tay trước.",
    exercises: [
      { id: id(), name: "Wide Grip Lat Pulldown", sets: "4", reps: "12", tempo: "2-1-2", rest: "90s" },
      { id: id(), name: "Reverse Grip Barbell Row", sets: "4", reps: "10", tempo: "2-0-2", rest: "75s" },
      { id: id(), name: "Cable Straight Arm Pulldown", sets: "3", reps: "12-15", tempo: "2-1-2", rest: "60s" },
      { id: id(), name: "Incline DB Row", sets: "3", reps: "12", tempo: "3-1-2", rest: "60s" },
      { id: id(), name: "EZ Bar Curl (close grip)", sets: "3", reps: "12", tempo: "2-0-2", rest: "60s" },
      { id: id(), name: "Concentration Curl", sets: "3", reps: "15", tempo: "3-1-2", rest: "45s" },
    ],
  },
  {
    id: id(),
    name: "DAY 6 – LEG 2",
    label: "Mông – Đùi – Core nâng cao",
    burn: 390,
    note: "Buổi chân thứ hai thiên về unilateral + mông đùi sau.",
    exercises: [
      { id: id(), name: "Front Squat (Smith / DB)", sets: "4", reps: "10", tempo: "3-1-2", rest: "90s" },
      { id: id(), name: "Banded DB RDL", sets: "4", reps: "12", tempo: "3-1-2", rest: "90s" },
      { id: id(), name: "Bulgarian Split Squat", sets: "3", reps: "10/chân", tempo: "2-0-2", rest: "75s" },
      { id: id(), name: "Glute Kickback (Cable)", sets: "3", reps: "15 mỗi chân", tempo: "2-1-2", rest: "60s" },
      { id: id(), name: "Seated Calf Raise", sets: "4", reps: "15-20", tempo: "2-1-2", rest: "45s" },
      { id: id(), name: "Cable Crunch / Ab Rollout", sets: "3", reps: "15", tempo: "2-1-2", rest: "30s" },
    ],
  },
];

const presetFoods = [
  { id: id(), name: "Thịt bò nạc", kcal: 217, unit: "100g", protein: 26, carbs: 0, fat: 12 },
  { id: id(), name: "Cá hồi", kcal: 208, unit: "100g", protein: 20, carbs: 0, fat: 13 },
  { id: id(), name: "Rau củ luộc", kcal: 35, unit: "100g", protein: 2, carbs: 6, fat: 0.2 },
  { id: id(), name: "Rau củ xào", kcal: 80, unit: "100g", protein: 2, carbs: 8, fat: 4 },
  { id: id(), name: "Cơm trắng", kcal: 130, unit: "100g", protein: 2.4, carbs: 28, fat: 0.3 },
  { id: id(), name: "Thịt nướng", kcal: 250, unit: "100g", protein: 23, carbs: 4, fat: 15 },
  { id: id(), name: "Thịt chiên/rán", kcal: 310, unit: "100g", protein: 20, carbs: 8, fat: 22 },
  { id: id(), name: "Mì", kcal: 138, unit: "100g", protein: 4.5, carbs: 25, fat: 2 },
  { id: id(), name: "Rau củ quả", kcal: 45, unit: "100g", protein: 1.5, carbs: 9, fat: 0.2 },
  { id: id(), name: "Hoa quả", kcal: 60, unit: "100g", protein: 0.6, carbs: 15, fat: 0.2 },
  { id: id(), name: "Phở bò", kcal: 450, unit: "1 tô", protein: 25, carbs: 55, fat: 12 },
  { id: id(), name: "Bún bò / bún thịt", kcal: 500, unit: "1 tô", protein: 24, carbs: 62, fat: 16 },
  { id: id(), name: "Cháo canh", kcal: 430, unit: "1 tô", protein: 18, carbs: 62, fat: 11 },
  { id: id(), name: "Bò né", kcal: 650, unit: "1 phần", protein: 35, carbs: 28, fat: 38 },
  { id: id(), name: "Sốt vang", kcal: 360, unit: "1 phần", protein: 18, carbs: 20, fat: 22 },
  { id: id(), name: "Trứng gà", kcal: 70, unit: "1 quả", protein: 6, carbs: 0.6, fat: 5 },
  { id: id(), name: "Sữa chua không đường", kcal: 63, unit: "100g", protein: 5.3, carbs: 7, fat: 1.6 },
  { id: id(), name: "Yến mạch", kcal: 389, unit: "100g", protein: 16.9, carbs: 66.3, fat: 6.9 },
];

const initialData = {
  profile: {
    name: "SKINNY FAT → 65KG",
    bodyType: "Skinny fat",
    heightCm: 170,
    currentWeight: 72,
    targetWeight: TARGET_WEIGHT,
    planLossRateKgPerWeek: 0.4,
    note: "Mục tiêu: tăng cơ, giảm mỡ, bụng gọn hơn. Không nhịn ăn, không bỏ carb, ưu tiên tập kháng lực.",
  },
  selectedDate: todayKey(),
  progress: {
    weightLogsByDate: {
      [todayKey()]: 72,
    },
  },
  workout: {
    templates: presetTemplates,
    weeklySchedule: [
      { day: 1, templateId: presetTemplates[0].id, title: "T2 – Push" },
      { day: 2, templateId: presetTemplates[1].id, title: "T3 – Pull" },
      { day: 3, templateId: presetTemplates[2].id, title: "T4 – Leg" },
      { day: 4, templateId: presetTemplates[3].id, title: "T5 – Push 2" },
      { day: 5, templateId: presetTemplates[4].id, title: "T6 – Pull 2" },
      { day: 6, templateId: presetTemplates[5].id, title: "T7 – Leg 2" },
      { day: 0, templateId: null, title: "CN – Nghỉ / cardio nhẹ" },
    ],
    logsByDate: {},
  },
  nutrition: {
    foods: presetFoods,
    mealsByDate: {},
    waterByDate: {},
  },
};

function mergeSavedData(saved) {
  return {
    profile: {
      ...initialData.profile,
      ...(saved?.profile || {}),
      targetWeight: TARGET_WEIGHT,
      heightCm: Number(saved?.profile?.heightCm || initialData.profile.heightCm),
      currentWeight: Number(saved?.profile?.currentWeight || initialData.profile.currentWeight),
      planLossRateKgPerWeek: Number(saved?.profile?.planLossRateKgPerWeek || initialData.profile.planLossRateKgPerWeek),
    },
    selectedDate: saved?.selectedDate || initialData.selectedDate,
    progress: {
      ...initialData.progress,
      ...(saved?.progress || {}),
      weightLogsByDate: saved?.progress?.weightLogsByDate || initialData.progress.weightLogsByDate,
    },
    workout: {
      ...initialData.workout,
      ...(saved?.workout || {}),
      templates: saved?.workout?.templates || initialData.workout.templates,
      weeklySchedule: saved?.workout?.weeklySchedule || initialData.workout.weeklySchedule,
      logsByDate: saved?.workout?.logsByDate || {},
    },
    nutrition: {
      ...initialData.nutrition,
      ...(saved?.nutrition || {}),
      foods: saved?.nutrition?.foods || initialData.nutrition.foods,
      mealsByDate: saved?.nutrition?.mealsByDate || {},
      waterByDate: saved?.nutrition?.waterByDate || {},
    },
  };
}

function Badge({ children, soft = false }) {
  return (
    <div className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${soft ? "bg-white/10 text-white" : "bg-black text-white"}`}>
      {children}
    </div>
  );
}

function Panel({ title, subtitle, icon, children, actions, className = "" }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[30px] border border-white/60 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            {icon}
            <span>{title}</span>
          </div>
          {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
        </div>
        {actions}
      </div>
      {children}
    </motion.section>
  );
}

function Input(props) {
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 ${props.className || ""}`} />;
}

function Button({ children, onClick, variant = "dark", className = "", type = "button" }) {
  const styles =
    variant === "ghost"
      ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      : variant === "danger"
      ? "bg-red-600 text-white hover:opacity-90"
      : "bg-slate-950 text-white hover:opacity-90";
  return (
    <button type={type} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${styles} ${className}`}>
      {children}
    </button>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function Modal({ open, title, subtitle, onClose, children, width = "max-w-4xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className={`max-h-[90vh] w-full overflow-hidden rounded-[32px] bg-white shadow-2xl ${width}`}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <div className="text-lg font-bold text-slate-900">{title}</div>
            {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
          </div>
          <button onClick={onClose} className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-88px)] overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default function SkinnyFatTransformPlanner() {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(initialData);
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(null);
  const [activeScheduleDay, setActiveScheduleDay] = useState(new Date().getDay());
  const [editorOpen, setEditorOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [exerciseDraft, setExerciseDraft] = useState({ name: "", sets: "", reps: "", tempo: "", rest: "" });
  const [foodDraft, setFoodDraft] = useState({ name: "", kcal: 100, unit: "100g", protein: 0, carbs: 0, fat: 0 });
  const [mealDraft, setMealDraft] = useState({ foodId: initialData.nutrition.foods[0].id, servings: 1, note: "" });
  const [weightCheckIn, setWeightCheckIn] = useState(initialData.profile.currentWeight);

useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  return () => subscription.unsubscribe();
}, []);

useEffect(() => {
  if (!session?.user) return;

  const init = async () => {
    await seedInitialData(session.user.id, initialData);

    const remoteData = await loadUserData(session.user.id);

    setData((prev) => ({
      ...prev,
      ...remoteData,
      profile: remoteData.profile || prev.profile,
    }));

    setMounted(true);
  };

  init();
}, [session]);

useEffect(() => {
  if (!mounted || !session?.user) return;

  const timer = setTimeout(() => {
    saveUserData(session.user.id, data);
  }, 500);

  return () => clearTimeout(timer);
}, [data, mounted, session]);

  useEffect(() => {
    const dateDay = parseDateKey(data.selectedDate).getDay();
    setActiveScheduleDay(dateDay);
  }, [data.selectedDate]);

  useEffect(() => {
    const existing = data.progress.weightLogsByDate?.[data.selectedDate];
    setWeightCheckIn(Number(existing || data.profile.currentWeight || 0));
  }, [data.selectedDate, data.progress.weightLogsByDate, data.profile.currentWeight]);

  const selectedDate = data.selectedDate;
  const selectedDay = parseDateKey(selectedDate).getDay();
  const orderedSchedule = [...data.workout.weeklySchedule].sort((a, b) => (a.day === 0 ? 7 : a.day) - (b.day === 0 ? 7 : b.day));
  const selectedSchedule = data.workout.weeklySchedule.find((x) => x.day === activeScheduleDay);
  const selectedTemplate = data.workout.templates.find((x) => x.id === selectedSchedule?.templateId) || null;
  const currentMeals = data.nutrition.mealsByDate[selectedDate] || [];
  const currentWater = data.nutrition.waterByDate[selectedDate] || 0;
  const quickDates = buildDateWindow(selectedDate, 9);

  const currentWeight = Number(data.profile.currentWeight || 0);
  const heightCm = Number(data.profile.heightCm || 0);
  const targetWeight = TARGET_WEIGHT;
  const bmi = heightCm > 0 ? round(currentWeight / ((heightCm / 100) ** 2), 1) : 0;
  const bmrEstimate = round((10 * currentWeight) + (6.25 * heightCm) - (5 * ASSUMED_AGE) + SEX_OFFSET, 0);
  const averageWorkoutBurn = round(
    orderedSchedule.reduce((sum, item) => {
      const template = data.workout.templates.find((t) => t.id === item.templateId);
      return sum + Number(template?.burn || 0);
    }, 0) / 7,
    0
  );
  const dailyBaseOut = round(bmrEstimate * 1.2, 0);
  const maintenanceKcal = round(dailyBaseOut + averageWorkoutBurn, 0);
  const proteinTarget = round(currentWeight * PROTEIN_PER_KG, 0);
  const fatTarget = round(currentWeight * FAT_PER_KG, 0);

  const requestedLossRate = Number(data.profile.planLossRateKgPerWeek || 0.4);
  const recommendedFloorCalories = round(Math.max(bmrEstimate * 1.15, 1600), 0);
  const safeMaxLossRate = round(Math.max(0.2, ((maintenanceKcal - recommendedFloorCalories) * 7) / 7700), 2);
  const effectiveLossRate = round(Math.min(requestedLossRate, safeMaxLossRate), 2);
  const targetDailyDeficit = round((effectiveLossRate * 7700) / 7, 0);
  const calorieTarget = round(Math.max(recommendedFloorCalories, maintenanceKcal - targetDailyDeficit), 0);
  const carbTarget = round(Math.max(0, (calorieTarget - (proteinTarget * 4) - (fatTarget * 9)) / 4), 0);

  const kcalIntake = round(
    currentMeals.reduce((sum, meal) => {
      const food = data.nutrition.foods.find((f) => f.id === meal.foodId);
      return sum + (food ? food.kcal * meal.servings : 0);
    }, 0),
    0
  );

  const proteinIntake = round(
    currentMeals.reduce((sum, meal) => {
      const food = data.nutrition.foods.find((f) => f.id === meal.foodId);
      return sum + (food ? food.protein * meal.servings : 0);
    }, 0),
    1
  );

  const carbsIntake = round(
    currentMeals.reduce((sum, meal) => {
      const food = data.nutrition.foods.find((f) => f.id === meal.foodId);
      return sum + (food ? food.carbs * meal.servings : 0);
    }, 0),
    1
  );

  const fatIntake = round(
    currentMeals.reduce((sum, meal) => {
      const food = data.nutrition.foods.find((f) => f.id === meal.foodId);
      return sum + (food ? food.fat * meal.servings : 0);
    }, 0),
    1
  );

  const loggedWorkout = data.workout.logsByDate[selectedDate] || {
    templateId: data.workout.weeklySchedule.find((x) => x.day === selectedDay)?.templateId || null,
    extraBurn: 0,
    done: false,
    note: "",
  };

  const workoutTemplate = data.workout.templates.find((t) => t.id === loggedWorkout.templateId) || null;
  const workoutBurn = (workoutTemplate?.burn || 0) + Number(loggedWorkout.extraBurn || 0);
  const kcalOut = dailyBaseOut + workoutBurn;
  const deficit = kcalOut - kcalIntake;

  const projectedWeeks = effectiveLossRate > 0 ? Math.ceil(Math.max(0, currentWeight - targetWeight) / effectiveLossRate) : 0;
  const estimatedDate = projectedWeeks > 0 ? addDays(selectedDate, projectedWeeks * 7) : selectedDate;

  const weightLogEntries = useMemo(
    () =>
      Object.entries(data.progress.weightLogsByDate || {})
        .filter(([, value]) => Number(value) > 0)
        .sort(([a], [b]) => compareDateKeys(a, b)),
    [data.progress.weightLogsByDate]
  );

  const progressChartData = useMemo(() => {
    const dateSet = new Set();
    weightLogEntries.forEach(([key]) => dateSet.add(key));
    dateSet.add(selectedDate);
    dateSet.add(estimatedDate);

    const projectionWeeks = Math.max(projectedWeeks, 1);
    for (let week = 0; week <= projectionWeeks; week += 1) {
      dateSet.add(addDays(selectedDate, week * 7));
    }

    const sortedKeys = Array.from(dateSet).sort(compareDateKeys);
    const actualMap = Object.fromEntries(weightLogEntries);

    return sortedKeys.map((key) => {
      const diff = daysBetween(selectedDate, key);
      const projected = diff >= 0 ? round(Math.max(targetWeight, currentWeight - ((effectiveLossRate / 7) * diff)), 1) : null;
      return {
        label: dateLabel(key),
        fullDate: longDateLabel(key),
        actual: actualMap[key] ? Number(actualMap[key]) : null,
        projected,
      };
    });
  }, [weightLogEntries, selectedDate, estimatedDate, projectedWeeks, currentWeight, effectiveLossRate, targetWeight]);

  const recentWeightLogs = [...weightLogEntries].reverse().slice(0, 6);

  const updateProfile = (field, value) => setData((prev) => ({ ...prev, profile: { ...prev.profile, [field]: value } }));

  const setCurrentWeight = (value) => {
    const numericValue = Number(value || 0);
    setData((prev) => ({
      ...prev,
      profile: { ...prev.profile, currentWeight: numericValue },
      progress: {
        ...prev.progress,
        weightLogsByDate: {
          ...prev.progress.weightLogsByDate,
          [prev.selectedDate]: numericValue,
        },
      },
    }));
  };

  const saveWeightCheckIn = () => {
    const numericValue = Number(weightCheckIn || 0);
    if (!numericValue) return;
    setData((prev) => {
      const nextLogs = {
        ...prev.progress.weightLogsByDate,
        [prev.selectedDate]: numericValue,
      };
      const latestKey = Object.keys(nextLogs).sort(compareDateKeys).at(-1);
      return {
        ...prev,
        profile: {
          ...prev.profile,
          currentWeight: prev.selectedDate === latestKey ? numericValue : prev.profile.currentWeight,
        },
        progress: {
          ...prev.progress,
          weightLogsByDate: nextLogs,
        },
      };
    });
  };

  const updateWorkoutLog = (field, value) =>
    setData((prev) => ({
      ...prev,
      workout: {
        ...prev.workout,
        logsByDate: {
          ...prev.workout.logsByDate,
          [selectedDate]: {
            ...(prev.workout.logsByDate[selectedDate] || {
              templateId: prev.workout.weeklySchedule.find((x) => x.day === selectedDay)?.templateId || null,
              extraBurn: 0,
              done: false,
              note: "",
            }),
            [field]: value,
          },
        },
      },
    }));

  const updateTemplate = (templateId, field, value) =>
    setData((prev) => ({
      ...prev,
      workout: {
        ...prev.workout,
        templates: prev.workout.templates.map((t) => (t.id === templateId ? { ...t, [field]: field === "burn" ? Number(value || 0) : value } : t)),
      },
    }));

  const updateScheduleItem = (day, field, value) =>
    setData((prev) => ({
      ...prev,
      workout: {
        ...prev.workout,
        weeklySchedule: prev.workout.weeklySchedule.map((item) => (item.day === day ? { ...item, [field]: value } : item)),
      },
    }));

  const addExercise = () => {
    if (!exerciseDraft.name.trim() || !selectedTemplate) return;
    setData((prev) => ({
      ...prev,
      workout: {
        ...prev.workout,
        templates: prev.workout.templates.map((t) =>
          t.id === selectedTemplate.id
            ? { ...t, exercises: [...t.exercises, { id: id(), ...exerciseDraft, name: exerciseDraft.name.trim() }] }
            : t
        ),
      },
    }));
    setExerciseDraft({ name: "", sets: "", reps: "", tempo: "", rest: "" });
    setAddExerciseOpen(false);
  };

  const updateExercise = (templateId, exerciseId, field, value) =>
    setData((prev) => ({
      ...prev,
      workout: {
        ...prev.workout,
        templates: prev.workout.templates.map((t) =>
          t.id === templateId ? { ...t, exercises: t.exercises.map((e) => (e.id === exerciseId ? { ...e, [field]: value } : e)) } : t
        ),
      },
    }));

  const removeExercise = (templateId, exerciseId) =>
    setData((prev) => ({
      ...prev,
      workout: {
        ...prev.workout,
        templates: prev.workout.templates.map((t) =>
          t.id === templateId ? { ...t, exercises: t.exercises.filter((e) => e.id !== exerciseId) } : t
        ),
      },
    }));

  const setMeal = () => {
    if (!mealDraft.foodId) return;
    const newMeal = { id: id(), foodId: mealDraft.foodId, servings: Number(mealDraft.servings || 0), note: mealDraft.note };
    setData((prev) => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        mealsByDate: { ...prev.nutrition.mealsByDate, [selectedDate]: [...(prev.nutrition.mealsByDate[selectedDate] || []), newMeal] },
      },
    }));
    setMealDraft((p) => ({ ...p, servings: 1, note: "" }));
  };

  const removeMeal = (mealId) =>
    setData((prev) => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        mealsByDate: { ...prev.nutrition.mealsByDate, [selectedDate]: (prev.nutrition.mealsByDate[selectedDate] || []).filter((m) => m.id !== mealId) },
      },
    }));

  const addFood = () => {
    if (!foodDraft.name.trim()) return;
    const newFood = {
      id: id(),
      ...foodDraft,
      name: foodDraft.name.trim(),
      kcal: Number(foodDraft.kcal || 0),
      protein: Number(foodDraft.protein || 0),
      carbs: Number(foodDraft.carbs || 0),
      fat: Number(foodDraft.fat || 0),
    };
    setData((prev) => ({ ...prev, nutrition: { ...prev.nutrition, foods: [...prev.nutrition.foods, newFood] } }));
    setFoodDraft({ name: "", kcal: 100, unit: "100g", protein: 0, carbs: 0, fat: 0 });
  };

  const updateFood = (foodId, field, value) =>
    setData((prev) => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        foods: prev.nutrition.foods.map((f) =>
          f.id === foodId ? { ...f, [field]: ["kcal", "protein", "carbs", "fat"].includes(field) ? Number(value || 0) : value } : f
        ),
      },
    }));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skinny-fat-workout-planner-65kg.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "overview", label: "Tổng quan", icon: <BarChart3 className="h-4 w-4" /> },    { id: "workout", label: "Workout", icon: <Dumbbell className="h-4 w-4" /> },
    { id: "nutrition", label: "Dinh dưỡng", icon: <Apple className="h-4 w-4" /> },
    { id: "settings", label: "Tiến trình", icon: <Pencil className="h-4 w-4" /> },
  ];

  if (!session) {
  return <Auth />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#eef2ff_35%,_#f8fafc_100%)] p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 overflow-hidden rounded-[40px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
          <div className="absolute -right-10 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.4fr,1fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge soft>🎯 Mục tiêu: {currentWeight}kg → {targetWeight}kg</Badge>
                <Badge soft>⚡ {effectiveLossRate} kg/tuần</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">THOÁT SKINNY FAT</h1>
              <div className="mt-2 max-w-2xl text-sm text-white/75 md:text-base">
                Tôi đã bỏ kiểu chỉ xem ngày trước – hôm nay – ngày sau. Giờ bạn có thể xem cả quá trình bằng dải ngày nhanh, picker ngày bất kỳ, check-in cân nặng theo mốc và biểu đồ full timeline tới 65kg.
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="ghost" className="border-white/15 bg-white/10 text-white" onClick={() => setData((p) => ({ ...p, selectedDate: addDays(p.selectedDate, -30) }))}><ChevronsLeft className="h-4 w-4" />-30 ngày</Button>
                <Button variant="ghost" className="border-white/15 bg-white/10 text-white" onClick={() => setData((p) => ({ ...p, selectedDate: addDays(p.selectedDate, -7) }))}>-7 ngày</Button>
                <Button variant="ghost" className="border-white/15 bg-white/10 text-white" onClick={() => setData((p) => ({ ...p, selectedDate: todayKey() }))}>Hôm nay</Button>
                <Button variant="ghost" className="border-white/15 bg-white/10 text-white" onClick={() => setData((p) => ({ ...p, selectedDate: addDays(p.selectedDate, 7) }))}>+7 ngày</Button>
                <Button variant="ghost" className="border-white/15 bg-white/10 text-white" onClick={() => setData((p) => ({ ...p, selectedDate: addDays(p.selectedDate, 30) }))}>+30 ngày<ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur"><div className="text-2xl font-bold">{kcalIntake}</div><div className="text-xs text-white/70">Calo nạp</div></div>
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur"><div className="text-2xl font-bold">{kcalOut}</div><div className="text-xs text-white/70">Calo tiêu</div></div>
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur"><div className="text-2xl font-bold">{deficit}</div><div className="text-xs text-white/70">Thâm hụt hôm nay</div></div>
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur"><div className="text-lg font-bold">{estimatedDate}</div><div className="text-xs text-white/70">Dự kiến chạm 65kg</div></div>
            </div>
          </div>
        </motion.div>

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-3xl border border-white/60 bg-white/80 p-2 shadow-sm backdrop-blur">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${tab === item.id ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <Input type="date" value={selectedDate} onChange={(e) => setData((p) => ({ ...p, selectedDate: e.target.value }))} className="py-2" />
            <Button onClick={exportData}>Xuất dữ liệu</Button>
          </div>
        </div>

        <div className="mb-6 overflow-auto rounded-3xl border border-white/60 bg-white/80 p-3 shadow-sm backdrop-blur">
          <div className="flex min-w-max gap-2">
            {quickDates.map((key) => {
              const isSelected = key === selectedDate;
              const hasWeightLog = Boolean(data.progress.weightLogsByDate?.[key]);
              return (
                <button
                  key={key}
                  onClick={() => setData((p) => ({ ...p, selectedDate: key }))}
                  className={`min-w-[84px] rounded-2xl border px-3 py-3 text-center transition ${isSelected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                >
                  <div className="text-xs opacity-70">{days[parseDateKey(key).getDay()]}</div>
                  <div className="mt-1 text-sm font-semibold">{dateLabel(key)}</div>
                  <div className={`mt-2 text-[10px] ${isSelected ? "text-white/70" : hasWeightLog ? "text-emerald-600" : "text-slate-400"}`}>
                    {hasWeightLog ? "Có check-in" : "Chưa log"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-[1.08fr,0.92fr]">
            <div className="space-y-6">
              <Panel icon={<BarChart3 className="h-5 w-5" />} title="TOÀN BỘ LỘ TRÌNH XUỐNG 65KG" subtitle="Đường sáng là mục tiêu dự kiến, đường đậm là cân nặng bạn đã check-in thật">
                <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Stat label="Hiện tại" value={`${currentWeight}kg`} />
                  <Stat label="Mục tiêu" value={`${targetWeight}kg`} />
                  <Stat label="Tốc độ" value={`${effectiveLossRate}kg/tuần`} hint="Đã tự giới hạn an toàn" />
                  <Stat label="Còn lại" value={`${round(Math.max(0, currentWeight - targetWeight), 1)}kg`} />
                </div>
                <div className="h-[340px] w-full rounded-[28px] border border-slate-200 bg-white p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressChartData} margin={{ top: 20, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#64748b" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#64748b" domain={[Math.floor(Math.min(targetWeight, currentWeight) - 2), Math.ceil(Math.max(targetWeight, currentWeight) + 2)]} />
                      <Tooltip
                        formatter={(value, name) => [`${value} kg`, name === "actual" ? "Cân nặng thực tế" : "Cân nặng dự kiến"]}
                        labelFormatter={(value, payload) => payload?.[0]?.payload?.fullDate || value}
                      />
                      <ReferenceLine y={targetWeight} stroke="#0f172a" strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="projected" stroke="#94a3b8" strokeWidth={3} dot={{ r: 3 }} connectNulls />
                      <Line type="monotone" dataKey="actual" stroke="#0f172a" strokeWidth={3} dot={{ r: 5 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                  Bạn có thể xem cả quá trình bằng biểu đồ này, không còn bị giới hạn ở 3 ngày nữa. Chỉ cần chọn ngày bất kỳ ở dải ngày phía trên hoặc nhập check-in cân nặng để đường thực tế được nối dần theo thời gian.
                </div>
              </Panel>

              <Panel icon={<CalendarDays className="h-5 w-5" />} title="LỊCH TẬP CHUẨN CHO BẠN" subtitle="Bấm vào từng DAY để xem bài tập ngay bên cạnh">
                <div className="grid gap-3 md:grid-cols-2">
                  {orderedSchedule.map((item) => {
                    const temp = data.workout.templates.find((t) => t.id === item.templateId);
                    return (
                      <button
                        key={item.day}
                        onClick={() => {
                          setActiveScheduleDay(item.day);
                          setTab("workout");
                        }}
                        className={`rounded-3xl p-4 text-left transition ${item.day === selectedDay ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"}`}
                      >
                        <div className="font-bold">{item.title}</div>
                        <div className={`text-sm ${item.day === selectedDay ? "text-white/75" : "text-slate-500"}`}>{temp ? `${temp.name} • ${temp.label}` : "Nghỉ / cardio nhẹ / đi bộ"}</div>
                      </button>
                    );
                  })}
                </div>
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel icon={<Scale className="h-5 w-5" />} title="CHECK-IN CÂN NẶNG" subtitle={`Ngày đang xem: ${longDateLabel(selectedDate)}`}>
                <div className="grid gap-3 md:grid-cols-[1fr,auto] md:items-end">
                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">Cân nặng của ngày này</div>
                    <Input type="number" value={weightCheckIn} onChange={(e) => setWeightCheckIn(e.target.value)} />
                  </div>
                  <Button onClick={saveWeightCheckIn}><Check className="h-4 w-4" />Lưu check-in</Button>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Stat label="BMI" value={bmi} hint={bmi < 18.5 ? "Hơi thiếu cân" : bmi < 23 ? "Khá gọn" : bmi < 25 ? "Dễ skinny fat" : "Cần siết kỹ"} />
                  <Stat label="BMR" value={bmrEstimate} hint="Ước tính" />
                  <Stat label="Duy trì" value={maintenanceKcal} hint="kcal/ngày" />
                  <Stat label="Mục tiêu" value={calorieTarget} hint="kcal/ngày" />
                </div>
                <div className="mt-5 rounded-3xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><Sparkles className="h-4 w-4" />Các mốc cân gần nhất</div>
                  <div className="space-y-2">
                    {recentWeightLogs.map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                        <span className="text-slate-600">{longDateLabel(key)}</span>
                        <span className="font-semibold text-slate-950">{value} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel icon={<Apple className="h-5 w-5" />} title="ĂN SAO CHO THOÁT BỤNG MỠ?" subtitle="Phần mềm đã gắn sẵn các món bạn hay ăn">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Stat label="Protein" value={`${proteinIntake}g`} hint={`mục tiêu ${proteinTarget}g`} />
                  <Stat label="Carbs" value={`${carbsIntake}g`} hint={`mục tiêu ${carbTarget}g`} />
                  <Stat label="Fat" value={`${fatIntake}g`} hint={`mục tiêu ${fatTarget}g`} />
                  <Stat label="Nước" value={`${currentWater}ml`} />
                </div>
                <div className="mt-4 rounded-3xl bg-slate-950 p-4 text-sm text-white">Gợi ý ưu tiên: bò nạc, cá hồi, trứng, rau củ, cơm trắng vừa đủ, các món nước như phở/bún/cháo canh vẫn ăn được nhưng phải log khẩu phần.</div>
              </Panel>
            </div>
          </div>
        )}

        {tab === "workout" && (
          <div className="grid gap-6 lg:grid-cols-[0.85fr,1.15fr]">
            <Panel icon={<Dumbbell className="h-5 w-5" />} title="CHỌN DAY TẬP" subtitle="Nhấn vào DAY nào là phần bài tập hiện ngay, không cần kéo xuống">
              <div className="space-y-3">
                {orderedSchedule.map((item) => {
                  const temp = data.workout.templates.find((t) => t.id === item.templateId);
                  return (
                    <button
                      key={item.day}
                      onClick={() => setActiveScheduleDay(item.day)}
                      className={`w-full rounded-3xl p-4 text-left transition ${activeScheduleDay === item.day ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"}`}
                    >
                      <div className="font-bold">{item.title}</div>
                      <div className={`text-sm ${activeScheduleDay === item.day ? "text-white/75" : "text-slate-500"}`}>{temp ? temp.label : "Nghỉ / cardio nhẹ"}</div>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel
              icon={<Target className="h-5 w-5" />}
              title={selectedSchedule?.title || "DAY chưa chọn"}
              subtitle={selectedTemplate ? `${selectedTemplate.name} • ${selectedTemplate.label}` : "Ngày nghỉ / cardio nhẹ / đi bộ"}
              actions={selectedTemplate ? <Button onClick={() => setEditorOpen(true)}><Pencil className="h-4 w-4" />Chỉnh buổi này</Button> : null}
            >
              {!selectedTemplate && <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Ngày này hiện đang để nghỉ. Bạn có thể vào chỉnh buổi này để gán template tập khác.</div>}

              {selectedTemplate && (
                <>
                  <div className="mb-5 rounded-3xl bg-gradient-to-r from-slate-950 to-slate-800 p-4 text-white">
                    <div className="text-sm font-semibold">Lưu ý buổi tập</div>
                    <div className="mt-1 text-sm text-white/80">{selectedTemplate.note}</div>
                    <div className="mt-3 text-xs text-white/60">Ước tính đốt: {selectedTemplate.burn} kcal</div>
                  </div>

                  <div className="space-y-3">
                    {selectedTemplate.exercises.map((ex, index) => (
                      <div key={ex.id} className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4">
                        <div className="mb-2 text-lg font-bold text-slate-900">{index + 1}. {ex.name}</div>
                        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-4">
                          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm"><span className="font-semibold text-slate-900">Sets:</span> {ex.sets}</div>
                          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm"><span className="font-semibold text-slate-900">Reps:</span> {ex.reps}</div>
                          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm"><span className="font-semibold text-slate-900">Tempo:</span> {ex.tempo}</div>
                          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm"><span className="font-semibold text-slate-900">Rest:</span> {ex.rest}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>
          </div>
        )}

        {tab === "nutrition" && (
          <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
            <div className="space-y-6">
              <Panel icon={<Apple className="h-5 w-5" />} title="THƯ VIỆN MÓN ĂN HẰNG NGÀY" subtitle="Có sẵn bò, cá hồi, rau, cơm, món nước Việt Nam, món vỉa hè... và bạn sửa được hết">
                <div className="grid gap-3 md:grid-cols-3">
                  <Input placeholder="Tên món" value={foodDraft.name} onChange={(e) => setFoodDraft((p) => ({ ...p, name: e.target.value }))} className="md:col-span-2" />
                  <Input placeholder="Đơn vị" value={foodDraft.unit} onChange={(e) => setFoodDraft((p) => ({ ...p, unit: e.target.value }))} />
                  <Input type="number" placeholder="kcal" value={foodDraft.kcal} onChange={(e) => setFoodDraft((p) => ({ ...p, kcal: e.target.value }))} />
                  <Input type="number" placeholder="protein" value={foodDraft.protein} onChange={(e) => setFoodDraft((p) => ({ ...p, protein: e.target.value }))} />
                  <Input type="number" placeholder="carbs" value={foodDraft.carbs} onChange={(e) => setFoodDraft((p) => ({ ...p, carbs: e.target.value }))} />
                  <Input type="number" placeholder="fat" value={foodDraft.fat} onChange={(e) => setFoodDraft((p) => ({ ...p, fat: e.target.value }))} />
                </div>
                <div className="mt-4"><Button onClick={addFood}><Plus className="h-4 w-4" />Thêm món</Button></div>
                <div className="mt-4 max-h-[540px] space-y-3 overflow-auto pr-1">
                  {data.nutrition.foods.map((food) => (
                    <div key={food.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="grid gap-3 md:grid-cols-[1.5fr,0.8fr,0.7fr,0.7fr,0.7fr,0.7fr]">
                        <Input value={food.name} onChange={(e) => updateFood(food.id, "name", e.target.value)} />
                        <Input value={food.unit} onChange={(e) => updateFood(food.id, "unit", e.target.value)} />
                        <Input type="number" value={food.kcal} onChange={(e) => updateFood(food.id, "kcal", e.target.value)} />
                        <Input type="number" value={food.protein} onChange={(e) => updateFood(food.id, "protein", e.target.value)} />
                        <Input type="number" value={food.carbs} onChange={(e) => updateFood(food.id, "carbs", e.target.value)} />
                        <Input type="number" value={food.fat} onChange={(e) => updateFood(food.id, "fat", e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel icon={<Flame className="h-5 w-5" />} title="LOG ĂN UỐNG THEO NGÀY" subtitle="Nhập món, khẩu phần, phần mềm tự tính calories và macros">
                <div className="grid gap-3 md:grid-cols-3">
                  <select value={mealDraft.foodId} onChange={(e) => setMealDraft((p) => ({ ...p, foodId: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none md:col-span-2">
                    {data.nutrition.foods.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.unit})</option>)}
                  </select>
                  <Input type="number" value={mealDraft.servings} onChange={(e) => setMealDraft((p) => ({ ...p, servings: e.target.value }))} placeholder="Khẩu phần" />
                </div>
                <div className="mt-3 flex gap-3">
                  <Input value={mealDraft.note} onChange={(e) => setMealDraft((p) => ({ ...p, note: e.target.value }))} placeholder="Ghi chú" />
                  <Button onClick={setMeal}><Plus className="h-4 w-4" />Thêm</Button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Stat label="Calories" value={kcalIntake} />
                  <Stat label="Protein" value={`${proteinIntake}g`} />
                  <Stat label="Carbs" value={`${carbsIntake}g`} />
                  <Stat label="Fat" value={`${fatIntake}g`} />
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                  <GlassWater className="h-5 w-5 text-slate-500" />
                  <div className="text-sm font-semibold text-slate-600">Nước uống</div>
                  <Input type="number" value={currentWater} onChange={(e) => setData((prev) => ({ ...prev, nutrition: { ...prev.nutrition, waterByDate: { ...prev.nutrition.waterByDate, [selectedDate]: Number(e.target.value || 0) } } }))} className="max-w-[140px]" />
                  <div className="text-sm text-slate-500">ml</div>
                </div>

                <div className="mt-4 space-y-3">
                  {currentMeals.map((meal) => {
                    const food = data.nutrition.foods.find((f) => f.id === meal.foodId);
                    return (
                      <div key={meal.id} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                        <div>
                          <div className="font-bold text-slate-900">{food?.name || "Món đã xóa"}</div>
                          <div className="text-sm text-slate-500">{meal.servings} khẩu phần • {food ? round(food.kcal * meal.servings, 0) : 0} kcal</div>
                          {meal.note ? <div className="text-xs text-slate-400">{meal.note}</div> : null}
                        </div>
                        <Button variant="danger" onClick={() => removeMeal(meal.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="grid gap-6 lg:grid-cols-[0.96fr,1.04fr]">
            <Panel icon={<Pencil className="h-5 w-5" />} title="THÔNG SỐ CÁ NHÂN" subtitle="Giờ bạn có thể nhìn toàn bộ lộ trình, không còn giới hạn 3 ngày. Hai ô chỉnh chính vẫn là chiều cao và cân nặng hiện tại.">
              <div className="mb-5 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                App đang dùng chiều cao + cân nặng hiện tại + lịch tập hiện có để ước tính calories duy trì, calories mục tiêu, protein, fat, carbs và thời gian xuống 65kg một cách thực tế hơn.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-700">Chiều cao (cm)</div>
                  <div className="mb-2 text-xs text-slate-500">Đổi chiều cao thì BMI, BMR, calories duy trì và biểu đồ sẽ đổi theo.</div>
                  <Input type="number" value={data.profile.heightCm} onChange={(e) => updateProfile("heightCm", Number(e.target.value || 0))} />
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-700">Cân nặng hiện tại (kg)</div>
                  <div className="mb-2 text-xs text-slate-500">Đây là mốc hiện tại của bạn. Khi đổi số này, biểu đồ dự kiến sẽ tính lại từ đầu.</div>
                  <Input type="number" value={data.profile.currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                <Stat label="Mục tiêu cố định" value={`${targetWeight}kg`} hint="Mốc đích của plan" />
                <Stat label="BMI hiện tại" value={bmi} hint="Tính từ chiều cao + cân nặng" />
                <Stat label="BMR ước tính" value={`${bmrEstimate}`} hint="Giả định nam 22 tuổi" />
                <Stat label="Calories duy trì" value={`${maintenanceKcal}`} hint="Cả lịch tập hiện tại" />
                <Stat label="Calories mục tiêu" value={`${calorieTarget}`} hint="Sau khi trừ thâm hụt" />
                <Stat label="Thâm hụt/ngày" value={`${targetDailyDeficit}`} hint={`~${effectiveLossRate}kg/tuần`} />
                <Stat label="Protein mục tiêu" value={`${proteinTarget}g`} hint="2.2g/kg" />
                <Stat label="Fat mục tiêu" value={`${fatTarget}g`} hint="0.8g/kg" />
                <Stat label="Carb mục tiêu" value={`${carbTarget}g`} hint="Calories còn lại" />
              </div>
            </Panel>

            <Panel icon={<BarChart3 className="h-5 w-5" />} title="BIỂU ĐỒ TOÀN QUÁ TRÌNH" subtitle="Có cả timeline dự kiến lẫn check-in thực tế, nên nhìn được hành trình thật sự chứ không chỉ vài ngày gần nhất">
              <div className="mb-5 rounded-3xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span className="font-semibold text-slate-800">Tốc độ giảm dự kiến</span>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">{effectiveLossRate} kg/tuần</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.8"
                  step="0.05"
                  value={requestedLossRate}
                  onChange={(e) => updateProfile("planLossRateKgPerWeek", Number(e.target.value))}
                  className="w-full"
                />
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>Chậm nhưng giữ cơ tốt</span>
                  <span>Nhanh hơn</span>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Mức an toàn tối đa theo công thức hiện tại: khoảng {safeMaxLossRate} kg/tuần. Nếu kéo cao hơn mức này, app sẽ tự giới hạn để biểu đồ chân thực hơn.
                </div>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat label="Bắt đầu" value={`${currentWeight}kg`} />
                <Stat label="Mục tiêu" value={`${targetWeight}kg`} />
                <Stat label="Còn lại" value={`${round(Math.max(0, currentWeight - targetWeight), 1)}kg`} />
                <Stat label="Dự kiến đạt" value={estimatedDate} hint={`${projectedWeeks} tuần`} />
              </div>

              <div className="h-[360px] w-full rounded-[28px] border border-slate-200 bg-white p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressChartData} margin={{ top: 20, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#64748b" domain={[Math.floor(Math.min(targetWeight, currentWeight) - 2), Math.ceil(Math.max(targetWeight, currentWeight) + 2)]} />
                    <Tooltip
                      formatter={(value, name) => [`${value} kg`, name === "actual" ? "Cân nặng thực tế" : "Cân nặng dự kiến"]}
                      labelFormatter={(value, payload) => payload?.[0]?.payload?.fullDate || value}
                    />
                    <ReferenceLine y={targetWeight} stroke="#0f172a" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="projected" stroke="#94a3b8" strokeWidth={3} dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="actual" stroke="#0f172a" strokeWidth={3} dot={{ r: 5 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 p-4 text-sm text-slate-600">
                Đường xám là quỹ đạo dự kiến. Đường đen là các mốc cân bạn đã thật sự check-in. Càng dùng lâu, biểu đồ này càng thể hiện đúng “cả quá trình” thay vì chỉ vài ngày gần nhất.
              </div>
            </Panel>
          </div>
        )}

        <Modal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={selectedSchedule ? `Chỉnh ${selectedSchedule.title}` : "Chỉnh buổi tập"}
          subtitle="Phần thêm bài tập đã được tách riêng sang popup riêng để giao diện gọn hơn"
        >
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-600">Tiêu đề DAY</div>
                <Input value={selectedSchedule?.title || ""} onChange={(e) => updateScheduleItem(activeScheduleDay, "title", e.target.value)} />
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-600">Gán template</div>
                <select
                  value={selectedSchedule?.templateId || ""}
                  onChange={(e) => updateScheduleItem(activeScheduleDay, "templateId", e.target.value || null)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                >
                  <option value="">Nghỉ / cardio nhẹ</option>
                  {data.workout.templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {selectedTemplate ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input value={selectedTemplate.name} onChange={(e) => updateTemplate(selectedTemplate.id, "name", e.target.value)} />
                  <Input value={selectedTemplate.label} onChange={(e) => updateTemplate(selectedTemplate.id, "label", e.target.value)} />
                  <Input type="number" value={selectedTemplate.burn} onChange={(e) => updateTemplate(selectedTemplate.id, "burn", e.target.value)} />
                </div>

                <textarea value={selectedTemplate.note} onChange={(e) => updateTemplate(selectedTemplate.id, "note", e.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 bg-white p-4 outline-none focus:border-slate-400" />

                <div className="flex justify-end">
                  <Button onClick={() => setAddExerciseOpen(true)}><Plus className="h-4 w-4" />Thêm bài tập</Button>
                </div>

                <div className="space-y-3">
                  {selectedTemplate.exercises.map((ex, index) => (
                    <div key={ex.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="mb-3 font-bold">{index + 1}. {ex.name}</div>
                      <div className="grid gap-3 md:grid-cols-[1.6fr,0.7fr,0.9fr,0.8fr,0.8fr,auto]">
                        <Input value={ex.name} onChange={(e) => updateExercise(selectedTemplate.id, ex.id, "name", e.target.value)} />
                        <Input value={ex.sets} onChange={(e) => updateExercise(selectedTemplate.id, ex.id, "sets", e.target.value)} />
                        <Input value={ex.reps} onChange={(e) => updateExercise(selectedTemplate.id, ex.id, "reps", e.target.value)} />
                        <Input value={ex.tempo} onChange={(e) => updateExercise(selectedTemplate.id, ex.id, "tempo", e.target.value)} />
                        <Input value={ex.rest} onChange={(e) => updateExercise(selectedTemplate.id, ex.id, "rest", e.target.value)} />
                        <Button variant="danger" onClick={() => removeExercise(selectedTemplate.id, ex.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Ngày này đang để nghỉ. Gán template trước rồi mới chỉnh được bài tập.</div>
            )}
          </div>
        </Modal>

        <Modal
          open={addExerciseOpen}
          onClose={() => setAddExerciseOpen(false)}
          title="Thêm bài tập mới"
          subtitle={selectedTemplate ? `Thêm vào ${selectedTemplate.name}` : ""}
          width="max-w-2xl"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Tên bài" value={exerciseDraft.name} onChange={(e) => setExerciseDraft((p) => ({ ...p, name: e.target.value }))} className="md:col-span-2" />
            <Input placeholder="Sets" value={exerciseDraft.sets} onChange={(e) => setExerciseDraft((p) => ({ ...p, sets: e.target.value }))} />
            <Input placeholder="Reps" value={exerciseDraft.reps} onChange={(e) => setExerciseDraft((p) => ({ ...p, reps: e.target.value }))} />
            <Input placeholder="Tempo" value={exerciseDraft.tempo} onChange={(e) => setExerciseDraft((p) => ({ ...p, tempo: e.target.value }))} />
            <Input placeholder="Rest" value={exerciseDraft.rest} onChange={(e) => setExerciseDraft((p) => ({ ...p, rest: e.target.value }))} />
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAddExerciseOpen(false)}>Hủy</Button>
            <Button onClick={addExercise}><Plus className="h-4 w-4" />Thêm bài</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}