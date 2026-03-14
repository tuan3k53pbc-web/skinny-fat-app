import { supabase } from "./supabase";

export async function seedInitialData(userId, data) {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile) return;

  await supabase.from("profiles").insert({
    id: userId,
    name: data.profile.name,
    body_type: data.profile.bodyType,
    height_cm: data.profile.heightCm,
    current_weight: data.profile.currentWeight,
    target_weight: data.profile.targetWeight,
    plan_loss_rate: data.profile.planLossRateKgPerWeek,
    note: data.profile.note,
  });

  const weightRows = Object.entries(data.progress.weightLogsByDate || {}).map(([log_date, weight]) => ({
    user_id: userId,
    log_date,
    weight,
  }));
  if (weightRows.length) {
    await supabase.from("weight_logs").insert(weightRows);
  }

  if (data.nutrition?.foods?.length) {
    const foodRows = data.nutrition.foods.map((f) => ({
      user_id: userId,
      name: f.name,
      kcal: f.kcal,
      unit: f.unit,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
    }));
    await supabase.from("foods").insert(foodRows);
  }

  if (data.workout?.templates?.length) {
    const templateRows = data.workout.templates.map((t) => ({
      id: t.id,
      user_id: userId,
      name: t.name,
      label: t.label,
      burn: t.burn,
      note: t.note,
    }));
    await supabase.from("workout_templates").insert(templateRows);

    const exerciseRows = data.workout.templates.flatMap((t) =>
      t.exercises.map((e) => ({
        id: e.id,
        template_id: t.id,
        user_id: userId,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        tempo: e.tempo,
        rest: e.rest,
      }))
    );

    if (exerciseRows.length) {
      await supabase.from("workout_exercises").insert(exerciseRows);
    }
  }

  if (data.workout?.weeklySchedule?.length) {
    const scheduleRows = data.workout.weeklySchedule.map((s) => ({
      user_id: userId,
      day: s.day,
      template_id: s.templateId,
      title: s.title,
    }));
    await supabase.from("weekly_schedule").insert(scheduleRows);
  }
}