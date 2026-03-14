import { supabase } from "./supabase";

export async function saveUserData(userId, data) {
  await supabase.from("profiles").upsert({
    id: userId,
    name: data.profile.name,
    body_type: data.profile.bodyType,
    height_cm: data.profile.heightCm,
    current_weight: data.profile.currentWeight,
    target_weight: data.profile.targetWeight,
    plan_loss_rate: data.profile.planLossRateKgPerWeek,
    note: data.profile.note || "",
  });

  const weightRows = Object.entries(data.progress.weightLogsByDate || {}).map(([log_date, weight]) => ({
    user_id: userId,
    log_date,
    weight,
  }));
  if (weightRows.length) {
    await supabase.from("weight_logs").upsert(weightRows, { onConflict: "user_id,log_date" });
  }

  const waterRows = Object.entries(data.nutrition.waterByDate || {}).map(([log_date, amount_ml]) => ({
    user_id: userId,
    log_date,
    amount_ml,
  }));
  if (waterRows.length) {
    await supabase.from("water_logs").upsert(waterRows, { onConflict: "user_id,log_date" });
  }

  const workoutRows = Object.entries(data.workout.logsByDate || {}).map(([log_date, w]) => ({
    user_id: userId,
    log_date,
    template_id: w.templateId,
    extra_burn: w.extraBurn,
    done: w.done,
    note: w.note || "",
  }));
  if (workoutRows.length) {
    await supabase.from("workout_logs").upsert(workoutRows, { onConflict: "user_id,log_date" });
  }
}